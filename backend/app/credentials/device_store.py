from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import DeviceCredential

from .encrypted import decrypt_secret


def resolve_device_credential(db: Session, credential: DeviceCredential | None) -> dict[str, str] | None:
    if credential is None:
        return None
    if credential.encrypted_username and credential.encrypted_password:
        return {
            "username": decrypt_secret(credential.encrypted_username),
            "password": decrypt_secret(credential.encrypted_password),
        }
    return None
