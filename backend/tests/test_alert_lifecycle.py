from __future__ import annotations

from datetime import datetime, timezone

from app.models import Alert
from app.monitoring.lifecycle import apply_alert_lifecycle


class FakeScalars:
    def __init__(self, values):
        self.values = values

    def all(self):
        return self.values


class FakeDB:
    def __init__(self, existing):
        self.existing = existing
        self.added = []

    def scalars(self, _query):
        return FakeScalars(self.existing)

    def add(self, value):
        self.added.append(value)


def observed():
    return datetime.now(timezone.utc)


def test_alert_lifecycle_creates_then_repeats():
    db = FakeDB([])
    candidate = {"device_id": 1, "severity": "warning", "title": "CPU high", "message": "95 >= 90"}

    first = apply_alert_lifecycle(db, device_id=1, candidates=[candidate], observed_at=observed())
    assert first["created"] == 1
    assert db.added[0].status == "open"

    alert = Alert(
        device_id=1,
        severity="warning",
        status="open",
        title="CPU high",
        message="old",
    )
    db = FakeDB([alert])
    second = apply_alert_lifecycle(db, device_id=1, candidates=[candidate], observed_at=observed())
    assert second["repeated"] == 1
    assert alert.message == "95 >= 90"


def test_alert_lifecycle_recovers_then_resolves():
    alert = Alert(
        device_id=2,
        severity="critical",
        status="open",
        title="Device collection failed",
        message="offline",
    )
    db = FakeDB([alert])

    recovered = apply_alert_lifecycle(db, device_id=2, candidates=[], observed_at=observed())
    assert recovered["recovered"] == 1
    assert alert.status == "recovered"

    resolved = apply_alert_lifecycle(db, device_id=2, candidates=[], observed_at=observed())
    assert resolved["resolved"] == 1
    assert alert.status == "resolved"


def test_recovered_alert_reopens_when_condition_returns():
    alert = Alert(
        device_id=3,
        severity="warning",
        status="recovered",
        title="CPU high",
        message="previous",
    )
    db = FakeDB([alert])
    candidate = {"device_id": 3, "severity": "warning", "title": "CPU high", "message": "97 >= 90"}

    result = apply_alert_lifecycle(db, device_id=3, candidates=[candidate], observed_at=observed())
    assert result["reopened"] == 1
    assert alert.status == "open"
    assert alert.resolved_at is None
