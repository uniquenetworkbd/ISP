import json
from io import BytesIO
from unittest.mock import patch

from app.connectors.base import ConnectorContext
from app.connectors.mikrotik import MikroTikConnector
from app.connectors.registry import build_default_connector_manager


def test_default_connector_registry() -> None:
    manager = build_default_connector_manager()
    assert manager.resolve("mikrotik", "router").vendor == "mikrotik"
    assert manager.resolve("huawei", "olt").vendor == "huawei"
    assert manager.resolve("zte", "olt").vendor == "zte"
    assert manager.resolve("vsol", "olt").vendor == "vsol"
    assert manager.resolve("bdcom", "olt").vendor == "bdcom"


def test_mock_connector_collects_without_network() -> None:
    manager = build_default_connector_manager()
    result = manager.collect(
        ConnectorContext(device_id=7, vendor="mock", device_type="router")
    )
    assert result.ok
    assert result.data["reachable"] is True
    assert result.data["source"] == "mock"


def test_mikrotik_requires_resolved_credentials() -> None:
    result = MikroTikConnector().collect(
        ConnectorContext(device_id=8, vendor="mikrotik", device_type="router", endpoint="10.0.0.1")
    )
    assert result.status == "error"
    assert result.errors


def test_mikrotik_rest_collects_resource_metrics() -> None:
    payloads = [
        [{"cpu-load": "12", "total-memory": "1000", "free-memory": "250"}],
        [{"cpu-temperature": "430"}],
    ]

    class FakeResponse(BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    def fake_urlopen(request, timeout, context):
        return FakeResponse(json.dumps(payloads.pop(0)).encode())

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        result = MikroTikConnector().collect(
            ConnectorContext(
                device_id=9,
                vendor="mikrotik",
                device_type="router",
                endpoint="https://10.0.0.1",
                credential={"username": "monitor", "password": "secret"},
            )
        )

    assert result.ok
    assert result.data["cpu_percent"] == 12
    assert result.data["memory_percent"] == 75
    assert result.data["temperature_c"] == 43


def test_olt_probe_requires_community_and_endpoint() -> None:
    manager = build_default_connector_manager()
    connector = manager.resolve("huawei", "olt")
    result = connector.probe(ConnectorContext(device_id=10, vendor="huawei", device_type="olt"))
    assert result.status == "error"
    assert "community" in result.errors[0].lower()


def test_olt_probe_returns_generic_snmp_system_fields_without_claiming_vendor_telemetry() -> None:
    class FakeOLTConnector:
        vendor = "huawei"
        device_types = ("olt",)

        def capabilities(self):
            return ["snmp_system_probe", "sys_descr", "sys_name", "sys_uptime"]

        async def _query_system(self, host, port, community, timeout):
            assert (host, port, community, timeout) == ("192.0.2.10", 161, "test-community", 2.0)
            return {"sys_descr": "Test OLT", "sys_name": "OLT-LAB", "sys_uptime_ticks": "12345"}

    from app.connectors.olt.base import OLTConnector

    class TestOLTConnector(OLTConnector):
        vendor = "huawei"

        async def _query_system(self, host, port, community, timeout):
            assert (host, port, community, timeout) == ("192.0.2.10", 161, "test-community", 2.0)
            return {"sys_descr": "Test OLT", "sys_name": "OLT-LAB", "sys_uptime_ticks": "12345"}

    result = TestOLTConnector().probe(
        ConnectorContext(
            device_id=11,
            vendor="huawei",
            device_type="olt",
            endpoint="192.0.2.10",
            credential={"community": "test-community", "timeout_seconds": 2},
        )
    )
    assert result.ok
    assert result.data["sys_name"] == "OLT-LAB"
    assert result.data["protocol"] == "SNMPv2c"
    assert result.data["vendor_telemetry"] == "requires_vendor_mib_profile"


def test_olt_endpoint_parser_validates_port() -> None:
    from app.connectors.olt.base import OLTConnector

    assert OLTConnector._target("udp://192.0.2.20:1161") == ("192.0.2.20", 1161)
    try:
        OLTConnector._target("192.0.2.20:99999")
    except ValueError as exc:
        assert "port" in str(exc).lower()
    else:
        raise AssertionError("Invalid SNMP port should be rejected")
