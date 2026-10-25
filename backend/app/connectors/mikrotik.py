from __future__ import annotations

import base64
import json
import os
import ssl
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

from .base import ConnectorContext, ConnectorResult, DeviceConnector


class MikroTikConnector(DeviceConnector):
    """RouterOS REST connector with read-only inventory and telemetry collection."""

    vendor = "mikrotik"
    device_types = ("router", "mikrotik")

    def capabilities(self) -> list[str]:
        return ["health", "system-resource", "ppp-users", "ppp-active", "interface-stats"]

    @staticmethod
    def _credential(context: ConnectorContext) -> tuple[str, str] | None:
        value: Any = context.credential
        if not isinstance(value, dict):
            return None
        username, password = value.get("username"), value.get("password")
        if not isinstance(username, str) or not isinstance(password, str):
            return None
        return username, password

    @staticmethod
    def _base_url(endpoint: str | None) -> str:
        if not endpoint:
            raise ValueError("MikroTik management endpoint is required")
        value = endpoint.rstrip("/")
        # Explicit transports: binary API (8728), API-SSL (8729), or REST.
        if value.startswith(("routeros-api://", "routeros-api-ssl://")):
            return value
        if value.endswith("/rest"):
            return value
        if value.startswith(("http://", "https://")):
            return f"{value}/rest"
        return f"https://{value}/rest"

    def _get(self, url: str, username: str, password: str, timeout: float | None = None) -> Any:
        request_timeout = timeout or float(os.getenv("MIKROTIK_CONNECT_TIMEOUT", "10"))
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme in {"routeros-api", "routeros-api-ssl"}:
            # The client handles RouterOS binary API sentence framing/auth.
            try:
                from routeros_api import RouterOsApiPool
            except ImportError as exc:
                raise RuntimeError("RouterOS API transport dependency is not installed") from exc
            use_ssl = parsed.scheme == "routeros-api-ssl"
            if not parsed.hostname:
                raise ValueError("MikroTik API host is missing")
            pool = RouterOsApiPool(
                host=parsed.hostname,
                username=username,
                password=password,
                port=parsed.port or (8729 if use_ssl else 8728),
                use_ssl=use_ssl,
                ssl_verify=True,
                ssl_verify_hostname=True,
                plaintext_login=True,
                timeout=request_timeout,
            )
            api = None
            try:
                api = pool.get_api()
                return api.get_resource("/" + parsed.path.strip("/")).get()
            finally:
                if api is not None:
                    pool.disconnect()
        token = base64.b64encode(f"{username}:{password}".encode()).decode()
        request = urllib.request.Request(url, headers={"Authorization": f"Basic {token}", "Accept": "application/json"})
        verify_tls = os.getenv("MIKROTIK_VERIFY_TLS", "true").lower() not in {"0", "false", "no"}
        context = None if verify_tls else ssl._create_unverified_context()
        with urllib.request.urlopen(request, timeout=request_timeout, context=context) as response:
            return json.loads(response.read().decode("utf-8"))

    @staticmethod
    def _first_record(payload: Any) -> dict[str, Any]:
        if isinstance(payload, list) and payload and isinstance(payload[0], dict):
            return payload[0]
        if isinstance(payload, dict):
            return payload
        return {}

    @staticmethod
    def _records(payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        if isinstance(payload, dict):
            return [payload]
        return []

    @staticmethod
    def _number(value: Any) -> float | None:
        try:
            return float(str(value).strip().replace("%", ""))
        except (TypeError, ValueError):
            return None

    def probe(self, context: ConnectorContext) -> ConnectorResult:
        observed_at = datetime.now(timezone.utc)
        credentials = self._credential(context)
        if credentials is None:
            return ConnectorResult(status="error", device_id=context.device_id, observed_at=observed_at, errors=["MikroTik credentials are missing"], capabilities=self.capabilities())
        try:
            username, password = credentials
            resource = self._first_record(self._get(f"{self._base_url(context.endpoint)}/system/resource", username, password))
            version = resource.get("version")
            return ConnectorResult(status="ok", device_id=context.device_id, observed_at=observed_at, data={"version": version} if version else {}, capabilities=self.capabilities())
        except Exception as exc:
            return ConnectorResult(status="error", device_id=context.device_id, observed_at=observed_at, errors=[f"MikroTik connection test failed: {exc.__class__.__name__}"], capabilities=self.capabilities())

    def scan_users(self, context: ConnectorContext) -> tuple[list[dict[str, Any]], list[dict[str, Any]], str | None]:
        credentials = self._credential(context)
        if credentials is None:
            raise ValueError("MikroTik credentials are missing")
        username, password = credentials
        base = self._base_url(context.endpoint)
        secrets = self._records(self._get(f"{base}/ppp/secret", username, password))
        active = self._records(self._get(f"{base}/ppp/active", username, password))
        users: list[dict[str, Any]] = []
        for item in secrets:
            name = str(item.get("name") or "").strip()
            if not name:
                continue
            users.append({"username": name, "customer_name": item.get("comment") or None, "service_profile": item.get("profile") or None,
                          "service": item.get("service") or None, "assigned_ip": item.get("remote-address") or None,
                          "caller_id": item.get("caller-id") or None,
                          "metadata_json": {"disabled": item.get("disabled"), "local_address": item.get("local-address")}})
        return users, active, None

    def collect(self, context: ConnectorContext) -> ConnectorResult:
        observed_at = datetime.now(timezone.utc)
        credentials = self._credential(context)
        if credentials is None:
            return ConnectorResult(status="error", device_id=context.device_id, observed_at=observed_at, errors=["MikroTik credential reference did not resolve to username/password."], capabilities=self.capabilities())
        username, password = credentials
        try:
            base = self._base_url(context.endpoint)
            resource = self._first_record(self._get(f"{base}/system/resource", username, password))
            data: dict[str, Any] = {}
            cpu = self._number(resource.get("cpu-load")); total_memory = self._number(resource.get("total-memory")); free_memory = self._number(resource.get("free-memory"))
            if cpu is not None: data["cpu_percent"] = cpu
            if total_memory and free_memory is not None and total_memory > 0: data["memory_percent"] = ((total_memory - free_memory) / total_memory) * 100
            if resource.get("version"): data["routeros_version"] = str(resource["version"])
            try:
                health = self._first_record(self._get(f"{base}/system/health", username, password))
                temperature = self._number(health.get("cpu-temperature") or health.get("temperature"))
                if temperature is not None: data["temperature_c"] = temperature / 10 if temperature > 150 else temperature
            except urllib.error.HTTPError as exc:
                if exc.code not in {400, 404}: raise
            try:
                active = self._records(self._get(f"{base}/ppp/active", username, password))
                data["active_users"] = len(active)
            except (urllib.error.HTTPError, IndexError) as exc:
                if isinstance(exc, urllib.error.HTTPError) and exc.code not in {400, 404}: raise
            try:
                interfaces = self._records(self._get(f"{base}/interface", username, password))
                rx_bytes = sum(int(float(item.get("rx-byte", 0))) for item in interfaces if str(item.get("rx-byte", "")).replace(".", "", 1).isdigit())
                tx_bytes = sum(int(float(item.get("tx-byte", 0))) for item in interfaces if str(item.get("tx-byte", "")).replace(".", "", 1).isdigit())
                data["interface_rx_bytes"] = rx_bytes; data["interface_tx_bytes"] = tx_bytes
            except (urllib.error.HTTPError, ValueError, IndexError) as exc:
                if isinstance(exc, urllib.error.HTTPError) and exc.code not in {400, 404}: raise
            return ConnectorResult(status="ok", device_id=context.device_id, observed_at=observed_at, data=data, capabilities=self.capabilities())
        except Exception as exc:
            return ConnectorResult(status="error", device_id=context.device_id, observed_at=observed_at, errors=[f"MikroTik collection failed: {exc.__class__.__name__}"], capabilities=self.capabilities())
