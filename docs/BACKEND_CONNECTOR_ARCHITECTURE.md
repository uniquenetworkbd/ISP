# Backend Connector Architecture

## Purpose

The connector layer isolates the monitoring API and workers from vendor-specific device protocols. The current phase prepares contracts, registry, adapters, and deterministic tests without making live device connections.

## Flow

```text
Frontend
   -> Backend API
      -> Connector Manager
         -> DeviceConnector contract
            -> MikroTik adapter
            -> OLT vendor adapters
               -> Huawei / ZTE / VSOL / BDCOM
```

## Connector contract

`backend/app/connectors/base.py` defines:

- `ConnectorContext`: device identity, vendor/type, endpoint, and credential reference.
- `ConnectorResult`: status, timestamp, normalized data, errors, and capabilities.
- `DeviceConnector`: `capabilities()`, `collect()`, and an optional `probe()` boundary.

A connector receives `secret_ref`, not a plaintext password. Credential retrieval remains outside the connector contract.

## Registry

`ConnectorManager` maps `(vendor, device_type)` to an adapter. `registry.py` builds the default registry for MikroTik, Huawei, ZTE, VSOL, BDCOM, and a deterministic mock connector.

## Current live-connection boundary

MikroTik and OLT adapters intentionally return `not_connected`. No router or OLT address is contacted by the current implementation.

MikroTik RouterOS supports both its native API and, on RouterOS 7, a REST interface. The eventual production adapter can select one transport behind the same connector contract. HTTPS/secure transport should be preferred for REST; MikroTik explicitly warns against using the plain HTTP REST service in production. See the official RouterOS documentation.

## Next implementation layer

1. Credential provider abstraction using `DeviceCredential.secret_ref`.
2. Vendor-specific transport clients behind adapters.
3. Monitoring worker that calls `ConnectorManager.collect()`.
4. Normalized metric persistence.
5. Threshold evaluation and alert generation.
6. Retry, timeout, circuit-breaker, and audit policies.

No external platform, hosted database, or live device integration is required for the current preparation phase.
