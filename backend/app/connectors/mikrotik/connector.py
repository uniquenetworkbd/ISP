from app.connectors.base import DeviceConnection, DeviceConnector


class MikroTikConnector(DeviceConnector):
    """RouterOS adapter boundary. Transport implementation is intentionally deferred."""

    def test_connection(self, connection: DeviceConnection) -> bool:
        raise NotImplementedError("RouterOS transport is not enabled in the repository-only foundation")

    def collect_health(self, connection: DeviceConnection) -> dict:
        raise NotImplementedError("RouterOS transport is not enabled in the repository-only foundation")
