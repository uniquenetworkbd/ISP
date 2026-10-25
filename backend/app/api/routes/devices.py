from fastapi import APIRouter

from app.schemas.device import DeviceCreate

router = APIRouter()


@router.get("/")
def list_devices() -> dict[str, list]:
    return {"items": []}


@router.post("/")
def create_device(payload: DeviceCreate) -> dict:
    return {"status": "accepted", "device": payload.model_dump()}
