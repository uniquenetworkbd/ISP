from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class ConnectorContext:
    device_id: int
    vendor: str
    device_type: str
    endpoint: str | None = None
    secret_ref: str | None = None


@dataclass
class ConnectorResult:
    status: str
    device_id: int
    observed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    data: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    capabilities: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.status == "ok"


class DeviceConnector(ABC):
    vendor: str = "unknown"
    device_types: tuple[str, ...] = ()

    @abstractmethod
    def capabilities(self) -> list[str]:
        raise NotImplementedError

    @abstractmethod
    def collect(self, context: ConnectorContext) -> ConnectorResult:
        raise NotImplementedError

    def probe(self, context: ConnectorContext) -> ConnectorResult:
        return ConnectorResult(
            status="unsupported",
            device_id=context.device_id,
            errors=["Connectivity probe is not implemented for this connector."],
            capabilities=self.capabilities(),
        )
