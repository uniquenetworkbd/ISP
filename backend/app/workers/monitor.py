"""Monitoring worker boundary.

The worker will later poll registered devices through connector adapters and persist
metrics/alerts. It intentionally performs no external device calls in this phase.
"""


def run_monitor_cycle() -> dict[str, int]:
    return {"devices_checked": 0, "metrics_written": 0, "alerts_created": 0}
