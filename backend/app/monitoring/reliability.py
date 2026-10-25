from __future__ import annotations

from dataclasses import dataclass
from time import monotonic
from typing import Callable, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class RetryPolicy:
    attempts: int = 3
    initial_delay_seconds: float = 0.25
    backoff_factor: float = 2.0
    timeout_seconds: float = 10.0

    def delays(self) -> list[float]:
        if self.attempts <= 1:
            return []
        return [self.initial_delay_seconds * (self.backoff_factor ** i) for i in range(self.attempts - 1)]


def retry_call(fn: Callable[[], T], policy: RetryPolicy, *, sleep: Callable[[float], None]) -> T:
    last_error: Exception | None = None
    for attempt in range(max(1, policy.attempts)):
        started = monotonic()
        try:
            value = fn()
            if monotonic() - started > policy.timeout_seconds:
                raise TimeoutError("monitoring operation exceeded timeout budget")
            return value
        except Exception as exc:
            last_error = exc
            if attempt >= policy.attempts - 1:
                break
            sleep(policy.delays()[attempt])
    assert last_error is not None
    raise last_error
