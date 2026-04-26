#!/bin/bash
set -e

# ===== Config =====
PAPERCLIP_API_BASE="${PAPERCLIP_API_BASE:-http://127.0.0.1:3101/api}"
COMPANY_ID="${PAPERCLIP_COMPANY_ID:-9c5d7a79-46fd-4517-81bd-45649be55dbb}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY:-pcp_58e4109abf4ad87b516c5d3f5832d36b8842bfb5574a84e4}"

MAKE_WEBHOOK_URL="${MAKE_WEBHOOK_URL:-https://hook.us2.make.com/lxdvbzq45ttmbf1jdsow20qe43tj8omj}"
MAKE_WEBHOOK_API_KEY="${MAKE_WEBHOOK_API_KEY:-68037izex2mhjvcdyoukps1bw5q9grafl4nt}"

MY_USER_ID="${PAPERCLIP_APPROVER_USER_ID:-local-board}"
UI_BASE="${PAPERCLIP_UI_BASE:-http://127.0.0.1:3100}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_PATH="${PAPERCLIP_RELAY_STATE_PATH:-$SCRIPT_DIR/paperclip_to_make.state.json}"
LOCK_PATH="$STATE_PATH.lock"

APPROVAL_STATUSES="${PAPERCLIP_APPROVAL_STATUSES:-in_review,needs_approval,review_requested,decision_required}"

FETCH_TIMEOUT_SEC="${PAPERCLIP_FETCH_TIMEOUT_SEC:-20}"
SEND_TIMEOUT_SEC="${PAPERCLIP_SEND_TIMEOUT_SEC:-20}"
MAX_ATTEMPTS="${PAPERCLIP_MAX_ATTEMPTS:-6}"
BASE_BACKOFF_MS="${PAPERCLIP_BASE_BACKOFF_MS:-800}"
MAX_BACKOFF_MS="${PAPERCLIP_MAX_BACKOFF_MS:-30000}"
MIN_DISPATCH_INTERVAL_MS="${PAPERCLIP_MIN_DISPATCH_INTERVAL_MS:-250}"
DRAIN_BATCH_LIMIT="${PAPERCLIP_DRAIN_BATCH_LIMIT:-50}"
MAX_QUEUE_SIZE="${PAPERCLIP_MAX_QUEUE_SIZE:-2000}"
CIRCUIT_FAILURE_THRESHOLD="${PAPERCLIP_CIRCUIT_FAILURE_THRESHOLD:-5}"
CIRCUIT_COOLDOWN_SEC="${PAPERCLIP_CIRCUIT_COOLDOWN_SEC:-120}"
LOCK_LEASE_SEC="${PAPERCLIP_LOCK_LEASE_SEC:-300}"
DEDUPE_RETENTION_DAYS="${PAPERCLIP_DEDUPE_RETENTION_DAYS:-14}"
DEAD_LETTER_RETENTION="${PAPERCLIP_DEADLETTER_RETENTION:-200}"

DRY_RUN="${DRY_RUN:-false}"

# ===== Validation =====
if [ -z "$PAPERCLIP_API_KEY" ]; then
  echo "ERROR: PAPERCLIP_API_KEY is required." >&2
  exit 1
fi
if [ -z "$MAKE_WEBHOOK_API_KEY" ]; then
  echo "ERROR: MAKE_WEBHOOK_API_KEY is required." >&2
  exit 1
fi

# ===== Helpers =====
RUN_ID=$(cat /proc/sys/kernel/random/uuid | tr -d '-')
RUN_STARTED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

now_utc() {
  date -u +"%Y-%m-%dT%H:%M:%S.%3NZ"
}

now_utc_epoch_ms() {
  echo $(($(date +%s%N) / 1000000))
}

parse_utc_to_epoch_ms() {
  local value="$1"
  if [ -z "$value" ] || [ "$value" = "" ]; then
    echo 0
    return
  fi
  local epoch=$(date -d "$value" +%s 2>/dev/null || echo 0)
  echo $((epoch * 1000))
}

