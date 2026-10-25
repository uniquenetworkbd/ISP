from fastapi import APIRouter
from sqlalchemy import text

from app.db import engine

router = APIRouter()


@router.get("/health")
def database_health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "reachable"}
    except Exception:
        return {"status": "unavailable", "database": "unreachable"}
