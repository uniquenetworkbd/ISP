# Backend Monitoring Reliability Foundation

## Scope

This phase adds deterministic reliability primitives without connecting to live MikroTik or OLT devices.

## Retry policy

Connector operations may use a bounded retry policy with exponential backoff. The policy is explicit and testable; live adapters decide later which transport failures are retryable.

## Timeout boundary

The reliability helper records an operation budget. Future network transports must enforce their own I/O timeout at the transport layer and return a normalized connector failure when the budget is exceeded.

## Alert deduplication

Alert candidates receive a deterministic fingerprint from device, severity, and normalized title. Candidates duplicated during one monitoring cycle are collapsed before persistence.

Future recovery-state work will extend this to persisted open-alert matching and recovery/resolve transitions.

## Scheduler boundary

A scheduler/worker may later invoke `run_monitor_cycle` periodically. GitHub Actions can schedule repository workflows, but scheduled Actions are intended for repository automation rather than a continuously running production monitoring daemon. GitHub documents scheduled workflows as cron-triggered runs on the default branch and notes that schedules can be delayed under load.

The application therefore keeps scheduler orchestration separate from the monitoring domain so a future runtime can execute the same worker without changing the monitoring model.
