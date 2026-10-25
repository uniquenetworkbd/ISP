from typing import Literal

from pydantic import BaseModel, Field


DeviceType = Literal["mikrotik", "olt", "onu", "switch", "interface"]


class DeviceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    device_type: DeviceType
    vendor: str | None = None
    model: str | None = None
    management_address: str | None = None
    pop_id: int | None = None


class DeviceRead(DeviceCreate):
    id: int
    status: str
