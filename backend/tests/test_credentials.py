import json

from app.credentials.provider import CredentialReference, SecretRefCredentialProvider


def test_provider_uses_injected_resolver_without_persisting_secret() -> None:
    calls: list[str] = []

    def resolver(secret_ref: str) -> object:
        calls.append(secret_ref)
        return {"username": "runtime-user", "password": "runtime-only"}

    provider = SecretRefCredentialProvider(resolver)
    result = provider.resolve(CredentialReference(secret_ref="secret/device-1"))

    assert calls == ["secret/device-1"]
    assert result == {"username": "runtime-user", "password": "runtime-only"}


def test_provider_without_runtime_resolver_returns_none(monkeypatch) -> None:
    provider = SecretRefCredentialProvider()
    assert provider.resolve(CredentialReference(secret_ref="secret/device-1")) is None


def test_provider_can_resolve_environment_secret(monkeypatch) -> None:
    monkeypatch.setenv(
        "DEVICE_SECRET",
        json.dumps({"username": "runtime-user", "password": "runtime-only"}),
    )
    provider = SecretRefCredentialProvider()
    assert provider.resolve(CredentialReference(secret_ref="DEVICE_SECRET")) == {
        "username": "runtime-user",
        "password": "runtime-only",
    }
