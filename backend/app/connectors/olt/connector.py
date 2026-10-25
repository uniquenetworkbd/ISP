from app.connectors.base import DeviceConnection, DeviceConnector


class OLTConnector(DeviceConnector):
    """Vendor-neutral OLT adapter boundary for future vendor drivers."""

    def test_connection(self, connection: DeviceConnection) -> bool:
        raise NotImplementedError("OLT transport is not enabled in the repository-only foundation")

    def collect_health(self, connection: DeviceConnection) -> dict:
        raise NotImplementedError("OLT transport is not enabled in the repository-only foundation")
