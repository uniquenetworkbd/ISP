from app.main import app


EXPECTED_FRONTEND_API_PATHS = {
    "/api/auth/login",
    "/api/auth/me",
    "/api/auth/roles",
    "/api/system/status",
    "/api/devices/",
    "/api/monitoring/health",
    "/api/monitoring/summary",
    "/api/monitoring/metrics",
    "/api/monitoring/alerts",
    "/api/monitoring/alerts/{alert_id}/acknowledge",
    "/api/monitoring/alerts/{alert_id}/resolve",
    "/api/network/zones",
    "/api/network/pops",
    "/api/network/topology",
    "/api/database/health",
    "/api/olt/servers",
    "/api/olt/test-connection",
    "/api/olt/servers/{server_id}/probe",
    "/api/olt/servers/{server_id}",
    "/api/mikrotik/servers",
    "/api/mikrotik/test-connection",
    "/api/mikrotik/servers/{server_id}/test",
    "/api/mikrotik/servers/{server_id}/scan",
    "/api/mikrotik/servers/{server_id}/users",
    "/api/mikrotik/servers/{server_id}/live",
    "/api/mikrotik/servers/{server_id}/connection-tests",
}


def test_frontend_api_contract_paths_are_registered() -> None:
    paths = set(app.openapi()["paths"])
    missing = sorted(EXPECTED_FRONTEND_API_PATHS - paths)
    assert not missing, f"Frontend API contract paths are missing: {missing}"
