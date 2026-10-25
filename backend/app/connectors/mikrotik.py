from __future__ import annotations

from .base import ConnectorContext, ConnectorResult, DeviceConnector


class MikroTikConnector(DeviceConnector):
    vendor = "mikrotik"
    device_types = ("router", "mikrotik")

    def capabilities(self) -> list[str]:
        return ["health", "interfaces", "pppoe", "system-resource"]

    def collect(self, context: ConnectorContext) -> ConnectorResult:
        return ConnectorResult(
            status="not_connected",
            device_id=context.device_id,
            errors=["Live MikroTik access is not enabled in the current preparation phase."],
            capabilities=self.capabilities(),
        )
