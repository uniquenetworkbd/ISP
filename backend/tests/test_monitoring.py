from app.connectors.base import ConnectorContext
from app.connectors.registry import build_default_connector_manager
from app.monitoring.alerts import evaluate_result
from app.monitoring.normalizer import normalize_metrics


def test_normalizer_extracts_numeric_metrics() -> None:
    manager = build_default_connector_manager()
    result = manager.collect(ConnectorContext(device_id=7, vendor="mock", device_type="router"))
    metrics = normalize_metrics(result)
    names = {item["metric_name"] for item in metrics}
    assert names == {"cpu_percent", "memory_percent", "traffic_mbps"}


def test_alert_evaluator_flags_thresholds() -> None:
    manager = build_default_connector_manager()
    result = manager.collect(ConnectorContext(device_id=7, vendor="mock", device_type="router"))
    result.data["cpu_percent"] = 95.0
    alerts = evaluate_result(result)
    assert len(alerts) == 1
    assert alerts[0]["severity"] == "warning"


def test_alert_evaluator_flags_collection_failure() -> None:
    manager = build_default_connector_manager()
    result = manager.collect(ConnectorContext(device_id=8, vendor="mikrotik", device_type="router"))
    alerts = evaluate_result(result)
    assert len(alerts) == 1
    assert alerts[0]["severity"] == "critical"
