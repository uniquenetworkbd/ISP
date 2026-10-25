from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ProfileStatus = Literal["generic_snmp_only", "vendor_profile_pending", "vendor_profile_ready"]


@dataclass(frozen=True)
class OLTVendorProfile:
    """Declarative vendor capability metadata; no unverified MIB/OID claims."""

    vendor: str
    device_types: tuple[str, ...]
    protocols: tuple[str, ...]
    profile_status: ProfileStatus
    mib_profile_id: str | None
    capabilities: tuple[str, ...]
    model_constraints: tuple[str, ...] = ()

    @property
    def vendor_telemetry_ready(self) -> bool:
        return self.profile_status == "vendor_profile_ready"


_GENERIC_SNMP_CAPABILITIES = (
    "snmp_system_probe",
    "sys_descr",
    "sys_name",
    "sys_uptime",
)


OLT_VENDOR_PROFILES: dict[str, OLTVendorProfile] = {
    vendor: OLTVendorProfile(
        vendor=vendor,
        device_types=("olt",),
        protocols=("snmpv2c",),
        profile_status="vendor_profile_pending",
        mib_profile_id=None,
        capabilities=_GENERIC_SNMP_CAPABILITIES,
    )
    for vendor in ("huawei", "zte", "vsol", "bdcom")
}


def get_olt_vendor_profile(vendor: str) -> OLTVendorProfile:
    try:
        return OLT_VENDOR_PROFILES[vendor.strip().lower()]
    except KeyError as exc:
        raise LookupError(f"No OLT vendor profile registered for {vendor}") from exc
