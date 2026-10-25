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
