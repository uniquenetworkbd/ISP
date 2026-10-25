# Backend Monitoring Reliability Foundation

## Scope

This phase adds deterministic reliability primitives and persistent alert lifecycle management without connecting to live MikroTik or OLT devices.

## Retry policy

Connector operations may use a bounded retry policy with exponential backoff. The policy is explicit and testable; live adapters decide later which transport failures are retryable.

## Timeout boundary

The reliability helper records an operation budget. Future network transports must enforce their own I/O timeout at the transport layer and return a normalized connector failure when the budget is exceeded.

## Alert deduplication

Alert candidates receive a deterministic fingerprint from device, severity, and normalized title. Candidates duplicated during one monitoring cycle are collapsed before persistence.

## Persistent alert lifecycle

Existing database fields are sufficient for the first lifecycle implementation:

```text
open
  ├── repeated → open
  ├── recovered → recovered
  └── reopened → open

recovered → resolved
```

Rules:

1. A new condition creates one `open` alert.
2. A repeated condition updates the existing alert instead of creating another row.
3. A condition that disappears changes `open` to `recovered` and records `resolved_at` as the recovery observation time.
4. A second clean cycle changes `recovered` to `resolved`.
5. If the condition returns while `recovered`, the same alert is reopened and `resolved_at` is cleared.
6. Different severity/title combinations remain separate alert identities.

This deliberately avoids a schema migration at this stage; the existing `alerts.status` and `resolved_at` fields already support the state machine.

## Scheduler boundary

A scheduler/worker may later invoke `run_monitor_cycle` periodically. GitHub Actions can schedule repository workflows, but scheduled Actions are intended for repository automation rather than a continuously running production monitoring daemon. GitHub documents scheduled workflows as cron-triggered runs on the default branch and notes that schedules can be delayed under load.

The application therefore keeps scheduler orchestration separate from the monitoring domain so a future runtime can execute the same worker without changing the monitoring model.
