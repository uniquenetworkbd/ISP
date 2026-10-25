from __future__ import annotations

from ..base import ConnectorContext, ConnectorResult
from .base import OLTConnector


class _UnavailableOLTAdapter(OLTConnector):
    vendor = "unknown"

    def collect(self, context: ConnectorContext) -> ConnectorResult:
        return ConnectorResult(
            status="not_connected",
            device_id=context.device_id,
            errors=[f"Live {self.vendor} OLT access is not enabled in the current preparation phase."],
            capabilities=self.capabilities(),
        )


class HuaweiOLTConnector(_UnavailableOLTAdapter):
    vendor = "huawei"


class ZTEOLTConnector(_UnavailableOLTAdapter):
    vendor = "zte"


class VSOLOLTConnector(_UnavailableOLTAdapter):
    vendor = "vsol"


class BDCOMOLTConnector(_UnavailableOLTAdapter):
    vendor = "bdcom"
