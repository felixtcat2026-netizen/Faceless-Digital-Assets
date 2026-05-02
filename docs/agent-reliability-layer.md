# Agent Relay Reliability Layer

This repo now includes a hardened reliability layer in `scripts/paperclip_to_make.ps1` for forwarding Paperclip approval events to Make.

## What It Adds

- Durable queue in state file: new or changed issues are queued before delivery.
- Lock lease: only one relay run processes the queue at a time.
- Backpressure controls: queue cap, per-run drain cap, and minimum dispatch interval.
- Timeout budgets: separate fetch and send timeouts.
- Retry policy: exponential backoff + jitter for transient failures.
- Idempotency headers: stable key per issue/status update (`x-idempotency-key`).
- Circuit breaker: pauses dispatch after repeated failures.
- Dead-letter retention: permanently failed events are retained for inspection.
- Run and lifetime metrics persisted in relay state.

## How To Run

```powershell
powershell -ExecutionPolicy Bypass -File scripts\paperclip_to_make.ps1
```

Dry-run mode (for safe validation of queueing logic):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\paperclip_to_make.ps1 -DryRun
```

## Configuration

All values are optional environment variables.

- `PAPERCLIP_API_BASE` (default: `http://127.0.0.1:3101/api`)
- `PAPERCLIP_COMPANY_ID`
- `PAPERCLIP_API_KEY`
- `MAKE_WEBHOOK_URL`
- `MAKE_WEBHOOK_API_KEY`
- `PAPERCLIP_APPROVER_USER_ID` (default: `local-board`)
- `PAPERCLIP_UI_BASE` (default: `http://127.0.0.1:18789`)
- `PAPERCLIP_APPROVAL_STATUSES` (comma-separated)
- `PAPERCLIP_RELAY_STATE_PATH`

OpenClaw Control UI now serves from the gateway on `http://127.0.0.1:18789/`. Older `3100` UI references are stale.

Reliability tuning:

- `PAPERCLIP_FETCH_TIMEOUT_SEC` (default: `20`)
- `PAPERCLIP_SEND_TIMEOUT_SEC` (default: `20`)
- `PAPERCLIP_MAX_ATTEMPTS` (default: `6`)
- `PAPERCLIP_BASE_BACKOFF_MS` (default: `800`)
- `PAPERCLIP_MAX_BACKOFF_MS` (default: `30000`)
- `PAPERCLIP_MIN_DISPATCH_INTERVAL_MS` (default: `250`)
- `PAPERCLIP_DRAIN_BATCH_LIMIT` (default: `50`)
- `PAPERCLIP_MAX_QUEUE_SIZE` (default: `2000`)
- `PAPERCLIP_CIRCUIT_FAILURE_THRESHOLD` (default: `5`)
- `PAPERCLIP_CIRCUIT_COOLDOWN_SEC` (default: `120`)
- `PAPERCLIP_LOCK_LEASE_SEC` (default: `300`)
- `PAPERCLIP_DEDUPE_RETENTION_DAYS` (default: `14`)
- `PAPERCLIP_DEADLETTER_RETENTION` (default: `200`)

## State File Shape

The state file (`scripts/paperclip_to_make.state.json` by default) now stores:

- `dedupe` and `dedupeUpdatedAt`
- `queue`
- `deadLetter`
- `circuit`
- `metrics`

If the state file exists in an older format, the script upgrades it automatically at runtime.

## Recommended Start Values For Heavy Parallel Agent Activity

- `PAPERCLIP_DRAIN_BATCH_LIMIT=30`
- `PAPERCLIP_MIN_DISPATCH_INTERVAL_MS=300`
- `PAPERCLIP_CIRCUIT_FAILURE_THRESHOLD=4`
- `PAPERCLIP_CIRCUIT_COOLDOWN_SEC=180`
- `PAPERCLIP_MAX_QUEUE_SIZE=5000`

These values prioritize stability over immediate throughput.
