"""Database-backed monitoring cycle with retry, credential and circuit boundaries."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.connectors.base import ConnectorContext, ConnectorResult
from app.connectors.registry import build_default_connector_manager
from app.credentials.provider import CredentialReference, SecretRefCredentialProvider
from app.models import Device, DeviceCredential, Metric
from app.monitoring.alerts import evaluate_result
from app.monitoring.circuit_breaker import CircuitBreaker, CircuitPolicy, CircuitState
from app.monitoring.dedup import deduplicate_candidates
from app.monitoring.lifecycle import apply_alert_lifecycle
from app.monitoring.normalizer import normalize_metrics
from app.monitoring.reliability import RetryPolicy, retry_call


CIRCUIT_POLICY = CircuitPolicy(failure_threshold=3, cooldown_seconds=60, half_open_probe_limit=1)
RETRY_POLICY = RetryPolicy(attempts=3, initial_delay_seconds=0.25, backoff_factor=2.0, timeout_seconds=10.0)


class _CollectionFailure(RuntimeError):
    pass


def _breaker_from_device(device: Device) -> CircuitBreaker:
    return CircuitBreaker(
        state=CircuitState(device.circuit_state or CircuitState.CLOSED),
        consecutive_failures=device.consecutive_failures or 0,
        opened_at=device.circuit_opened_at,
        next_probe_at=device.circuit_next_probe_at,
        policy=CIRCUIT_POLICY,
    )


def _persist_breaker(device: Device, breaker: CircuitBreaker) -> None:
    device.consecutive_failures = breaker.consecutive_failures
    device.circuit_state = breaker.state.value
    device.circuit_opened_at = breaker.opened_at
    device.circuit_next_probe_at = breaker.next_probe_at


def _collect_with_retry(connector_manager, context: ConnectorContext) -> ConnectorResult:
    last_result: ConnectorResult | None = None

    def collect_once() -> ConnectorResult:
        nonlocal last_result
        result = connector_manager.collect(context)
        last_result = result
        if not result.ok:
            raise _CollectionFailure("connector returned a non-ok result")
        return result

    try:
        return retry_call(collect_once, RETRY_POLICY)
    except Exception:
        observed_at = last_result.observed_at if last_result else datetime.now(timezone.utc)
        errors = last_result.errors if last_result and last_result.errors else [
            "Connector collection failed after bounded retries."
        ]
        return ConnectorResult(
            status="error",
            device_id=context.device_id,
            observed_at=observed_at,
            errors=errors,
        )


def run_monitor_cycle(
    db: Session,
    *,
    manager=None,
    credential_provider: SecretRefCredentialProvider | None = None,
) -> dict[str, int]:
    connector_manager = manager or build_default_connector_manager()
    provider = credential_provider or SecretRefCredentialProvider()
    devices = list(db.scalars(select(Device).order_by(Device.id)))
    credential_refs = {
        item.device_id: item.secret_ref for item in db.scalars(select(DeviceCredential)).all()
    }
    metrics_written = 0
    skipped_circuit = 0
    totals = {"created": 0, "repeated": 0, "reopened": 0, "recovered": 0, "resolved": 0}

    for device in devices:
        if not device.vendor:
            device.status = "unknown"
            continue

        now = datetime.now(timezone.utc)
        breaker = _breaker_from_device(device)
        if not breaker.allow_request(now):
            device.status = "circuit_open"
            skipped_circuit += 1
            continue

        secret_ref = credential_refs.get(device.id)
        if secret_ref:
            # Resolve only through the injected provider boundary. The connector
            # context retains the reference; no secret is persisted or logged here.
            provider.resolve(CredentialReference(secret_ref=secret_ref))

        result = _collect_with_retry(
            connector_manager,
            ConnectorContext(
                device_id=device.id,
                vendor=device.vendor,
                device_type=device.device_type,
                endpoint=device.management_address,
                secret_ref=secret_ref,
            ),
        )

        if result.ok:
            breaker.record_success(result.observed_at)
            device.status = "online"
        else:
            breaker.record_failure(result.observed_at)
            device.status = "unreachable"
            device.last_failure_at = result.observed_at

        _persist_breaker(device, breaker)

        for record in normalize_metrics(result):
            db.add(Metric(**record))
            metrics_written += 1

        candidates = deduplicate_candidates(evaluate_result(result))
        lifecycle = apply_alert_lifecycle(
            db,
            device_id=device.id,
            candidates=candidates,
            observed_at=result.observed_at,
        )
        for key, value in lifecycle.items():
            totals[key] += value

    db.commit()
    return {
        "devices_checked": len(devices),
        "metrics_written": metrics_written,
        "devices_circuit_skipped": skipped_circuit,
        "alerts_created": totals["created"],
        "alerts_repeated": totals["repeated"],
        "alerts_reopened": totals["reopened"],
        "alerts_recovered": totals["recovered"],
        "alerts_resolved": totals["resolved"],
    }
