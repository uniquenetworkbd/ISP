import os

import pytest

from app.connectors.base import ConnectorContext
from app.connectors.mikrotik import MikroTikConnector
from app.credentials.encrypted import CredentialEncryptionError, decrypt_secret, encrypt_secret


def test_mikrotik_scan_users_maps_secret_and_active_records(monkeypatch):
    connector = MikroTikConnector()
    payloads = {
        "/ppp/secret": [
            {"name": "alice", "comment": "Alice", "profile": "20M", "service": "pppoe", "remote-address": "10.0.0.2", "caller-id": "AA:BB"},
            {"name": "bob", "profile": "10M", "service": "pppoe", "remote-address": "10.0.0.3"},
        ],
        "/ppp/active": [
            {"name": "alice", "address": "10.0.0.2", "uptime": "1h"},
        ],
    }

    monkeypatch.setattr(connector, "_get", lambda url, username, password: next(value for key, value in payloads.items() if url.endswith(key)))
    users, active, _ = connector.scan_users(ConnectorContext(1, "mikrotik", "mikrotik", "https://10.0.0.1:443", credential={"username": "u", "password": "p"}))

    assert [item["username"] for item in users] == ["alice", "bob"]
    assert users[0]["customer_name"] == "Alice"
    assert active[0]["name"] == "alice"


def test_credential_encryption_round_trip(monkeypatch):
    from cryptography.fernet import Fernet
    monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", Fernet.generate_key().decode())
    encrypted = encrypt_secret("secret-value")
    assert encrypted != "secret-value"
    assert decrypt_secret(encrypted) == "secret-value"


def test_credential_encryption_requires_key(monkeypatch):
    monkeypatch.delenv("CREDENTIAL_ENCRYPTION_KEY", raising=False)
    with pytest.raises(CredentialEncryptionError):
        encrypt_secret("secret-value")
