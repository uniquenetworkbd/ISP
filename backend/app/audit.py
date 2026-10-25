from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog


def record_audit(
    db: Session,
    *,
    action: str,
    user_id: int | None = None,
    resource_type: str | None = None,
    resource_id: int | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    """Persist a security/operations audit event without accepting secrets."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
    )
    db.add(entry)
    return entry
