from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def monitoring_health() -> dict[str, str]:
    return {"status": "ready", "mode": "integration-ready"}
