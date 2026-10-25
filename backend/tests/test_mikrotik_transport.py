from app.connectors.mikrotik import MikroTikConnector
from app.schemas.device import MikroTikConnectionTest, MikroTikServerCreate


def test_mikrotik_protocol_default_ports_are_distinct() -> None:
    base = {"name": "router", "server_ip": "192.0.2.1", "username": "monitor", "password": "not-a-real-secret"}
    assert MikroTikServerCreate(**base, protocol="rest").port == 443
    assert MikroTikServerCreate(**base, protocol="api").port == 8728
    assert MikroTikServerCreate(**base, protocol="api_ssl").port == 8729


def test_connection_test_protocol_default_ports_are_distinct() -> None:
    base = {"server_ip": "192.0.2.1", "username": "monitor", "password": "not-a-real-secret"}
    assert MikroTikConnectionTest(**base, protocol="rest").port == 443
    assert MikroTikConnectionTest(**base, protocol="api").port == 8728
    assert MikroTikConnectionTest(**base, protocol="api_ssl").port == 8729


def test_endpoint_uses_explicit_transport_without_secret_material() -> None:
    endpoint = MikroTikConnector._base_url("routeros-api-ssl://192.0.2.1:8729")
    assert endpoint == "routeros-api-ssl://192.0.2.1:8729"
    assert "password" not in endpoint
