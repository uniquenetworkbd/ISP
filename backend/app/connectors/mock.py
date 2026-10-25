from __future__ import annotations

from .base import ConnectorContext, ConnectorResult, DeviceConnector


class MockConnector(DeviceConnector):
    vendor = "mock"
    device_types = ("router", "olt", "onu")

    def capabilities(self) -> list[str]:
        return ["health", "interfaces", "optical"]

    def collect(self, context: ConnectorContext) -> ConnectorResult:
        return ConnectorResult(
            status="ok",
            device_id=context.device_id,
            data={
                "source": "mock",
                "reachable": True,
                "cpu_percent": 18.5,
                "memory_percent": 41.0,
                "traffic_mbps": 125.0,
            },
            capabilities=self.capabilities(),
        )
