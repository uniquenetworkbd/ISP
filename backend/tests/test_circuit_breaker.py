from datetime import datetime, timedelta, timezone

from app.monitoring.circuit_breaker import CircuitBreaker, CircuitPolicy, CircuitState


def test_circuit_opens_at_failure_threshold() -> None:
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    breaker = CircuitBreaker(policy=CircuitPolicy(failure_threshold=3, cooldown_seconds=60))

    for _ in range(2):
        assert breaker.allow_request(now)
        breaker.record_failure(now)

    assert breaker.state == CircuitState.CLOSED
    assert breaker.consecutive_failures == 2

    assert breaker.allow_request(now)
    breaker.record_failure(now)
    assert breaker.state == CircuitState.OPEN
    assert not breaker.allow_request(now)


def test_circuit_allows_single_half_open_probe_then_closes_on_success() -> None:
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    breaker = CircuitBreaker(
        policy=CircuitPolicy(failure_threshold=1, cooldown_seconds=60, half_open_probe_limit=1)
    )
    assert breaker.allow_request(now)
    breaker.record_failure(now)

    assert not breaker.allow_request(now + timedelta(seconds=59))
    probe_time = now + timedelta(seconds=60)
    assert breaker.allow_request(probe_time)
    assert not breaker.allow_request(probe_time)

    breaker.record_success(probe_time)
    assert breaker.state == CircuitState.CLOSED
    assert breaker.consecutive_failures == 0
    assert breaker.allow_request(probe_time)


def test_half_open_failure_reopens_circuit() -> None:
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    breaker = CircuitBreaker(policy=CircuitPolicy(failure_threshold=1, cooldown_seconds=30))
    assert breaker.allow_request(now)
    breaker.record_failure(now)

    probe_time = now + timedelta(seconds=30)
    assert breaker.allow_request(probe_time)
    breaker.record_failure(probe_time)

    assert breaker.state == CircuitState.OPEN
    assert breaker.next_probe_at == probe_time + timedelta(seconds=30)
