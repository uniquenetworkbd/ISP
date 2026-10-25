from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/status")
def system_status() -> dict[str, str | bool]:
    """Public transport/configuration probe used by the static frontend before auth."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "api": True,
        "database": "managed-by-readiness-probe",
    }
