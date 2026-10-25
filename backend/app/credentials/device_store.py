from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import DeviceCredential

from .encrypted import decrypt_secret


def resolve_device_credential(db: Session, credential: DeviceCredential | None) -> dict[str, str] | None:
    """Resolve encrypted device credentials into the connector-specific shape.

    MikroTik RouterOS REST uses username/password. SNMPv2c OLT connectors use
    the encrypted password field as the community string and must never receive
    a username/password-only object.
    """
    if credential is None or not credential.encrypted_password:
        return None

    if credential.auth_mode == "encrypted-db-snmpv2c":
        return {"community": decrypt_secret(credential.encrypted_password)}

    if credential.encrypted_username:
        return {
            "username": decrypt_secret(credential.encrypted_username),
            "password": decrypt_secret(credential.encrypted_password),
        }
    return None
