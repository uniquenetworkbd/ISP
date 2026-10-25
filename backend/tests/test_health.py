from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app


class FakeSession:
    def __init__(self) -> None:
        self.statements: list[str] = []

    def execute(self, statement) -> None:
        self.statements.append(str(statement))


def test_health() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_checks_database() -> None:
    session = FakeSession()
    app.dependency_overrides[get_db] = lambda: session
    try:
        response = TestClient(app).get("/health/ready")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["database"] == "ok"
    assert session.statements == ["SELECT 1"]


def test_readiness_returns_503_when_database_check_fails() -> None:
    class FailingSession:
        def execute(self, statement):
            raise RuntimeError("database unavailable")

    app.dependency_overrides[get_db] = lambda: FailingSession()
    try:
        response = TestClient(app, raise_server_exceptions=False).get("/health/ready")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["status"] == "not_ready"
    assert response.json()["database"] == "unavailable"
