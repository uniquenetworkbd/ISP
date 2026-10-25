import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.routes.audit import router as audit_router
from app.api.routes.auth import router as auth_router
from app.api.routes.database import router as database_router
from app.api.routes.devices import router as devices_router
from app.api.routes.monitoring import router as monitoring_router
from app.api.routes.network import router as network_router
from app.api.routes.olt import router as olt_router
from app.api.routes.system import router as system_router
from app.core.config import settings, validate_production_configuration
from app.db import get_db

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(devices_router, prefix="/api/devices", tags=["devices"])
app.include_router(olt_router, prefix="/api/olt", tags=["olt"])
app.include_router(monitoring_router, prefix="/api/monitoring", tags=["monitoring"])
app.include_router(network_router, prefix="/api/network", tags=["network"])
app.include_router(database_router, prefix="/api/database", tags=["database"])
app.include_router(audit_router, prefix="/api/audit", tags=["audit"])
app.include_router(system_router, prefix="/api/system", tags=["system"])


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get("/health/ready", tags=["system"])
def readiness(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ready", "service": settings.app_name, "database": "ok"}


@app.on_event("startup")
def validate_runtime_configuration() -> None:
    validate_production_configuration(
        app_env=settings.app_env,
        database_url=settings.database_url,
        allowed_origins=settings.allowed_origins,
        jwt_secret=settings.jwt_secret,
        encryption_key=os.getenv("CREDENTIAL_ENCRYPTION_KEY"),
    )
