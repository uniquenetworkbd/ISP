from app.connectors.base import ConnectorResult
from app.monitoring.normalizer import normalize_metrics


def test_normalizer_ignores_connector_metadata_but_keeps_numeric_metrics() -> None:
    result = ConnectorResult(
        status="ok",
        device_id=7,
        data={
            "host": "192.0.2.10",
            "port": 161,
            "protocol": "SNMPv2c",
            "vendor_telemetry": "requires_vendor_mib_profile",
            "sys_descr": "Example OLT",
            "cpu_percent": 23,
            "memory_percent": 51,
        },
    )

    records = normalize_metrics(result)

    assert {record["metric_name"] for record in records} == {"cpu_percent", "memory_percent"}
