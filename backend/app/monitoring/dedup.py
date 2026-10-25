from __future__ import annotations

from collections.abc import Iterable
from typing import Any


def alert_fingerprint(*, device_id: int, title: str, severity: str) -> str:
    return f"{device_id}:{severity}:{title.strip().lower()}"


def deduplicate_candidates(candidates: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """Collapse duplicate alert candidates within one monitoring cycle."""
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for candidate in candidates:
        fingerprint = alert_fingerprint(
            device_id=int(candidate["device_id"]),
            title=str(candidate["title"]),
            severity=str(candidate["severity"]),
        )
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        enriched = dict(candidate)
        enriched["fingerprint"] = fingerprint
        unique.append(enriched)
    return unique
