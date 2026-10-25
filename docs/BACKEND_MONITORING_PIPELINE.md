# Backend Monitoring Pipeline

## Flow

```text
Device Registry
    -> Connector Manager
    -> ConnectorResult
    -> Metric Normalizer
    -> metrics table
    -> Alert Evaluator
    -> In-cycle Deduplication
    -> Persistent Alert Lifecycle
    -> alerts table
```

## Current behavior

- The worker reads registered devices from the database.
- `DeviceCredential.secret_ref` is passed as a reference only; plaintext credentials are not loaded by the worker.
- Connector results are normalized into the existing `metrics` schema.
- Failed or unavailable connector collection creates a critical alert candidate.
- CPU and memory thresholds currently use a 90% warning boundary.
- Duplicate candidates are collapsed before persistence.
- Existing open alerts are repeated instead of recreated on every polling cycle.
- Cleared conditions transition `open -> recovered -> resolved`.
- A returning condition transitions `recovered -> open`.
- The deterministic mock connector supplies repeatable numeric observations for CI tests.
- MikroTik and OLT production adapters remain `not_connected`, so this worker does not contact real devices in the current preparation phase.

## Transaction boundary

A monitoring cycle writes device status, metrics, and alert state changes in one SQLAlchemy session transaction and commits after the cycle. SQLAlchemy documents `Session` as the unit-of-work interface and recommends explicit transaction boundaries for predictable commit/rollback behavior.

## Next layer

1. Credential provider abstraction.
2. Per-device failure counters and circuit breaker.
3. Scheduler/worker entry point.
4. API endpoints for alert acknowledgement, recovery history, and operational queries.
5. Vendor transport implementations behind the existing connector contracts.
