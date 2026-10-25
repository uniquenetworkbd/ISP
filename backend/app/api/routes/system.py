from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db

router = APIRouter()


@router.get("/status")
def system_status(db: Session = Depends(get_db)):
    """Public frontend probe; reports real database reachability, not configured intent."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        # Never expose driver errors, connection strings, or infrastructure details publicly.
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "service": settings.app_name,
                "version": settings.app_version,
                "api": True,
                "database": "unavailable",
            },
        )
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "api": True,
        "database": "ok",
    }
