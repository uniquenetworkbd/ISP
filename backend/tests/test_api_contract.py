from app.main import app


def test_api_contract_routes_registered() -> None:
    paths = {route.path for route in app.routes}
    expected = {
        "/api/auth/login",
        "/api/auth/me",
        "/api/devices/",
        "/api/monitoring/summary",
        "/api/monitoring/metrics",
        "/api/monitoring/alerts",
        "/api/monitoring/alerts/{alert_id}/acknowledge",
        "/api/monitoring/alerts/{alert_id}/resolve",
        "/api/network/zones",
        "/api/network/pops",
        "/api/network/topology",
        "/api/database/health",
    }
    assert expected <= paths
