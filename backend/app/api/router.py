from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.database import router as database_router
from app.api.routes.devices import router as devices_router
from app.api.routes.monitoring import router as monitoring_router
from app.api.routes.network import router as network_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(devices_router, prefix="/devices", tags=["devices"])
api_router.include_router(monitoring_router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(network_router, prefix="/network", tags=["network"])
api_router.include_router(database_router, prefix="/database", tags=["database"])
