"""Database-backed monitoring cycle."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.connectors.base import ConnectorContext
from app.connectors.registry import build_default_connector_manager
from app.models import Alert, Device, DeviceCredential, Metric
from app.monitoring.alerts import evaluate_result
from app.monitoring.normalizer import normalize_metrics


def run_monitor_cycle(db: Session, *, manager=None) -> dict[str, int]:
    connector_manager = manager or build_default_connector_manager()
    devices = list(db.scalars(select(Device).order_by(Device.id)))
    credential_refs = {
        item.device_id: item.secret_ref for item in db.scalars(select(DeviceCredential)).all()
    }
    metrics_written = 0
    alerts_created = 0

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
        for candidate in evaluate_result(result):
            db.add(Alert(
                device_id=candidate["device_id"],
                severity=candidate["severity"],
                status="open",
                title=candidate["title"],
                message=candidate["message"],
                detected_at=result.observed_at,
            ))
            alerts_created += 1

    db.commit()
    return {
        "devices_checked": len(devices),
        "metrics_written": metrics_written,
        "alerts_created": alerts_created,
    }
