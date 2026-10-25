from __future__ import annotations

from typing import Any


DEFAULT_THRESHOLDS: dict[str, tuple[float, str]] = {
    "cpu_percent": (90.0, "warning"),
    "memory_percent": (90.0, "warning"),
}


def evaluate_result(result: Any) -> list[dict[str, Any]]:
    """Produce normalized alert candidates without writing to the database."""
    if result.status != "ok":
        return [
            {
                "device_id": result.device_id,
                "severity": "critical",
                "title": "Device collection failed",
                "message": "; ".join(result.errors) or result.status,
            }
        ]

    alerts: list[dict[str, Any]] = []
    for metric_name, (limit, severity) in DEFAULT_THRESHOLDS.items():
        value = result.data.get(metric_name)
        if isinstance(value, (int, float)) and value >= limit:
            alerts.append(
                {
                    "device_id": result.device_id,
                    "severity": severity,
                    "title": f"{metric_name} threshold exceeded",
                    "message": f"{metric_name}={value} >= {limit}",
                }
            )
    return alerts
