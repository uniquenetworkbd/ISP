from __future__ import annotations

import pytest

from app.monitoring.dedup import deduplicate_candidates
from app.monitoring.reliability import RetryPolicy, retry_call


def test_retry_policy_backoff() -> None:
    assert RetryPolicy(attempts=3, initial_delay_seconds=0.5).delays() == [0.5, 1.0]


def test_retry_call_retries_then_succeeds() -> None:
    attempts = 0
    sleeps: list[float] = []

    def operation() -> str:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise ConnectionError("temporary")
        return "ok"

    assert retry_call(operation, RetryPolicy(attempts=3), sleep=sleeps.append) == "ok"
    assert attempts == 3
    assert sleeps == [0.25, 0.5]


def test_retry_call_raises_final_error() -> None:
    def operation() -> None:
        raise TimeoutError("offline")

    with pytest.raises(TimeoutError, match="offline"):
        retry_call(operation, RetryPolicy(attempts=2), sleep=lambda _: None)


def test_alert_candidates_are_deduplicated() -> None:
    candidates = [
        {"device_id": 1, "severity": "warning", "title": "CPU high"},
        {"device_id": 1, "severity": "warning", "title": "CPU high"},
        {"device_id": 1, "severity": "critical", "title": "CPU high"},
    ]
    result = deduplicate_candidates(candidates)
    assert len(result) == 2
    assert all("fingerprint" in item for item in result)
