import asyncio

from app.scheduler import monitoring_interval_seconds, run_forever


def test_monitoring_interval_defaults_and_minimum(monkeypatch) -> None:
    monkeypatch.delenv("MONITORING_INTERVAL_SECONDS", raising=False)
    assert monitoring_interval_seconds() == 60
    monkeypatch.setenv("MONITORING_INTERVAL_SECONDS", "2")
    assert monitoring_interval_seconds() == 5
    monkeypatch.setenv("MONITORING_INTERVAL_SECONDS", "invalid")
    assert monitoring_interval_seconds() == 60


def test_scheduler_runs_cycle_until_stopped() -> None:
    async def scenario() -> list[int]:
        calls: list[int] = []
        stop = asyncio.Event()

        def cycle() -> dict[str, int]:
            calls.append(1)
            stop.set()
            return {}

        await run_forever(interval_seconds=5, cycle=cycle, stop_event=stop)
        return calls

    assert asyncio.run(scenario()) == [1]


def test_scheduler_survives_a_failed_cycle_and_stops_cleanly(caplog) -> None:
    async def scenario() -> list[str]:
        calls: list[str] = []
        stop = asyncio.Event()

        def cycle() -> dict[str, int]:
            calls.append("failed")
            stop.set()
            raise RuntimeError("transient database outage")

        await run_forever(interval_seconds=5, cycle=cycle, stop_event=stop)
        return calls

    assert asyncio.run(scenario()) == ["failed"]
    assert "Monitoring cycle failed" in caplog.text
