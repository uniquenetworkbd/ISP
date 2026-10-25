"""Database-backed monitoring cycle."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.connectors.base import ConnectorContext
from app.connectors.registry import build_default_connector_manager
from app.models import Device, DeviceCredential, Metric
from app.monitoring.alerts import evaluate_result
from app.monitoring.dedup import deduplicate_candidates
from app.monitoring.lifecycle import apply_alert_lifecycle
from app.monitoring.normalizer import normalize_metrics


def run_monitor_cycle(db: Session, *, manager=None) -> dict[str, int]:
    connector_manager = manager or build_default_connector_manager()
    devices = list(db.scalars(select(Device).order_by(Device.id)))
    credential_refs = {
        item.device_id: item.secret_ref for item in db.scalars(select(DeviceCredential)).all()
    }
    metrics_written = 0
    totals = {"created": 0, "repeated": 0, "reopened": 0, "recovered": 0, "resolved": 0}

    for device in devices:
        if not device.vendor:
            device.status = "unknown"
            continue
        result = connector_manager.collect(
            ConnectorContext(
                device_id=device.id,
                vendor=device.vendor,
                device_type=device.device_type,
                endpoint=device.management_address,
                secret_ref=credential_refs.get(device.id),
            )
        )
        device.status = "online" if result.ok else "unreachable"
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
        "alerts_created": totals["created"],
        "alerts_repeated": totals["repeated"],
        "alerts_reopened": totals["reopened"],
        "alerts_recovered": totals["recovered"],
        "alerts_resolved": totals["resolved"],
    }
