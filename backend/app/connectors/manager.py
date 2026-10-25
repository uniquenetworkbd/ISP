from __future__ import annotations

from dataclasses import dataclass

from .base import ConnectorContext, ConnectorResult, DeviceConnector


@dataclass(frozen=True)
class ConnectorKey:
    vendor: str
    device_type: str


class ConnectorManager:
    """Deterministic registry for vendor/device connector adapters."""

    def __init__(self) -> None:
        self._registry: dict[ConnectorKey, DeviceConnector] = {}

    def register(self, connector: DeviceConnector) -> None:
        for device_type in connector.device_types:
            self._registry[ConnectorKey(connector.vendor.lower(), device_type.lower())] = connector

    def resolve(self, vendor: str, device_type: str) -> DeviceConnector:
        key = ConnectorKey(vendor.lower(), device_type.lower())
        try:
            return self._registry[key]
        except KeyError as exc:
            raise LookupError(f"No connector registered for {vendor}/{device_type}") from exc

    def capabilities(self, vendor: str, device_type: str) -> list[str]:
        return self.resolve(vendor, device_type).capabilities()

    def collect(self, context: ConnectorContext) -> ConnectorResult:
        return self.resolve(context.vendor, context.device_type).collect(context)

    def registered_keys(self) -> list[ConnectorKey]:
        return sorted(self._registry, key=lambda item: (item.vendor, item.device_type))
