from app.audit import record_audit


class FakeSession:
    def __init__(self) -> None:
        self.items = []

    def add(self, item) -> None:
        self.items.append(item)


def test_record_audit_does_not_require_persistence_for_event_creation() -> None:
    db = FakeSession()

    entry = record_audit(
        db,
        action="device.created",
        user_id=7,
        resource_type="device",
        resource_id=11,
        details={"vendor": "MikroTik"},
    )

    assert db.items == [entry]
    assert entry.action == "device.created"
    assert entry.user_id == 7
    assert entry.resource_id == 11
    assert entry.details == {"vendor": "MikroTik"}
