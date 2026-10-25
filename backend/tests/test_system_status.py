from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app


class FakeSession:
    def __init__(self, fail: bool = False) -> None:
        self.fail = fail
        self.statements: list[str] = []

    def execute(self, statement):
        self.statements.append(str(statement))
        if self.fail:
            raise RuntimeError("private database connection details")


def test_system_status_confirms_database_connectivity() -> None:
    session = FakeSession()
    app.dependency_overrides[get_db] = lambda: session
    try:
        response = TestClient(app).get("/api/system/status")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["api"] is True
    assert response.json()["database"] == "ok"
    assert session.statements == ["SELECT 1"]


def test_system_status_reports_database_outage_without_leaking_details() -> None:
    session = FakeSession(fail=True)
    app.dependency_overrides[get_db] = lambda: session
    try:
        response = TestClient(app).get("/api/system/status")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["status"] == "degraded"
    assert response.json()["api"] is True
    assert response.json()["database"] == "unavailable"
    assert "private database connection details" not in response.text
