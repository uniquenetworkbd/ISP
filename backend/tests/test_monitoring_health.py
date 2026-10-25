from datetime import datetime, timezone

from fastapi.responses import JSONResponse

from app.api.routes.monitoring import monitoring_health


class HealthyDB:
    def execute(self, statement):
        return 1

    def scalar(self, statement):
        return None


class FailingDB:
    def execute(self, statement):
        raise RuntimeError("database unavailable")


def test_monitoring_health_does_not_claim_collection_when_no_samples_exist() -> None:
    result = monitoring_health(HealthyDB())
    assert result["status"] == "ok"
    assert result["database"] == "ok"
    assert result["collector"] == "no_samples_yet"
    assert result["last_metric_at"] is None


def test_monitoring_health_reports_database_failure() -> None:
    result = monitoring_health(FailingDB())
    assert isinstance(result, JSONResponse)
    assert result.status_code == 503


def test_monitoring_health_reports_recent_telemetry_as_fresh(monkeypatch) -> None:
    class RecentDB(HealthyDB):
        def scalar(self, statement):
            return datetime.now(timezone.utc)

    monkeypatch.setenv("MONITORING_INTERVAL_SECONDS", "60")
    result = monitoring_health(RecentDB())
    assert result["collector"] == "fresh"
    assert result["last_metric_age_seconds"] == 0
