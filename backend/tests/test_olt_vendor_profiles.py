from app.connectors.base import ConnectorContext
from app.connectors.olt.contracts import ONURecord, PONRecord
from app.connectors.olt.profiles import get_olt_vendor_profile
from app.connectors.registry import build_default_connector_manager


VENDORS = ("huawei", "zte", "vsol", "bdcom")


def test_all_supported_olt_vendors_have_explicit_pending_profiles() -> None:
    manager = build_default_connector_manager()
    for vendor in VENDORS:
        connector = manager.resolve(vendor, "olt")
        profile = get_olt_vendor_profile(vendor)
        assert profile.vendor == vendor
        assert profile.profile_status == "vendor_profile_pending"
        assert profile.mib_profile_id is None
        assert connector.capabilities() == list(profile.capabilities)
        assert "snmp_system_probe" in connector.capabilities()
        assert "pon_discovery" not in connector.capabilities()
        assert "onu_discovery" not in connector.capabilities()


def test_vendor_collectors_are_deterministically_profile_pending_without_network() -> None:
    manager = build_default_connector_manager()
    context = ConnectorContext(device_id=101, vendor="zte", device_type="olt")
    connector = manager.resolve("zte", "olt")

    for collector in (connector.discover_pons, connector.discover_onus, connector.collect_optical_metrics):
        result = collector(context)
        assert result.status == "profile_pending"
        assert result.profile_id is None
        assert result.records == ()
        assert result.errors


def test_normalized_pon_onu_contracts_allow_missing_unverified_values() -> None:
    pon = PONRecord(pon_id="pon-1", status=None, vendor="huawei", model=None, source="vendor-mib")
    onu = ONURecord(
        pon_id="pon-1",
        onu_id="onu-1",
        serial="SERIAL-1",
        status=None,
        rx_power_dbm=None,
        tx_power_dbm=None,
        distance_m=None,
        temperature_c=None,
        vendor="huawei",
        model=None,
        source="vendor-mib",
    )
    assert pon.pon_id == "pon-1"
    assert onu.onu_id == "onu-1"
    assert onu.rx_power_dbm is None
    assert onu.tx_power_dbm is None
