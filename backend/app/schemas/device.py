from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


DeviceType = Literal["mikrotik", "olt", "onu", "switch", "interface"]
AccessMode = Literal["read", "write", "full"]


class DeviceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    device_type: DeviceType
    vendor: str | None = None
    model: str | None = None
    management_address: str | None = None
    pop_id: int | None = None
    access_mode: AccessMode = "read"
    timeout_seconds: int = Field(default=10, ge=1, le=120)


class DeviceRead(DeviceCreate):
    id: int
    status: str
    routeros_version: str | None = None
    last_scan_at: datetime | None = None
    last_live_at: datetime | None = None


class MikroTikServerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    server_ip: str = Field(min_length=1, max_length=255)
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=512)
    port: int = Field(default=443, ge=1, le=65535)
    timeout_seconds: int = Field(default=10, ge=1, le=120)
    access_mode: AccessMode = "read"
    vendor: str = "mikrotik"
    model: str | None = None
    pop_id: int | None = None


class MikroTikServerRead(BaseModel):
    id: int
    name: str
    server_ip: str
    username: str
    port: int
    timeout_seconds: int
    access_mode: AccessMode
    vendor: str
    model: str | None
    routeros_version: str | None
    status: str
    last_scan_at: datetime | None
    last_live_at: datetime | None
    user_count: int


class MikroTikConnectionTest(BaseModel):
    server_ip: str
    username: str
    password: str
    port: int = Field(default=443, ge=1, le=65535)
    timeout_seconds: int = Field(default=10, ge=1, le=120)


class MikroTikScanResult(BaseModel):
    server_id: int
    users_scanned: int
    users_created: int
    users_updated: int
    active_users: int
    synced_at: datetime


class MikroTikUserRead(BaseModel):
    id: int
    device_id: int
    username: str
    customer_name: str | None
    service_profile: str | None
    service: str | None
    assigned_ip: str | None
    caller_id: str | None
    status_snapshot: str
    last_live_ip: str | None
    last_live_uptime: str | None
    last_synced_at: datetime