sleep_ms() {
  local ms=$1
  sleep $(echo "scale=3; $ms / 1000" | bc)
}

save_state() {
  echo "$1" | jq '.' > "$STATE_PATH"
}

load_state() {
  if [ -f "$STATE_PATH" ]; then
    cat "$STATE_PATH"
  else
    echo '{}'
  fi
}

ensure_state_shape() {
  local state="$1"
  echo "$state" | jq '
    .version = (.version // 2) |
    .dedupe = (.dedupe // {}) |
    .dedupeUpdatedAt = (.dedupeUpdatedAt // {}) |
    .queue = (.queue // []) |
    .deadLetter = (.deadLetter // []) |
    .circuit = (.circuit // {
      "consecutiveFailures": 0,
      "openUntil": "",
      "openedAt": "",
      "lastError": ""
    }) |
    .metrics = (.metrics // {
      "totalRuns": 0,
      "totalCandidates": 0,
      "totalEnqueued": 0,
      "totalForwarded": 0,
      "totalRetryScheduled": 0,
      "totalFinalFailures": 0,
      "totalDropped": 0,
      "lastRunAt": "",
      "lastRunId": ""
    })
  '
}

trim_dedupe_state() {
  local state="$1"
  local retention_days="$2"
  local cutoff=$(date -u -d "$retention_days days ago" +"%Y-%m-%dT%H:%M:%S.%3NZ")
  echo "$state" | jq --arg cutoff "$cutoff" '
    .dedupe |= with_entries(select(.value >= $cutoff)) |
    .dedupeUpdatedAt |= with_entries(select(.value >= $cutoff))
  '
}

compute_backoff_ms() {
  local attempt=$1
  local exp=$((1 << (attempt - 1)))
  local raw=$((BASE_BACKOFF_MS * exp))
  local capped=$((raw < MAX_BACKOFF_MS ? raw : MAX_BACKOFF_MS))
  local jitter=$((RANDOM % (capped * 35 / 100)))
  echo $((capped + jitter))
}

# ===== Locking =====
LOCK_OWNER="$(hostname)-$$-$RUN_ID"

acquire_lock() {
  local lease_seconds=$1
  local expires_at=$(date -u -d "+$lease_seconds seconds" +"%Y-%m-%dT%H:%M:%S.%3NZ")
  
  local lock_payload=$(jq -n \
    --arg owner "$LOCK_OWNER" \
    --arg runId "$RUN_ID" \
    --arg acquiredAt "$(now_utc)" \
    --arg expiresAt "$expires_at" \
    '{owner: $owner, runId: $runId, acquiredAt: $acquiredAt, expiresAt: $expiresAt}')
  
  local attempt=0
  while [ $attempt -lt 2 ]; do
    attempt=$((attempt + 1))
    if (set -o noclobber; echo "$lock_payload" > "$LOCK_PATH") 2>/dev/null; then
      return 0
    fi
    
    if [ ! -f "$LOCK_PATH" ]; then
      sleep 0.2
      continue
    fi
    
    local existing=$(cat "$LOCK_PATH" 2>/dev/null || echo '{}')
    local existing_expires=$(echo "$existing" | jq -r '.expiresAt // ""')
    local existing_epoch=$(parse_utc_to_epoch_ms "$existing_expires")
    local now_epoch=$(now_utc_epoch_ms)
    
    if [ "$existing_epoch" -le "$now_epoch" ]; then
      rm -f "$LOCK_PATH"
      sleep 0.15
      continue
    fi
    
    local existing_owner=$(echo "$existing" | jq -r '.owner // "unknown"')
    echo "ERROR: Relay already running under lock owner '$existing_owner' until $existing_expires." >&2
    exit 1
  done
  
  echo "ERROR: Unable to acquire lock at $LOCK_PATH." >&2
  exit 1
}

renew_lock() {
  local lease_seconds=$1
  if [ ! -f "$LOCK_PATH" ]; then
    echo "ERROR: Lock disappeared unexpectedly: $LOCK_PATH" >&2
    exit 1
  fi
  
  local existing=$(cat "$LOCK_PATH")
  local existing_owner=$(echo "$existing" | jq -r '.owner // ""')
  if [ "$existing_owner" != "$LOCK_OWNER" ]; then
    echo "ERROR: Lock owner mismatch. Expected '$LOCK_OWNER' but found '$existing_owner'." >&2
    exit 1
  fi
  
  local expires_at=$(date -u -d "+$lease_seconds seconds" +"%Y-%m-%dT%H:%M:%S.%3NZ")
  echo "$existing" | jq --arg expiresAt "$expires_at" --arg renewedAt "$(now_utc)" \
    '.expiresAt = $expiresAt | .renewedAt = $renewedAt' > "$LOCK_PATH"
}

release_lock() {
  rm -f "$LOCK_PATH" 2>/dev/null || true
}

# ===== Main Execution =====
trap release_lock EXIT

acquire_lock $LOCK_LEASE_SEC

# Load state
state=$(load_state)
state=$(ensure_state_shape "$state")
state=$(trim_dedupe_state "$state" $DEDUPE_RETENTION_DAYS)

queue_depth_start=$(echo "$state" | jq '.queue | length')

# Circuit breaker gate
open_until=$(echo "$state" | jq -r '.circuit.openUntil // ""')
open_until_epoch=$(parse_utc_to_epoch_ms "$open_until")
now_epoch=$(now_utc_epoch_ms)

if [ "$open_until_epoch" -gt "$now_epoch" ]; then
  state=$(echo "$state" | jq \
    --arg runId "$RUN_ID" \
    --arg lastRunAt "$(now_utc)" \
    '.metrics.totalRuns = (.metrics.totalRuns + 1) |
     .metrics.lastRunAt = $lastRunAt |
     .metrics.lastRunId = $runId')
  save_state "$state"
  echo "CircuitOpen runId=$RUN_ID openUntil=$open_until queueDepth=$queue_depth_start"
  exit 0
fi

renew_lock $LOCK_LEASE_SEC

# Fetch issues
headers=("Authorization: Bearer $PAPERCLIP_API_KEY")
status_csv="$APPROVAL_STATUSES"
url="$PAPERCLIP_API_BASE/companies/$COMPANY_ID/issues?status=$status_csv"

issues_raw=$(curl -s -f --max-time $FETCH_TIMEOUT_SEC \
  -H "${headers[0]}" \
  "$url")

# Normalize issues (handle array or {items: []})
if echo "$issues_raw" | jq -e 'type == "array"' >/dev/null 2>&1; then
  issues="$issues_raw"
else
  issues=$(echo "$issues_raw" | jq '.items // []')
fi

# Stage to durable queue
candidates=0
enqueued=0
skipped_already_forwarded=0

issue_count=$(echo "$issues" | jq 'length')
for ((i=0; i<issue_count; i++)); do
  issue=$(echo "$issues" | jq ".[$i]")
  
  assignee=$(echo "$issue" | jq -r '.assigneeUserId // ""')
  status=$(echo "$issue" | jq -r '.status // ""')
  
  if [ "$assignee" != "$MY_USER_ID" ]; then
    continue
  fi
  
  if ! echo ",$APPROVAL_STATUSES," | grep -q ",$status,"; then
    continue
  fi
  
  candidates=$((candidates + 1))
  
  issue_id=$(echo "$issue" | jq -r '.id // ""')
  if [ -z "$issue_id" ] || [ "$issue_id" = "null" ]; then
    continue
  fi
  
  updated_at=$(echo "$issue" | jq -r '.updatedAt // ""')
  dedupe_key="$status|$updated_at"
  
  # Check dedupe
  existing_dedupe=$(echo "$state" | jq -r --arg id "$issue_id" '.dedupe[$id] // ""')
  if [ "$existing_dedupe" = "$dedupe_key" ]; then
    skipped_already_forwarded=$((skipped_already_forwarded + 1))
    continue
  fi
  
  # Check if in queue
  in_queue=$(echo "$state" | jq --arg id "$issue_id" --arg key "$dedupe_key" \
    '[.queue[] | select(.issueId == $id and .dedupeKey == $key)] | length')
  if [ "$in_queue" -gt 0 ]; then
    continue
  fi
  
  # Build payload
  identifier=$(echo "$issue" | jq -r '.identifier // ""')
  if [ -n "$identifier" ] && [ "$identifier" != "null" ]; then
    issue_url="$UI_BASE/NAM/issues/$identifier"
  else
    issue_url="$UI_BASE"
  fi
  
  payload=$(jq -n \
    --arg eventType "approval_needed" \
    --arg approverUserId "$MY_USER_ID" \
    --arg why "Issue is waiting for your approval" \
    --arg issueId "$issue_id" \
    --arg identifier "$identifier" \
    --arg title "$(echo "$issue" | jq -r '.title // ""')" \
    --arg status "$status" \
    --arg dueAt "$(echo "$issue" | jq -r '.dueAt // ""')" \
    --arg updatedAt "$updated_at" \
    --arg url "$issue_url" \
    --arg runId "$RUN_ID" \
    --arg queuedAt "$(now_utc)" \
    '{
      eventType: $eventType,
      approverUserId: $approverUserId,
      why: $why,
      issue: {
        id: $issueId,
        identifier: $identifier,
        title: $title,
        status: $status,
        dueAt: $dueAt,
        updatedAt: $updatedAt,
        url: $url
      },
      relay: {
        runId: $runId,
        queuedAt: $queuedAt
      }
    }' | jq -c '.')
  
  queue_item_id=$(cat /proc/sys/kernel/random/uuid | tr -d '-')
  idempotency_key="$issue_id|$dedupe_key"
  
  queue_item=$(jq -n \
    --arg id "$queue_item_id" \
    --arg issueId "$issue_id" \
    --arg dedupeKey "$dedupe_key" \
    --arg idempotencyKey "$idempotency_key" \
    --arg payload "$payload" \
    --arg now "$(now_utc)" \
    '{
      id: $id,
      issueId: $issueId,
      dedupeKey: $dedupeKey,
      idempotencyKey: $idempotencyKey,
      payload: ($payload | fromjson),
      attempts: 0,
      nextAttemptAt: $now,
      createdAt: $now,
      updatedAt: $now,
      lastError: "",
      lastStatusCode: null
    }')
  
  state=$(echo "$state" | jq --argjson item "$queue_item" '.queue += [$item]')
  enqueued=$((enqueued + 1))
done

# Trim queue if over max size
queue_length=$(echo "$state" | jq '.queue | length')
if [ "$queue_length" -gt "$MAX_QUEUE_SIZE" ]; then
  overflow=$((queue_length - MAX_QUEUE_SIZE))
  state=$(echo "$state" | jq --argjson skip "$overflow" '.queue = .queue[$skip:]')
fi

save_state "$state"

# Drain queue
forwarded=0
retry_scheduled=0
final_failures=0
dropped=0
sent_this_run=0
circuit_open=false
last_dispatch_at=0

while true; do
  queue_length=$(echo "$state" | jq '.queue | length')
  if [ "$queue_length" -eq 0 ] || [ "$sent_this_run" -ge "$DRAIN_BATCH_LIMIT" ]; then
    break
  fi
  
  renew_lock $LOCK_LEASE_SEC
  
  now_epoch=$(now_utc_epoch_ms)
  head=$(echo "$state" | jq '.queue[0]')
  next_attempt_at=$(echo "$head" | jq -r '.nextAttemptAt // ""')
  next_attempt_epoch=$(parse_utc_to_epoch_ms "$next_attempt_at")
  
  if [ "$next_attempt_epoch" -gt "$now_epoch" ]; then
    break
  fi
  
  # Rate limiting
  if [ "$last_dispatch_at" -ne 0 ]; then
    elapsed_ms=$((now_epoch - last_dispatch_at))
    if [ "$elapsed_ms" -lt "$MIN_DISPATCH_INTERVAL_MS" ]; then
      sleep_ms $((MIN_DISPATCH_INTERVAL_MS - elapsed_ms))
    fi
  fi
  
  attempts=$(echo "$head" | jq '.attempts // 0')
  attempt_number=$((attempts + 1))
  
  send_ok=false
  status_code=""
  error_message=""
  
  if [ "$DRY_RUN" = "true" ]; then
    send_ok=true
  else
    response=$(curl -s -w "\n%{http_code}" --max-time $SEND_TIMEOUT_SEC \
      -X POST \
      -H "Content-Type: application/json" \
      -H "x-make-apikey: $MAKE_WEBHOOK_API_KEY" \
      -H "x-idempotency-key: $(echo "$head" | jq -r '.idempotencyKey')" \
      -H "x-relay-run-id: $RUN_ID" \
      -d "$(echo "$head" | jq -c '.payload')" \
      "$MAKE_WEBHOOK_URL" 2>&1) || true
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
      send_ok=true
    else
      error_message="$body"
    fi
  fi
  
  last_dispatch_at=$(now_utc_epoch_ms)
  
  if [ "$send_ok" = "true" ]; then
    # Success - remove from queue, update dedupe
    state=$(echo "$state" | jq --arg issueId "$(echo "$head" | jq -r '.issueId')" \
      --arg dedupeKey "$(echo "$head" | jq -r '.dedupeKey')" \
      --arg now "$(now_utc)" \
      '.queue = .queue[1:] |
       .dedupe[$issueId] = $dedupeKey |
       .dedupeUpdatedAt[$issueId] = $now |
       .circuit.consecutiveFailures = 0 |
       .circuit.openUntil = "" |
       .circuit.openedAt = "" |
       .circuit.lastError = ""')
    forwarded=$((forwarded + 1))
    sent_this_run=$((sent_this_run + 1))
    save_state "$state"
    continue
  fi
  
  # Failure - retry or dead letter
  is_retryable=false
  if [ -z "$status_code" ] || \
     [ "$status_code" = "408" ] || [ "$status_code" = "409" ] || \
     [ "$status_code" = "425" ] || [ "$status_code" = "429" ] || \
     [ "$status_code" -ge 500 ] 2>/dev/null; then
    is_retryable=true
  fi
  
  if [ "$attempt_number" -lt "$MAX_ATTEMPTS" ] && [ "$is_retryable" = "true" ]; then
    backoff_ms=$(compute_backoff_ms $attempt_number)
    next_attempt=$(date -u -d "+$backoff_ms milliseconds" +"%Y-%m-%dT%H:%M:%S.%3NZ" 2>/dev/null || now_utc)
    
    state=$(echo "$state" | jq \
      --argjson attempts "$attempt_number" \
      --arg nextAttemptAt "$next_attempt" \
      --arg now "$(now_utc)" \
      --arg lastError "$error_message" \
      --argjson statusCode "${status_code:-null}" \
      '.queue[0].attempts = $attempts |
       .queue[0].nextAttemptAt = $nextAttemptAt |
       .queue[0].updatedAt = $now |
       .queue[0].lastError = $lastError |
       .queue[0].lastStatusCode = $statusCode |
       .circuit.consecutiveFailures = (.circuit.consecutiveFailures + 1) |
       .circuit.lastError = (if $statusCode != null then "status=\($statusCode) \($lastError)" else $lastError end)')
    retry_scheduled=$((retry_scheduled + 1))
    save_state "$state"
  else
    # Dead letter
    dead_letter_item=$(jq -n \
      --arg id "$(echo "$head" | jq -r '.id')" \
      --arg issueId "$(echo "$head" | jq -r '.issueId')" \
      --arg dedupeKey "$(echo "$head" | jq -r '.dedupeKey')" \
      --argjson payload "$(echo "$head" | jq '.payload')" \
      --argjson attempts "$attempt_number" \
      --arg failedAt "$(now_utc)" \
      --arg reason "$(if [ -n "$status_code" ]; then echo "status=$status_code $error_message"; else echo "$error_message"; fi)" \
      '{
        id: $id,
        issueId: $issueId,
        dedupeKey: $dedupeKey,
        payload: $payload,
        attempts: $attempts,
        failedAt: $failedAt,
        reason: $reason
      }')
    
    state=$(echo "$state" | jq \
      --argjson dl "$dead_letter_item" \
      --argjson max "$DEAD_LETTER_RETENTION" \
      --argjson attempts "$attempt_number" \
      --arg now "$(now_utc)" \
      --arg lastError "$error_message" \
      --argjson statusCode "${status_code:-null}" \
      '.deadLetter += [$dl] |
       .deadLetter = .deadLetter[-$max:] |
       .queue = .queue[1:] |
       .circuit.consecutiveFailures = (.circuit.consecutiveFailures + 1) |
       .circuit.lastError = (if $statusCode != null then "status=\($statusCode) \($lastError)" else $lastError end)')
    final_failures=$((final_failures + 1))
    sent_this_run=$((sent_this_run + 1))
    save_state "$state"
  fi
  
  # Check circuit breaker
  consecutive_failures=$(echo "$state" | jq '.circuit.consecutiveFailures // 0')
  if [ "$consecutive_failures" -ge "$CIRCUIT_FAILURE_THRESHOLD" ]; then
    opened_at=$(now_utc)
    open_until=$(date -u -d "+$CIRCUIT_COOLDOWN_SEC seconds" +"%Y-%m-%dT%H:%M:%S.%3NZ")
    state=$(echo "$state" | jq \
      --arg openedAt "$opened_at" \
      --arg openUntil "$open_until" \
      '.circuit.openedAt = $openedAt |
       .circuit.openUntil = $openUntil')
    circuit_open=true
    save_state "$state"
    break
  fi
done

# Update metrics
queue_depth_end=$(echo "$state" | jq '.queue | length')
state=$(echo "$state" | jq \
  --argjson candidates "$candidates" \
  --argjson enqueued "$enqueued" \
  --argjson forwarded "$forwarded" \
  --argjson retryScheduled "$retry_scheduled" \
  --argjson finalFailures "$final_failures" \
  --argjson dropped "$dropped" \
  --arg lastRunAt "$(now_utc)" \
  --arg lastRunId "$RUN_ID" \
  '.metrics.totalRuns = (.metrics.totalRuns + 1) |
   .metrics.totalCandidates = (.metrics.totalCandidates + $candidates) |
   .metrics.totalEnqueued = (.metrics.totalEnqueued + $enqueued) |
   .metrics.totalForwarded = (.metrics.totalForwarded + $forwarded) |
   .metrics.totalRetryScheduled = (.metrics.totalRetryScheduled + $retryScheduled) |
   .metrics.totalFinalFailures = (.metrics.totalFinalFailures + $finalFailures) |
   .metrics.totalDropped = (.metrics.totalDropped + $dropped) |
   .metrics.lastRunAt = $lastRunAt |
   .metrics.lastRunId = $lastRunId')
save_state "$state"

echo "RelayComplete runId=$RUN_ID Candidates=$candidates Enqueued=$enqueued Forwarded=$forwarded RetryScheduled=$retry_scheduled FinalFailures=$final_failures Dropped=$dropped QueueDepthStart=$queue_depth_start QueueDepthEnd=$queue_depth_end CircuitOpen=$circuit_open"
