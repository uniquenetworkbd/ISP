from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.audit import record_audit
from app.connectors.base import ConnectorContext
from app.connectors.registry import build_default_connector_manager
from app.credentials.encrypted import CredentialEncryptionError, decrypt_secret, encrypt_secret
from app.db import get_db
from app.models import Alert, Device, DeviceCredential, Metric, ONU, PONPort, User
from app.schemas.device import OLTConnectionTest, OLTServerCreate, OLTServerRead

router = APIRouter()
connectors = build_default_connector_manager()


def _host_for_url(host: str) -> str:
    host = host.strip()
    if host.startswith("[") and host.endswith("]"):
        return host
    return f"[{host}]" if ":" in host else host


def _endpoint(host: str, port: int) -> str:
    return f"udp://{_host_for_url(host)}:{port}"


def _server_read(device: Device) -> OLTServerRead:
    address = device.management_address or ""
    try:
        host, port = connectors.resolve(device.vendor or "vsol", "olt")._target(address)
    except (ValueError, AttributeError):
        host, port = address, 161
    return OLTServerRead(
        id=device.id,
        name=device.name,
        host=host,
        port=port,
        vendor=(device.vendor or "vsol").lower(),
        model=device.model,
        status=device.status,
        last_live_at=device.last_live_at,
    )


def _probe(host: str, port: int, vendor: str, community: str, timeout: float, device_id: int = 0):
    connector = connectors.resolve(vendor, "olt")
    return connector.probe(
        ConnectorContext(
            device_id=device_id,
            vendor=vendor,
            device_type="olt",
            endpoint=_endpoint(host, port),
            credential={"community": community, "timeout_seconds": timeout},
        )
    )


@router.get("/servers", response_model=dict[str, list[OLTServerRead]])
def list_servers(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin", "operator", "viewer")),
) -> dict[str, list[OLTServerRead]]:
    devices = db.scalars(select(Device).where(Device.device_type == "olt").order_by(Device.id)).all()
    return {"items": [_server_read(device) for device in devices]}


@router.post("/test-connection")
def test_connection(
    payload: OLTConnectionTest,
    _user: User = Depends(require_roles("admin", "operator")),
) -> dict:
    result = _probe(payload.host, payload.port, payload.vendor, payload.community, payload.timeout_seconds)
    if not result.ok:
        raise HTTPException(status_code=502, detail=result.errors or ["OLT SNMP connection failed"])
    return {
        "status": "connected",
        "vendor": payload.vendor,
        "checked_at": result.observed_at.isoformat(),
        "data": result.data,
        "capabilities": result.capabilities,
    }


@router.post("/servers", response_model=OLTServerRead, status_code=201)
def create_server(
    payload: OLTServerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "operator")),
) -> OLTServerRead:
    try:
        encrypted_username = encrypt_secret("snmpv2c")
        encrypted_community = encrypt_secret(payload.community)
    except CredentialEncryptionError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    device = Device(
        name=payload.name,
        device_type="olt",
        vendor=payload.vendor,
        model=payload.model,
        management_address=_endpoint(payload.host, payload.port),
        pop_id=payload.pop_id,
        access_mode="read",
        timeout_seconds=max(1, min(30, int(payload.timeout_seconds))),
        status="configured",
    )
    db.add(device)
    db.flush()
    db.add(
        DeviceCredential(
            device_id=device.id,
            secret_ref=f"DB_DEVICE_{device.id}",
            auth_mode="encrypted-db-snmpv2c",
            encrypted_username=encrypted_username,
            encrypted_password=encrypted_community,
        )
    )
    record_audit(
        db,
        action="olt.server.created",
        user_id=user.id,
        resource_type="device",
        resource_id=device.id,
        details={"vendor": payload.vendor, "port": payload.port, "credential": "encrypted"},
    )
    db.commit()
    db.refresh(device)
    return _server_read(device)


@router.post("/servers/{server_id}/probe")
def probe_server(
    server_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "operator")),
) -> dict:
    device = db.get(Device, server_id)
    if device is None or device.device_type != "olt":
        raise HTTPException(status_code=404, detail="OLT server not found")
    credential = db.scalar(select(DeviceCredential).where(DeviceCredential.device_id == server_id))
    if credential is None or not credential.encrypted_password:
        raise HTTPException(status_code=503, detail="OLT SNMP credential is unavailable")
    try:
        community = decrypt_secret(credential.encrypted_password)
        host, port = connectors.resolve(device.vendor or "vsol", "olt")._target(device.management_address or "")
    except (CredentialEncryptionError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="OLT connection configuration is unavailable or invalid") from exc

    result = _probe(host, port, device.vendor or "vsol", community, float(device.timeout_seconds), device.id)
    now = datetime.now(timezone.utc)
    if result.ok:
        device.status = "online"
        device.last_live_at = now
        device.consecutive_failures = 0
    else:
        device.status = "unreachable"
        device.consecutive_failures += 1
        device.last_failure_at = now
    record_audit(
        db,
        action="olt.server.probed",
        user_id=user.id,
        resource_type="device",
        resource_id=device.id,
        details={"status": result.status, "vendor": device.vendor},
    )
    db.commit()
    if not result.ok:
        raise HTTPException(status_code=502, detail=result.errors or ["OLT SNMP probe failed"])
    return {
        "status": "connected",
        "server": _server_read(device).model_dump(mode="json"),
        "observed_at": result.observed_at.isoformat(),
        "data": result.data,
        "capabilities": result.capabilities,
        "note": "Generic SNMP system fields only; vendor-specific PON/ONU/optical telemetry requires a validated vendor MIB profile.",
    }


@router.delete("/servers/{server_id}", status_code=204)
def delete_server(
    server_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "operator")),
):
    device = db.get(Device, server_id)
    if device is None or device.device_type != "olt":
        raise HTTPException(status_code=404, detail="OLT server not found")
    pon_ids = db.scalars(select(PONPort.id).where(PONPort.olt_device_id == server_id)).all()
    if pon_ids:
        db.execute(delete(ONU).where(ONU.olt_device_id == server_id))
        db.execute(delete(PONPort).where(PONPort.olt_device_id == server_id))
    db.execute(delete(DeviceCredential).where(DeviceCredential.device_id == server_id))
    db.execute(delete(Metric).where(Metric.device_id == server_id))
    db.execute(delete(Alert).where(Alert.device_id == server_id))
    record_audit(
        db,
        action="olt.server.deleted",
        user_id=user.id,
        resource_type="device",
        resource_id=device.id,
        details={"vendor": device.vendor},
    )
    db.delete(device)
    db.commit()
    return None
