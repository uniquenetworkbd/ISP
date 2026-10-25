from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.audit import record_audit
from app.connectors.base import ConnectorContext
from app.connectors.mikrotik import MikroTikConnector
from app.credentials.device_store import resolve_device_credential
from app.credentials.encrypted import CredentialEncryptionError, decrypt_secret, encrypt_secret
from app.db import get_db
from app.models import Alert, Device, DeviceCredential, Metric, MikroTikUser, User
from app.schemas.device import MikroTikConnectionTest, MikroTikScanResult, MikroTikServerCreate, MikroTikServerRead, MikroTikUserRead

router = APIRouter()
connector = MikroTikConnector()


def _endpoint(server_ip: str, port: int, protocol: str = "rest") -> str:
    scheme = {"rest": "https", "api": "routeros-api", "api_ssl": "routeros-api-ssl"}[protocol]
    suffix = "/rest" if protocol == "rest" else ""
    return f"{scheme}://{server_ip}:{port}{suffix}"


def _server_read(db: Session, device: Device) -> MikroTikServerRead:
    credential = db.scalar(select(DeviceCredential).where(DeviceCredential.device_id == device.id))
    user_count = len(db.scalars(select(MikroTikUser.id).where(MikroTikUser.device_id == device.id)).all())
    address = device.management_address or ""
    server_ip = address.removeprefix("https://").removeprefix("http://").removesuffix("/rest")
    port = 443
    if ":" in server_ip and server_ip.rsplit(":", 1)[-1].isdigit():
        host, raw_port = server_ip.rsplit(":", 1)
        server_ip, port = host, int(raw_port)
    username = "stored credential"
    if credential and credential.encrypted_username:
        try:
            username = decrypt_secret(credential.encrypted_username)
        except CredentialEncryptionError:
            username = "credential unavailable"
    return MikroTikServerRead(
        id=device.id, name=device.name, server_ip=server_ip, username=username, port=port,
        timeout_seconds=device.timeout_seconds, access_mode=device.access_mode, vendor=device.vendor or "mikrotik",
        model=device.model, routeros_version=device.routeros_version, status=device.status,
        last_scan_at=device.last_scan_at, last_live_at=device.last_live_at, user_count=user_count,
    )


@router.get("/servers", response_model=dict[str, list[MikroTikServerRead]])
def list_servers(db: Session = Depends(get_db), _user: User = Depends(require_roles("admin", "operator", "viewer"))):
    devices = db.scalars(select(Device).where(Device.device_type == "mikrotik").order_by(Device.id)).all()
    return {"items": [_server_read(db, device) for device in devices]}


@router.post("/servers", response_model=MikroTikServerRead, status_code=201)
def create_server(payload: MikroTikServerCreate, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "operator"))):
    try:
        encrypted_username = encrypt_secret(payload.username)
        encrypted_password = encrypt_secret(payload.password)
    except CredentialEncryptionError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    device = Device(name=payload.name, device_type="mikrotik", vendor="mikrotik", model=payload.model,
                    management_address=_endpoint(payload.server_ip, payload.port, payload.protocol), pop_id=payload.pop_id,
                    access_mode=payload.access_mode, timeout_seconds=payload.timeout_seconds, status="testing")
    db.add(device)
    db.flush()
    db.add(DeviceCredential(device_id=device.id, secret_ref=f"DB_DEVICE_{device.id}", auth_mode="encrypted-db",
                             encrypted_username=encrypted_username, encrypted_password=encrypted_password))
    record_audit(db, action="mikrotik.server.created", user_id=user.id, resource_type="device", resource_id=device.id,
                 details={"access_mode": payload.access_mode})
    db.commit()
    db.refresh(device)
    return _server_read(db, device)


@router.delete("/servers/{server_id}", status_code=204)
def delete_server(server_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "operator"))):
    device = db.get(Device, server_id)
    if device is None or device.device_type != "mikrotik":
        raise HTTPException(status_code=404, detail="MikroTik server not found")

    # Remove all server-owned inventory/history first. Audit history is intentionally retained.
    db.execute(delete(MikroTikUser).where(MikroTikUser.device_id == server_id))
    db.execute(delete(DeviceCredential).where(DeviceCredential.device_id == server_id))
    db.execute(delete(Metric).where(Metric.device_id == server_id))
    db.execute(delete(Alert).where(Alert.device_id == server_id))
    record_audit(db, action="mikrotik.server.deleted", user_id=user.id, resource_type="device", resource_id=device.id,
                 details={"server_name": device.name})
    db.delete(device)
    db.commit()
    return None


