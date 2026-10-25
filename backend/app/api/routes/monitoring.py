from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.db import get_db
from app.models import Alert, Device, Metric, User
from app.schemas.monitoring import AlertRead, MetricRead, MonitoringSummary

router = APIRouter()


@router.get("/health")
def monitoring_health() -> dict[str, str]:
    return {"status": "ready", "mode": "database-backed"}


@router.get("/summary", response_model=MonitoringSummary)
def monitoring_summary(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> MonitoringSummary:
    devices = db.scalars(select(Device)).all()
    alerts = db.scalars(select(Alert).where(Alert.status.in_(["open", "acknowledged"]))).all()
    metrics = db.scalars(select(Metric).order_by(Metric.recorded_at.desc()).limit(20)).all()
    return MonitoringSummary(
        total_devices=len(devices),
        online_devices=sum(device.status == "online" for device in devices),
        unreachable_devices=sum(device.status == "unreachable" for device in devices),
        unknown_devices=sum(device.status == "unknown" for device in devices),
        open_alerts=len(alerts),
        critical_alerts=sum(alert.severity.lower() == "critical" for alert in alerts),
        warning_alerts=sum(alert.severity.lower() == "warning" for alert in alerts),
        latest_metrics=[MetricRead.model_validate(metric) for metric in metrics],
    )


@router.get("/metrics", response_model=dict[str, list[MetricRead]])
def list_metrics(
    device_id: int | None = None,
    metric_name: str | None = None,
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> dict[str, list[MetricRead]]:
    query = select(Metric).order_by(Metric.recorded_at.desc()).limit(limit)
    if device_id is not None:
        query = query.where(Metric.device_id == device_id)
    if metric_name:
        query = query.where(Metric.metric_name == metric_name)
    metrics = db.scalars(query).all()
    return {"items": [MetricRead.model_validate(metric) for metric in metrics]}


@router.get("/alerts", response_model=dict[str, list[AlertRead]])
def list_alerts(
    status: str | None = None,
    severity: str | None = None,
    device_id: int | None = None,
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> dict[str, list[AlertRead]]:
    query = select(Alert).order_by(Alert.detected_at.desc()).limit(limit)
    if status:
        query = query.where(Alert.status == status)
    if severity:
        query = query.where(Alert.severity == severity)
    if device_id is not None:
        query = query.where(Alert.device_id == device_id)
    alerts = db.scalars(query).all()
    return {"items": [AlertRead.model_validate(alert) for alert in alerts]}


@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertRead)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator")),
) -> AlertRead:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status == "resolved":
        raise HTTPException(status_code=409, detail="Resolved alert cannot be acknowledged")
    alert.status = "acknowledged"
    db.commit()
    db.refresh(alert)
    return AlertRead.model_validate(alert)


@router.post("/alerts/{alert_id}/resolve", response_model=AlertRead)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator")),
) -> AlertRead:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return AlertRead.model_validate(alert)
