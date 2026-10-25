from __future__ import annotations

import json
import os
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
    """Resolve credentials through an injected resolver or environment secret.

    The database stores only ``secret_ref``. A reference can point to a runtime
    secret resolver, or to an environment variable containing a JSON object such
    as ``{"username":"...","password":"..."}``. Secret values never enter
    database records, logs, alert payloads, or API responses.
    """

    def __init__(self, resolver: Callable[[str], object | None] | None = None) -> None:
        self._resolver = resolver

    def resolve(self, reference: CredentialReference) -> object | None:
        if not reference.secret_ref:
            return None
        if self._resolver is not None:
            return self._resolver(reference.secret_ref)
        raw = os.getenv(reference.secret_ref)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None
