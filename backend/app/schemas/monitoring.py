from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int
    metric_name: str
    metric_value: Decimal | None
    unit: str | None
    recorded_at: datetime


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int | None
    severity: str
    status: str
    title: str
    message: str | None
    detected_at: datetime
    resolved_at: datetime | None


class AlertAction(BaseModel):
    status: str = Field(pattern="^(acknowledged|resolved)$")


class MonitoringSummary(BaseModel):
    total_devices: int
    online_devices: int
    unreachable_devices: int
    unknown_devices: int
    open_alerts: int
    critical_alerts: int
    warning_alerts: int
    latest_metrics: list[MetricRead]
