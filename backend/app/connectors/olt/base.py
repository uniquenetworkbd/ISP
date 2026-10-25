from __future__ import annotations

import asyncio
from urllib.parse import urlparse

from pysnmp.hlapi.v3arch.asyncio import (
    CommunityData,
    ContextData,
    ObjectIdentity,
    ObjectType,
    SnmpEngine,
    UdpTransportTarget,
    get_cmd,
)

from ..base import ConnectorContext, ConnectorResult, DeviceConnector


class OLTConnector(DeviceConnector):
    """Generic SNMPv2c system probe for OLTs; vendor PON/ONU MIB profiles remain separate."""

    device_types = ("olt",)
    SYS_DESCR = "1.3.6.1.2.1.1.1.0"
    SYS_UPTIME = "1.3.6.1.2.1.1.3.0"
    SYS_NAME = "1.3.6.1.2.1.1.5.0"

    def capabilities(self) -> list[str]:
        return ["snmp_system_probe", "sys_descr", "sys_name", "sys_uptime"]

    @staticmethod
    def _target(endpoint: str) -> tuple[str, int]:
        raw = endpoint.strip()
        parsed = urlparse(raw if "://" in raw else f"//{raw}")
        host = parsed.hostname
        if not host:
            raise ValueError("OLT endpoint must contain a valid host or IP address")
        try:
            port = parsed.port or 161
        except ValueError as exc:
            raise ValueError("OLT SNMP port is invalid") from exc
        if not 1 <= port <= 65535:
            raise ValueError("OLT SNMP port must be between 1 and 65535")
        return host, port

    async def _query_system(self, host: str, port: int, community: str, timeout: float) -> dict[str, str]:
        engine = SnmpEngine()
        try:
            error_indication, error_status, error_index, var_binds = await get_cmd(
                engine,
                CommunityData(community, mpModel=1),
                await UdpTransportTarget.create((host, port), timeout=timeout, retries=1),
                ContextData(),
                ObjectType(ObjectIdentity(self.SYS_DESCR)),
                ObjectType(ObjectIdentity(self.SYS_NAME)),
                ObjectType(ObjectIdentity(self.SYS_UPTIME)),
            )
            if error_indication:
                raise ConnectionError("SNMP agent did not respond")
            if error_status:
                raise ConnectionError(f"SNMP request failed at varbind {int(error_index or 0)}")
            values = [str(value) for _, value in var_binds]
            return {
                "sys_descr": values[0] if len(values) > 0 else "",
                "sys_name": values[1] if len(values) > 1 else "",
                "sys_uptime_ticks": values[2] if len(values) > 2 else "",
            }
        finally:
            engine.close_dispatcher()

    def probe(self, context: ConnectorContext) -> ConnectorResult:
        credentials = context.credential if isinstance(context.credential, dict) else {}
        community = credentials.get("community")
        if not isinstance(community, str) or not community:
            return ConnectorResult(
                status="error",
                device_id=context.device_id,
                errors=["SNMP community credential is required for an OLT probe."],
                capabilities=self.capabilities(),
            )
        if not context.endpoint:
            return ConnectorResult(
                status="error",
                device_id=context.device_id,
                errors=["OLT management endpoint is required."],
                capabilities=self.capabilities(),
            )
        try:
            host, port = self._target(context.endpoint)
            timeout = float(credentials.get("timeout_seconds", 3))
            if not 0.5 <= timeout <= 30:
                raise ValueError("SNMP timeout must be between 0.5 and 30 seconds")
            data = asyncio.run(self._query_system(host, port, community, timeout))
            return ConnectorResult(
                status="ok",
                device_id=context.device_id,
                data={
                    **data,
                    "host": host,
                    "port": port,
                    "protocol": "SNMPv2c",
                    "vendor_telemetry": "requires_vendor_mib_profile",
                },
                capabilities=self.capabilities(),
            )
        except Exception as exc:
            # Do not return transport exception text that might expose endpoint or configuration details.
            return ConnectorResult(
                status="error",
                device_id=context.device_id,
                errors=[f"SNMP probe failed ({exc.__class__.__name__}). Check reachability, port, community and SNMP ACL."],
                capabilities=self.capabilities(),
            )

    def collect(self, context: ConnectorContext) -> ConnectorResult:
        return self.probe(context)
