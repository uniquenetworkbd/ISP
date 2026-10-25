from __future__ import annotations

import os

from cryptography.fernet import Fernet, InvalidToken


class CredentialEncryptionError(RuntimeError):
    pass


def _fernet() -> Fernet:
    key = os.getenv("CREDENTIAL_ENCRYPTION_KEY")
    if not key:
        raise CredentialEncryptionError("CREDENTIAL_ENCRYPTION_KEY is not configured")
    try:
        return Fernet(key.encode())
    except (ValueError, TypeError) as exc:
        raise CredentialEncryptionError("CREDENTIAL_ENCRYPTION_KEY is invalid") from exc


def encrypt_secret(value: str) -> str:
    if not isinstance(value, str):
        raise CredentialEncryptionError("Credential value must be text")
    return _fernet().encrypt(value.encode()).decode()


def decrypt_secret(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode()).decode()
    except (InvalidToken, UnicodeDecodeError, ValueError, TypeError) as exc:
        raise CredentialEncryptionError("Stored credential could not be decrypted") from exc
