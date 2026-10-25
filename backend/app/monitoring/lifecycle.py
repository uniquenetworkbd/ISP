from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Alert

ACTIVE_STATUSES = {"open", "recovered"}


def apply_alert_lifecycle(
    db: Session,
    *,
    device_id: int,
    candidates: list[dict[str, Any]],
    observed_at: datetime,
) -> dict[str, int]:
    """Persist one device's alert state using open/repeated/recovered/resolved transitions."""
    counters = {"created": 0, "repeated": 0, "reopened": 0, "recovered": 0, "resolved": 0}
    existing = list(
        db.scalars(
            select(Alert).where(
                Alert.device_id == device_id,
                Alert.status.in_(ACTIVE_STATUSES),
            )
        )
    )
    by_key = {(item.title.strip().lower(), item.severity): item for item in existing}
    candidate_keys = {
        (str(item["title"]).strip().lower(), str(item["severity"])) for item in candidates
    }

    for candidate in candidates:
        key = (str(candidate["title"]).strip().lower(), str(candidate["severity"]))
        alert = by_key.get(key)
        if alert is None:
            db.add(
                Alert(
                    device_id=device_id,
                    severity=str(candidate["severity"]),
                    status="open",
                    title=str(candidate["title"]),
                    message=str(candidate.get("message") or ""),
                    detected_at=observed_at,
                )
            )
            counters["created"] += 1
            continue

        alert.message = str(candidate.get("message") or "")
        alert.detected_at = observed_at
        if alert.status == "recovered":
            alert.status = "open"
            alert.resolved_at = None
            counters["reopened"] += 1
        else:
            counters["repeated"] += 1

    for alert in existing:
        key = (alert.title.strip().lower(), alert.severity)
        if key in candidate_keys:
            continue
        if alert.status == "open":
            alert.status = "recovered"
            alert.resolved_at = observed_at
            counters["recovered"] += 1
        elif alert.status == "recovered":
            alert.status = "resolved"
            counters["resolved"] += 1

    return counters