@router.post("/test-connection")
def test_connection(payload: MikroTikConnectionTest, _user: User = Depends(require_roles("admin", "operator"))):
    result = connector.probe(ConnectorContext(device_id=0, vendor="mikrotik", device_type="mikrotik",
        endpoint=_endpoint(payload.server_ip, payload.port, payload.protocol), credential={"username": payload.username, "password": payload.password}))
    if not result.ok:
        raise HTTPException(status_code=502, detail=result.errors or ["MikroTik connection failed"])
    return {"status": "connected", "version": result.data.get("version"), "checked_at": result.observed_at.isoformat()}


@router.post("/servers/{server_id}/scan", response_model=MikroTikScanResult)
def scan_server(server_id: int, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "operator"))):
    device = db.get(Device, server_id)
    credential = db.scalar(select(DeviceCredential).where(DeviceCredential.device_id == server_id))
    if device is None or device.device_type != "mikrotik":
        raise HTTPException(status_code=404, detail="MikroTik server not found")
    credentials = resolve_device_credential(db, credential)
    if credentials is None:
        raise HTTPException(status_code=503, detail="MikroTik credential is unavailable")
    context = ConnectorContext(device_id=device.id, vendor="mikrotik", device_type="mikrotik", endpoint=device.management_address,
                               secret_ref=credential.secret_ref if credential else None, credential=credentials)
    try:
        users, active, _ = connector.scan_users(context)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"MikroTik user scan failed: {exc.__class__.__name__}") from exc
    active_by_name = {str(item.get("name")): item for item in active if item.get("name")}
    existing = {item.username: item for item in db.scalars(select(MikroTikUser).where(MikroTikUser.device_id == device.id)).all()}
    created = updated = 0
    now = datetime.now(timezone.utc)
    seen = set()
    for item in users:
        name = item["username"]
        seen.add(name)
        row = existing.get(name)
        if row is None:
            row = MikroTikUser(device_id=device.id, username=name, first_seen_at=now)
            db.add(row); created += 1
        else:
            updated += 1
        row.customer_name = item.get("customer_name")
        row.service_profile = item.get("service_profile")
        row.service = item.get("service")
        row.assigned_ip = item.get("assigned_ip")
        row.caller_id = item.get("caller_id")
        row.metadata_json = item.get("metadata_json")
        row.status_snapshot = "online" if name in active_by_name else "offline"
        live = active_by_name.get(name)
        if live:
            row.last_live_ip = live.get("address")
            row.last_live_uptime = live.get("uptime")
            row.last_seen_at = now
        row.last_synced_at = now
    for name, row in existing.items():
        if name not in seen:
            row.status_snapshot = "not-in-router-database"
            row.last_synced_at = now
    device.last_scan_at = now
    device.status = "online"
    record_audit(db, action="mikrotik.users.scanned", user_id=user.id, resource_type="device", resource_id=device.id,
                 details={"users": len(users), "active": len(active)})
    db.commit()
    return MikroTikScanResult(server_id=device.id, users_scanned=len(users), users_created=created, users_updated=updated,
                              active_users=len(active), synced_at=now)


@router.get("/servers/{server_id}/users", response_model=dict[str, list[MikroTikUserRead]])
def list_users(server_id: int, search: str | None = Query(default=None, max_length=120), db: Session = Depends(get_db),
               _user: User = Depends(require_roles("admin", "operator", "viewer"))):
    query = select(MikroTikUser).where(MikroTikUser.device_id == server_id).order_by(MikroTikUser.username)
    if search:
        query = query.where(MikroTikUser.username.ilike(f"%{search}%"))
    rows = db.scalars(query).all()
    return {"items": [MikroTikUserRead.model_validate(row, from_attributes=True) for row in rows]}


@router.get("/servers/{server_id}/live")
def live_server(server_id: int, db: Session = Depends(get_db), _user: User = Depends(require_roles("admin", "operator", "viewer"))):
    device = db.get(Device, server_id)
    credential = db.scalar(select(DeviceCredential).where(DeviceCredential.device_id == server_id))
    if device is None or device.device_type != "mikrotik":
        raise HTTPException(status_code=404, detail="MikroTik server not found")
    credentials = resolve_device_credential(db, credential)
    if credentials is None:
        raise HTTPException(status_code=503, detail="MikroTik credential is unavailable")
    result = connector.collect(ConnectorContext(device_id=device.id, vendor="mikrotik", device_type="mikrotik",
        endpoint=device.management_address, secret_ref=credential.secret_ref if credential else None, credential=credentials))
    if not result.ok:
        raise HTTPException(status_code=502, detail=result.errors or ["MikroTik live collection failed"])
    device.last_live_at = result.observed_at
    if result.data.get("routeros_version"):
        device.routeros_version = str(result.data["routeros_version"])
    device.status = "online"
    db.commit()
    return {"server_id": server_id, "observed_at": result.observed_at.isoformat(), "data": result.data}
