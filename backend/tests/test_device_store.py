from cryptography.fernet import Fernet

from app.credentials.device_store import resolve_device_credential
from app.credentials.encrypted import encrypt_secret
from app.models import DeviceCredential


def _credential(auth_mode: str, username: str | None, password: str, monkeypatch) -> DeviceCredential:
    monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", Fernet.generate_key().decode())
    return DeviceCredential(
        id=1,
        device_id=2,
        secret_ref="test-device",
        auth_mode=auth_mode,
        encrypted_username=encrypt_secret(username) if username is not None else None,
        encrypted_password=encrypt_secret(password),
    )


def test_resolves_mikrotik_username_and_password(monkeypatch) -> None:
    credential = _credential("encrypted-db", "monitor-user", "router-secret", monkeypatch)
    assert resolve_device_credential(None, credential) == {
        "username": "monitor-user",
        "password": "router-secret",
    }


def test_resolves_olt_snmpv2c_community_in_connector_shape(monkeypatch) -> None:
    credential = _credential("encrypted-db-snmpv2c", "snmpv2c", "private-community", monkeypatch)
    assert resolve_device_credential(None, credential) == {"community": "private-community"}


def test_missing_password_is_not_a_usable_credential() -> None:
    credential = DeviceCredential(
        id=1,
        device_id=2,
        secret_ref="test-device",
        auth_mode="encrypted-db-snmpv2c",
        encrypted_username=None,
        encrypted_password=None,
    )
    assert resolve_device_credential(None, credential) is None
