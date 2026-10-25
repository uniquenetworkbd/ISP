from app.connectors.base import ConnectorContext
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


def test_live_connectors_are_explicitly_not_connected() -> None:
    manager = build_default_connector_manager()
    result = manager.collect(
        ConnectorContext(device_id=8, vendor="mikrotik", device_type="router")
    )
    assert result.status == "not_connected"
    assert result.errors
