from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.connectors.base import ConnectorResult


_UNIT_BY_NAME = {
    "cpu_percent": "%",
    "memory_percent": "%",
    "traffic_mbps": "Mbps",
    "rx_dbm": "dBm",
    "tx_dbm": "dBm",
    "temperature_c": "C",
    "distance_m": "m",
}


def normalize_metrics(result: ConnectorResult) -> list[dict[str, Any]]:
    """Convert connector numeric payload fields into Metric-ready records."""
    records: list[dict[str, Any]] = []
    for name, value in result.data.items():
        if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
            continue
        records.append(
            {
                "device_id": result.device_id,
                "metric_name": name,
                "metric_value": value,
                "unit": _UNIT_BY_NAME.get(name),
                "recorded_at": result.observed_at,
            }
        )
    return records
