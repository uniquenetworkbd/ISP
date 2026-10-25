from __future__ import annotations

import base64
import json
import os
import ssl
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any

from .base import ConnectorContext, ConnectorResult, DeviceConnector


class MikroTikConnector(DeviceConnector):
    """Read-only RouterOS REST collector.

    RouterOS v7 exposes a JSON REST wrapper under ``/rest``. This connector only
    reads system resource and health data; it performs no configuration changes.
    """

    vendor = "mikrotik"
    device_types = ("router", "mikrotik")

    def capabilities(self) -> list[str]:
        return ["health", "system-resource", "interfaces"]

    @staticmethod
    def _credential(context: ConnectorContext) -> tuple[str, str] | None:
        value: Any = context.credential
        if not isinstance(value, dict):
            return None
        username = value.get("username")
        password = value.get("password")
        if not isinstance(username, str) or not isinstance(password, str):
            return None
        return username, password

    @staticmethod
    def _base_url(endpoint: str | None) -> str:
        if not endpoint:
            raise ValueError("MikroTik management endpoint is required")
        value = endpoint.rstrip("/")
        if value.endswith("/rest"):
            return value
        if value.startswith("http://") or value.startswith("https://"):
            return f"{value}/rest"
        return f"https://{value}/rest"

    def _get(self, url: str, username: str, password: str) -> Any:
        token = base64.b64encode(f"{username}:{password}".encode()).decode()
        request = urllib.request.Request(url, headers={"Authorization": f"Basic {token}", "Accept": "application/json"})
        timeout = float(os.getenv("MIKROTIK_CONNECT_TIMEOUT", "10"))
        verify_tls = os.getenv("MIKROTIK_VERIFY_TLS", "true").lower() not in {"0", "false", "no"}
        context = None if verify_tls else ssl._create_unverified_context()
        with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
            return json.loads(response.read().decode("utf-8"))

    @staticmethod
    def _first_record(payload: Any) -> dict[str, Any]:
        if isinstance(payload, list) and payload and isinstance(payload[0], dict):
            return payload[0]
        if isinstance(payload, dict):
            return payload
        return {}

    @staticmethod
    def _number(value: Any) -> float | None:
        try:
            return float(str(value).strip().replace("%", ""))
        except (TypeError, ValueError):
            return None

    def collect(self, context: ConnectorContext) -> ConnectorResult:
        observed_at = datetime.now(timezone.utc)
        credentials = self._credential(context)
        if credentials is None:
            return ConnectorResult(
                status="error",
                device_id=context.device_id,
                observed_at=observed_at,
                errors=["MikroTik credential reference did not resolve to username/password."],
                capabilities=self.capabilities(),
            )

        username, password = credentials
        try:
            base = self._base_url(context.endpoint)
            resource = self._first_record(self._get(f"{base}/system/resource", username, password))
            data: dict[str, float] = {}
            cpu = self._number(resource.get("cpu-load"))
            total_memory = self._number(resource.get("total-memory"))
            free_memory = self._number(resource.get("free-memory"))
            if cpu is not None:
                data["cpu_percent"] = cpu
            if total_memory and free_memory is not None and total_memory > 0:
                data["memory_percent"] = ((total_memory - free_memory) / total_memory) * 100

            try:
                health = self._first_record(self._get(f"{base}/system/health", username, password))
                temperature = self._number(health.get("cpu-temperature") or health.get("temperature"))
                if temperature is not None:
                    # RouterOS health values may be reported in tenths of a degree
                    # for API/SNMP on supported hardware.
                    data["temperature_c"] = temperature / 10 if temperature > 150 else temperature
            except urllib.error.HTTPError as exc:
                if exc.code not in {400, 404}:
                    raise

            return ConnectorResult(
                status="ok",
                device_id=context.device_id,
                observed_at=observed_at,
                data=data,
                capabilities=self.capabilities(),
            )
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            return ConnectorResult(
                status="error",
                device_id=context.device_id,
                observed_at=observed_at,
                errors=[f"MikroTik REST collection failed: {exc.__class__.__name__}"],
                capabilities=self.capabilities(),
            )
