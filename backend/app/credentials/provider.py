from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Protocol


@dataclass(frozen=True)
class CredentialReference:
    secret_ref: str
    auth_mode: str = "secret-ref"


class CredentialProvider(Protocol):
    def resolve(self, reference: CredentialReference) -> object | None:
        """Resolve a credential without persisting or logging its secret value."""


class SecretRefCredentialProvider:
    """Credential boundary for injected secret resolvers.

    The repository stores only a secret reference. The actual resolver is supplied
    by the runtime that owns the secret store; this class never writes secrets to
    the database, files, logs, or monitoring payloads.
    """

    def __init__(self, resolver: Callable[[str], object | None] | None = None) -> None:
        self._resolver = resolver

    def resolve(self, reference: CredentialReference) -> object | None:
        if not reference.secret_ref or self._resolver is None:
            return None
        return self._resolver(reference.secret_ref)
