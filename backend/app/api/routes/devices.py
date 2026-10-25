from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.audit import record_audit
from app.db import get_db
from app.models import Device, User
from app.schemas.device import DeviceCreate, DeviceRead

router = APIRouter()


@router.get("/", response_model=dict[str, list[DeviceRead]])
def list_devices(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> dict[str, list[DeviceRead]]:
    devices = db.scalars(select(Device).order_by(Device.id)).all()
    return {"items": [DeviceRead.model_validate(device, from_attributes=True) for device in devices]}


@router.post("/", response_model=DeviceRead, status_code=201)
def create_device(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "operator")),
) -> DeviceRead:
    device = Device(**payload.model_dump(), status="unknown")
    db.add(device)
    db.flush()
    record_audit(
        db,
        action="device.created",
        user_id=user.id,
        resource_type="device",
        resource_id=device.id,
        details={"device_type": device.device_type, "vendor": device.vendor},
    )
    db.commit()
    db.refresh(device)
    return DeviceRead.model_validate(device, from_attributes=True)


@router.get("/{device_id}", response_model=DeviceRead)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> DeviceRead:
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return DeviceRead.model_validate(device, from_attributes=True)
