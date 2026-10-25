from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal


TelemetryStatus = Literal["ok", "unsupported", "profile_pending", "error"]


@dataclass(frozen=True)
class PONRecord:
    pon_id: str
    status: str | None = None
    observed_at: datetime | None = None
    vendor: str | None = None
    model: str | None = None
    source: str | None = None


@dataclass(frozen=True)
class ONURecord:
    pon_id: str
    onu_id: str
    serial: str | None = None
    status: str | None = None
    rx_power_dbm: float | None = None
    tx_power_dbm: float | None = None
    distance_m: float | None = None
    temperature_c: float | None = None
    observed_at: datetime | None = None
    vendor: str | None = None
    model: str | None = None
    source: str | None = None


@dataclass(frozen=True)
class CollectorResult:
    status: TelemetryStatus
    records: tuple[Any, ...] = ()
    errors: tuple[str, ...] = ()
    capabilities: tuple[str, ...] = ()
    profile_id: str | None = None

    @property
    def ok(self) -> bool:
        return self.status == "ok"


def pending_vendor_telemetry(profile_id: str | None, capabilities: tuple[str, ...]) -> CollectorResult:
    return CollectorResult(
        status="profile_pending",
        capabilities=capabilities,
        profile_id=profile_id,
        errors=("Vendor PON/ONU MIB profile is not validated yet.",),
    )
