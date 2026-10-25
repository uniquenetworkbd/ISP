from app.main import app


def test_frontend_required_api_routes_are_registered() -> None:
    paths = app.openapi()["paths"]
    assert "/api/auth/login" in paths
    assert "/api/mikrotik/servers" in paths
    assert "/api/mikrotik/test-connection" in paths
    assert "/api/olt/servers" in paths
    assert "/api/olt/profiles" in paths
    assert "/api/olt/test-connection" in paths
    assert "/api/monitoring/summary" in paths
    assert "/api/network/topology" in paths
