from __future__ import annotations

import asyncio
import os
import time
from collections.abc import Callable

from app.db import SessionLocal
from app.workers.monitor import run_monitor_cycle


DEFAULT_INTERVAL_SECONDS = 60


def monitoring_interval_seconds() -> int:
    value = os.getenv("MONITORING_INTERVAL_SECONDS", str(DEFAULT_INTERVAL_SECONDS))
    try:
        return max(5, int(value))
    except ValueError:
        return DEFAULT_INTERVAL_SECONDS


def run_once() -> dict[str, int]:
    db = SessionLocal()
    try:
        return run_monitor_cycle(db)
    finally:
        db.close()


async def run_forever(
    *,
    interval_seconds: int | None = None,
    cycle: Callable[[], dict[str, int]] = run_once,
    stop_event: asyncio.Event | None = None,
) -> None:
    interval = interval_seconds or monitoring_interval_seconds()
    stop = stop_event or asyncio.Event()
    while not stop.is_set():
        started = time.monotonic()
        await asyncio.to_thread(cycle)
        elapsed = time.monotonic() - started
        await asyncio.wait_for(stop.wait(), timeout=max(0, interval - elapsed))


if __name__ == "__main__":
    asyncio.run(run_forever())
