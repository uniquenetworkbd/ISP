from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_devices() -> dict[str, list]:
    return {"items": []}


@router.post("/")
def create_device(payload: dict) -> dict:
    return {"status": "accepted", "device": payload}
