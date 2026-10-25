from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import StrEnum


class CircuitState(StrEnum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass(frozen=True)
class CircuitPolicy:
    failure_threshold: int = 3
    cooldown_seconds: int = 60
    half_open_probe_limit: int = 1


@dataclass
class CircuitBreaker:
    state: CircuitState = CircuitState.CLOSED
    consecutive_failures: int = 0
    opened_at: datetime | None = None
    next_probe_at: datetime | None = None
    probe_in_flight: int = 0
    policy: CircuitPolicy = field(default_factory=CircuitPolicy)

    def allow_request(self, now: datetime | None = None) -> bool:
        now = _utc(now)
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if self.next_probe_at is None or now < self.next_probe_at:
                return False
            self.state = CircuitState.HALF_OPEN
            self.probe_in_flight = 0
        if self.probe_in_flight >= self.policy.half_open_probe_limit:
            return False
        self.probe_in_flight += 1
        return True

    def record_success(self, now: datetime | None = None) -> None:
        _ = _utc(now)
        self.state = CircuitState.CLOSED
        self.consecutive_failures = 0
        self.opened_at = None
        self.next_probe_at = None
        self.probe_in_flight = 0

    def record_failure(self, now: datetime | None = None) -> None:
        now = _utc(now)
        self.probe_in_flight = max(0, self.probe_in_flight - 1)
        self.consecutive_failures += 1
        if self.state == CircuitState.HALF_OPEN or self.consecutive_failures >= self.policy.failure_threshold:
            self.state = CircuitState.OPEN
            self.opened_at = now
            self.next_probe_at = now + timedelta(seconds=self.policy.cooldown_seconds)


def _utc(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
