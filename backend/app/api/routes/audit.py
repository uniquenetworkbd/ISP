from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.db import get_db
from app.models import AuditLog, User

router = APIRouter()


@router.get("/", response_model=dict[str, list[dict]])
def list_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    action: str | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles("admin")),
) -> dict[str, list[dict]]:
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if action:
        query = query.where(AuditLog.action == action)
    entries = db.scalars(query).all()
    return {
        "items": [
            {
                "id": entry.id,
                "user_id": entry.user_id,
                "action": entry.action,
                "resource_type": entry.resource_type,
                "resource_id": entry.resource_id,
                "details": entry.details,
                "created_at": entry.created_at,
            }
            for entry in entries
        ]
    }
