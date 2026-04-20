param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# ===== Config =====
$PaperclipApiBase = if ($env:PAPERCLIP_API_BASE) { $env:PAPERCLIP_API_BASE } else { "http://127.0.0.1:3101/api" }
$CompanyId = if ($env:PAPERCLIP_COMPANY_ID) { $env:PAPERCLIP_COMPANY_ID } else { "9c5d7a79-46fd-4517-81bd-45649be55dbb" }
$PaperclipApiKey = if ($env:PAPERCLIP_API_KEY) { $env:PAPERCLIP_API_KEY } else { "pcp_58e4109abf4ad87b516c5d3f5832d36b8842bfb5574a84e4" }

$MakeWebhookUrl = if ($env:MAKE_WEBHOOK_URL) { $env:MAKE_WEBHOOK_URL } else { "https://hook.us2.make.com/lxdvbzq45ttmbf1jdsow20qe43tj8omj" }
$MakeWebhookApiKey = if ($env:MAKE_WEBHOOK_API_KEY) { $env:MAKE_WEBHOOK_API_KEY } else { "68037izex2mhjvcdyoukps1bw5q9grafl4nt" }

$MyUserId = if ($env:PAPERCLIP_APPROVER_USER_ID) { $env:PAPERCLIP_APPROVER_USER_ID } else { "local-board" }
$UiBase = if ($env:PAPERCLIP_UI_BASE) { $env:PAPERCLIP_UI_BASE } else { "http://127.0.0.1:18789" }

$StatePath = if ($env:PAPERCLIP_RELAY_STATE_PATH) { $env:PAPERCLIP_RELAY_STATE_PATH } else { "C:\labs\Faceless Digital Assets\scripts\paperclip_to_make.state.json" }
$LockPath = "$StatePath.lock"

$ApprovalStatuses = if ($env:PAPERCLIP_APPROVAL_STATUSES) {
  ($env:PAPERCLIP_APPROVAL_STATUSES -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })
} else {
  @("in_review", "needs_approval", "review_requested", "decision_required")
}

$FetchTimeoutSec = [int](if ($env:PAPERCLIP_FETCH_TIMEOUT_SEC) { $env:PAPERCLIP_FETCH_TIMEOUT_SEC } else { "20" })
$SendTimeoutSec = [int](if ($env:PAPERCLIP_SEND_TIMEOUT_SEC) { $env:PAPERCLIP_SEND_TIMEOUT_SEC } else { "20" })
$MaxAttempts = [int](if ($env:PAPERCLIP_MAX_ATTEMPTS) { $env:PAPERCLIP_MAX_ATTEMPTS } else { "6" })
$BaseBackoffMs = [int](if ($env:PAPERCLIP_BASE_BACKOFF_MS) { $env:PAPERCLIP_BASE_BACKOFF_MS } else { "800" })
$MaxBackoffMs = [int](if ($env:PAPERCLIP_MAX_BACKOFF_MS) { $env:PAPERCLIP_MAX_BACKOFF_MS } else { "30000" })
$MinDispatchIntervalMs = [int](if ($env:PAPERCLIP_MIN_DISPATCH_INTERVAL_MS) { $env:PAPERCLIP_MIN_DISPATCH_INTERVAL_MS } else { "250" })
$DrainBatchLimit = [int](if ($env:PAPERCLIP_DRAIN_BATCH_LIMIT) { $env:PAPERCLIP_DRAIN_BATCH_LIMIT } else { "50" })
$MaxQueueSize = [int](if ($env:PAPERCLIP_MAX_QUEUE_SIZE) { $env:PAPERCLIP_MAX_QUEUE_SIZE } else { "2000" })
$CircuitFailureThreshold = [int](if ($env:PAPERCLIP_CIRCUIT_FAILURE_THRESHOLD) { $env:PAPERCLIP_CIRCUIT_FAILURE_THRESHOLD } else { "5" })
$CircuitCooldownSec = [int](if ($env:PAPERCLIP_CIRCUIT_COOLDOWN_SEC) { $env:PAPERCLIP_CIRCUIT_COOLDOWN_SEC } else { "120" })
$LockLeaseSec = [int](if ($env:PAPERCLIP_LOCK_LEASE_SEC) { $env:PAPERCLIP_LOCK_LEASE_SEC } else { "300" })
$DedupeRetentionDays = [int](if ($env:PAPERCLIP_DEDUPE_RETENTION_DAYS) { $env:PAPERCLIP_DEDUPE_RETENTION_DAYS } else { "14" })
$DeadLetterRetention = [int](if ($env:PAPERCLIP_DEADLETTER_RETENTION) { $env:PAPERCLIP_DEADLETTER_RETENTION } else { "200" })

if ([string]::IsNullOrWhiteSpace($PaperclipApiKey)) {
  throw "PAPERCLIP_API_KEY is required."
}
if ([string]::IsNullOrWhiteSpace($MakeWebhookApiKey)) {
  throw "MAKE_WEBHOOK_API_KEY is required."
}

$RunId = [Guid]::NewGuid().ToString("N")
$RunStartedAt = (Get-Date).ToUniversalTime()
$runMetrics = @{
  runId = $RunId
  startedAt = $RunStartedAt.ToString("o")
  candidates = 0
  enqueued = 0
  forwarded = 0
  retryScheduled = 0
  finalFailures = 0
  dropped = 0
  skippedAlreadyForwarded = 0
  queueDepthStart = 0
  queueDepthEnd = 0
  circuitOpen = $false
}

function Now-Utc {
  return (Get-Date).ToUniversalTime()
}

function Parse-UtcOrMin([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    return [DateTime]::MinValue
  }
  try {
    return [DateTime]::Parse($value).ToUniversalTime()
  } catch {
    return [DateTime]::MinValue
  }
}

function Save-State($stateToSave) {
  $stateToSave | ConvertTo-Json -Depth 12 | Set-Content -Path $StatePath -Encoding UTF8
}

function New-DefaultState {
  return @{
    version = 2
    dedupe = @{}
    dedupeUpdatedAt = @{}
    queue = @()
    deadLetter = @()
    circuit = @{
      consecutiveFailures = 0
      openUntil = ""
      openedAt = ""
      lastError = ""
    }
    metrics = @{
      totalRuns = 0
      totalCandidates = 0
      totalEnqueued = 0
      totalForwarded = 0
      totalRetryScheduled = 0
      totalFinalFailures = 0
      totalDropped = 0
      lastRunAt = ""
      lastRunId = ""
    }
  }
}

function Ensure-StateShape($stateCandidate) {
  if ($null -eq $stateCandidate -or $stateCandidate.Keys.Count -eq 0) {
    return New-DefaultState
  }

  if (-not $stateCandidate.ContainsKey("version")) { $stateCandidate["version"] = 2 }
  if (-not $stateCandidate.ContainsKey("dedupe")) { $stateCandidate["dedupe"] = @{} }
  if (-not $stateCandidate.ContainsKey("dedupeUpdatedAt")) { $stateCandidate["dedupeUpdatedAt"] = @{} }
  if (-not $stateCandidate.ContainsKey("queue")) { $stateCandidate["queue"] = @() }
  if (-not $stateCandidate.ContainsKey("deadLetter")) { $stateCandidate["deadLetter"] = @() }
  if (-not $stateCandidate.ContainsKey("circuit")) {
    $stateCandidate["circuit"] = @{
      consecutiveFailures = 0
      openUntil = ""
      openedAt = ""
      lastError = ""
    }
  }
  if (-not $stateCandidate.ContainsKey("metrics")) {
    $stateCandidate["metrics"] = @{
      totalRuns = 0
      totalCandidates = 0
      totalEnqueued = 0
      totalForwarded = 0
      totalRetryScheduled = 0
      totalFinalFailures = 0
      totalDropped = 0
      lastRunAt = ""
      lastRunId = ""
    }
  }

  return $stateCandidate
}

function Acquire-Lock {
  param([int]$leaseSeconds)

  $lockOwner = "$env:COMPUTERNAME-$PID-$RunId"
  $now = Now-Utc
  $expiresAt = $now.AddSeconds($leaseSeconds)
  $lockPayload = @{
    owner = $lockOwner
    runId = $RunId
    acquiredAt = $now.ToString("o")
    expiresAt = $expiresAt.ToString("o")
  }
  $lockJson = $lockPayload | ConvertTo-Json -Depth 5

  $attempt = 0
  while ($attempt -lt 2) {
    $attempt++
    try {
      $stream = [System.IO.File]::Open($LockPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
      try {
        $writer = New-Object System.IO.StreamWriter($stream)
        $writer.Write($lockJson)
        $writer.Flush()
      } finally {
        if ($writer) { $writer.Dispose() }
        $stream.Dispose()
      }
      return $lockOwner
    } catch {
      if (-not (Test-Path $LockPath)) {
        Start-Sleep -Milliseconds 200
        continue
      }

      $existing = $null
      try {
        $raw = Get-Content $LockPath -Raw
        if (-not [string]::IsNullOrWhiteSpace($raw)) {
          $existing = ConvertFrom-Json $raw -AsHashtable
        }
      } catch {
        $existing = $null
      }

      $existingExpires = Parse-UtcOrMin $existing.expiresAt
      if ($existingExpires -le $now) {
        Remove-Item -Path $LockPath -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 150
        continue
      }

      throw "Relay already running under lock owner '$($existing.owner)' until $($existing.expiresAt)."
    }
  }

  throw "Unable to acquire lock at $LockPath."
}

function Renew-Lock {
  param(
    [string]$lockOwner,
    [int]$leaseSeconds
  )

  if (-not (Test-Path $LockPath)) {
    throw "Lock disappeared unexpectedly: $LockPath"
  }

  $existingRaw = Get-Content $LockPath -Raw
  $existing = ConvertFrom-Json $existingRaw -AsHashtable
  if ($existing.owner -ne $lockOwner) {
    throw "Lock owner mismatch. Expected '$lockOwner' but found '$($existing.owner)'."
  }

  $now = Now-Utc
  $existing["expiresAt"] = $now.AddSeconds($leaseSeconds).ToString("o")
  $existing["renewedAt"] = $now.ToString("o")
  $existing | ConvertTo-Json -Depth 5 | Set-Content -Path $LockPath -Encoding UTF8
}

function Release-Lock {
  if (Test-Path $LockPath) {
    Remove-Item -Path $LockPath -Force -ErrorAction SilentlyContinue
  }
}

function Get-HttpStatusFromError($errorRecord) {
  $response = $errorRecord.Exception.Response
  if ($null -eq $response) {
    return $null
  }

  if ($response -is [System.Net.HttpWebResponse]) {
    return [int]$response.StatusCode
  }

  try {
    return [int]$response.StatusCode.value__
  } catch {
    return $null
  }
}

function Is-RetryableStatus($statusCode) {
  if ($null -eq $statusCode) { return $true }
  if ($statusCode -eq 408 -or $statusCode -eq 409 -or $statusCode -eq 425 -or $statusCode -eq 429) { return $true }
  if ($statusCode -ge 500) { return $true }
  return $false
}

function Compute-BackoffMs([int]$attemptNumber) {
  $exp = [Math]::Pow(2, [Math]::Max(0, $attemptNumber - 1))
  $raw = [int]($BaseBackoffMs * $exp)
  $capped = [Math]::Min($raw, $MaxBackoffMs)
  $jitter = Get-Random -Minimum 0 -Maximum ([Math]::Max(1, [int]($capped * 0.35)))
  return $capped + $jitter
}

function Normalize-Issues($issuesResult) {
  if ($null -eq $issuesResult) { return @() }

  if ($issuesResult -is [System.Array]) {
    return $issuesResult
  }

  if ($issuesResult.PSObject.Properties.Name -contains "items" -and $issuesResult.items -is [System.Array]) {
    return $issuesResult.items
  }

  return @($issuesResult)
}

function Item-ExistsInQueue($queue, [string]$issueId, [string]$dedupeKey) {
  foreach ($item in $queue) {
    if ($item.issueId -eq $issueId -and $item.dedupeKey -eq $dedupeKey) {
      return $true
    }
  }
  return $false
}

function Trim-DedupeState($stateToTrim, [int]$retentionDays) {
  $cutoff = (Now-Utc).AddDays(-1 * $retentionDays)
  $toRemove = @()
  foreach ($entry in $stateToTrim.dedupeUpdatedAt.GetEnumerator()) {
    $updated = Parse-UtcOrMin $entry.Value
    if ($updated -lt $cutoff) {
      $toRemove += $entry.Key
    }
  }

  foreach ($key in $toRemove) {
    $stateToTrim.dedupe.Remove($key) | Out-Null
    $stateToTrim.dedupeUpdatedAt.Remove($key) | Out-Null
  }
}

function Add-DeadLetter($stateToUpdate, $queueItem, [string]$reason) {
  $stateToUpdate.deadLetter += @{
    id = $queueItem.id
    issueId = $queueItem.issueId
    dedupeKey = $queueItem.dedupeKey
    payload = $queueItem.payload
    attempts = $queueItem.attempts
    failedAt = (Now-Utc).ToString("o")
    reason = $reason
  }

  if ($stateToUpdate.deadLetter.Count -gt $DeadLetterRetention) {
    $overflow = $stateToUpdate.deadLetter.Count - $DeadLetterRetention
    $stateToUpdate.deadLetter = @($stateToUpdate.deadLetter | Select-Object -Skip $overflow)
  }
}

$lockOwner = $null
try {
  $lockOwner = Acquire-Lock -leaseSeconds $LockLeaseSec

  # ===== Load state =====
  $state = @{}
  if (Test-Path $StatePath) {
    try {
      $raw = Get-Content $StatePath -Raw
      if (-not [string]::IsNullOrWhiteSpace($raw)) {
        $state = ConvertFrom-Json $raw -AsHashtable
      }
    } catch {
      $state = @{}
    }
  }
  $state = Ensure-StateShape $state
  Trim-DedupeState -stateToTrim $state -retentionDays $DedupeRetentionDays
  $runMetrics.queueDepthStart = $state.queue.Count

  # ===== Circuit breaker gate =====
  $openUntil = Parse-UtcOrMin $state.circuit.openUntil
  $now = Now-Utc
  if ($openUntil -gt $now) {
    $runMetrics.circuitOpen = $true
    $runMetrics.queueDepthEnd = $state.queue.Count
    $state.metrics.totalRuns = [int]$state.metrics.totalRuns + 1
    $state.metrics.lastRunAt = $now.ToString("o")
    $state.metrics.lastRunId = $RunId
    Save-State $state
    Write-Output "CircuitOpen runId=$RunId openUntil=$($state.circuit.openUntil) queueDepth=$($state.queue.Count)"
    exit 0
  }

  # ===== Fetch issues =====
  Renew-Lock -lockOwner $lockOwner -leaseSeconds $LockLeaseSec
  $headers = @{ Authorization = "Bearer $PaperclipApiKey" }
  $statusCsv = ($ApprovalStatuses -join ",")
  $url = "$PaperclipApiBase/companies/$CompanyId/issues?status=$statusCsv"

  $issuesRaw = Invoke-RestMethod -Method Get -Uri $url -Headers $headers -TimeoutSec $FetchTimeoutSec
  $issues = Normalize-Issues $issuesRaw

  # ===== Stage to durable queue =====
  foreach ($i in $issues) {
    if ($i.assigneeUserId -ne $MyUserId) { continue }
    if ($ApprovalStatuses -notcontains $i.status) { continue }
    $runMetrics.candidates++

    $issueId = [string]$i.id
    if ([string]::IsNullOrWhiteSpace($issueId)) { continue }
    $dedupeKey = "$($i.status)|$($i.updatedAt)"

    if ($state.dedupe.ContainsKey($issueId) -and $state.dedupe[$issueId] -eq $dedupeKey) {
      $runMetrics.skippedAlreadyForwarded++
      continue
    }
    if (Item-ExistsInQueue -queue $state.queue -issueId $issueId -dedupeKey $dedupeKey) {
      continue
    }

    $issueUrl = if ($i.identifier) { "$UiBase/NAM/issues/$($i.identifier)" } else { $UiBase }
    $payloadObject = @{
      eventType = "approval_needed"
      approverUserId = $MyUserId
      why = "Issue is waiting for your approval"
      issue = @{
        id = $issueId
        identifier = $i.identifier
        title = $i.title
        status = $i.status
        dueAt = $i.dueAt
        updatedAt = $i.updatedAt
        url = $issueUrl
      }
      relay = @{
        runId = $RunId
        queuedAt = (Now-Utc).ToString("o")
      }
    }
    $payloadJson = $payloadObject | ConvertTo-Json -Depth 8 -Compress
    $queueItem = @{
      id = [Guid]::NewGuid().ToString("N")
      issueId = $issueId
      dedupeKey = $dedupeKey
      idempotencyKey = "$issueId|$dedupeKey"
      payload = $payloadJson
      attempts = 0
      nextAttemptAt = (Now-Utc).ToString("o")
      createdAt = (Now-Utc).ToString("o")
      updatedAt = (Now-Utc).ToString("o")
      lastError = ""
      lastStatusCode = $null
    }

    $state.queue += $queueItem
    $runMetrics.enqueued++
  }

  if ($state.queue.Count -gt $MaxQueueSize) {
    $overflow = $state.queue.Count - $MaxQueueSize
    $state.queue = @($state.queue | Select-Object -Skip $overflow)
    $runMetrics.dropped += $overflow
  }
  Save-State $state

  # ===== Drain queue with backpressure/retries =====
  $sentThisRun = 0
  $lastDispatchAt = [DateTime]::MinValue
  while ($state.queue.Count -gt 0 -and $sentThisRun -lt $DrainBatchLimit) {
    Renew-Lock -lockOwner $lockOwner -leaseSeconds $LockLeaseSec

    $now = Now-Utc
    $head = $state.queue[0]
    $nextAttemptAt = Parse-UtcOrMin $head.nextAttemptAt
    if ($nextAttemptAt -gt $now) {
      break
    }

    if ($lastDispatchAt -ne [DateTime]::MinValue) {
      $elapsedMs = [int]((Now-Utc) - $lastDispatchAt).TotalMilliseconds
      if ($elapsedMs -lt $MinDispatchIntervalMs) {
        Start-Sleep -Milliseconds ($MinDispatchIntervalMs - $elapsedMs)
      }
    }

    $attemptNumber = [int]$head.attempts + 1
    $statusCode = $null
    $sendOk = $false
    $errorMessage = ""

    if ($DryRun) {
      $sendOk = $true
    } else {
      try {
        Invoke-RestMethod -Method Post -Uri $MakeWebhookUrl -Headers @{
          "Content-Type" = "application/json"
          "x-make-apikey" = $MakeWebhookApiKey
          "x-idempotency-key" = $head.idempotencyKey
          "x-relay-run-id" = $RunId
        } -Body $head.payload -TimeoutSec $SendTimeoutSec | Out-Null
        $sendOk = $true
      } catch {
        $statusCode = Get-HttpStatusFromError $_
        $errorMessage = $_.Exception.Message
      }
    }

    $lastDispatchAt = Now-Utc

    if ($sendOk) {
      $state.queue = @($state.queue | Select-Object -Skip 1)
      $state.dedupe[$head.issueId] = $head.dedupeKey
      $state.dedupeUpdatedAt[$head.issueId] = (Now-Utc).ToString("o")
      $state.circuit.consecutiveFailures = 0
      $state.circuit.openUntil = ""
      $state.circuit.openedAt = ""
      $state.circuit.lastError = ""
      $runMetrics.forwarded++
      $sentThisRun++
      Save-State $state
      continue
    }

    $isRetryable = Is-RetryableStatus $statusCode
    $head.attempts = $attemptNumber
    $head.updatedAt = (Now-Utc).ToString("o")
    $head.lastStatusCode = $statusCode
    $head.lastError = $errorMessage

    if ($attemptNumber -lt $MaxAttempts -and $isRetryable) {
      $backoffMs = Compute-BackoffMs $attemptNumber
      $head.nextAttemptAt = (Now-Utc).AddMilliseconds($backoffMs).ToString("o")
      $state.queue[0] = $head
      $state.circuit.consecutiveFailures = [int]$state.circuit.consecutiveFailures + 1
      $state.circuit.lastError = if ($statusCode) { "status=$statusCode $errorMessage" } else { $errorMessage }
      $runMetrics.retryScheduled++
      Save-State $state
    } else {
      $state.queue = @($state.queue | Select-Object -Skip 1)
      Add-DeadLetter -stateToUpdate $state -queueItem $head -reason (if ($statusCode) { "status=$statusCode $errorMessage" } else { $errorMessage })
      $state.circuit.consecutiveFailures = [int]$state.circuit.consecutiveFailures + 1
      $state.circuit.lastError = if ($statusCode) { "status=$statusCode $errorMessage" } else { $errorMessage }
      $runMetrics.finalFailures++
      $sentThisRun++
      Save-State $state
    }

    if ([int]$state.circuit.consecutiveFailures -ge $CircuitFailureThreshold) {
      $openedAt = Now-Utc
      $state.circuit.openedAt = $openedAt.ToString("o")
      $state.circuit.openUntil = $openedAt.AddSeconds($CircuitCooldownSec).ToString("o")
      $runMetrics.circuitOpen = $true
      Save-State $state
      break
    }
  }

  # ===== Persist metrics =====
  $runMetrics.queueDepthEnd = $state.queue.Count
  $state.metrics.totalRuns = [int]$state.metrics.totalRuns + 1
  $state.metrics.totalCandidates = [int]$state.metrics.totalCandidates + [int]$runMetrics.candidates
  $state.metrics.totalEnqueued = [int]$state.metrics.totalEnqueued + [int]$runMetrics.enqueued
  $state.metrics.totalForwarded = [int]$state.metrics.totalForwarded + [int]$runMetrics.forwarded
  $state.metrics.totalRetryScheduled = [int]$state.metrics.totalRetryScheduled + [int]$runMetrics.retryScheduled
  $state.metrics.totalFinalFailures = [int]$state.metrics.totalFinalFailures + [int]$runMetrics.finalFailures
  $state.metrics.totalDropped = [int]$state.metrics.totalDropped + [int]$runMetrics.dropped
  $state.metrics.lastRunAt = (Now-Utc).ToString("o")
  $state.metrics.lastRunId = $RunId
  Save-State $state

  $summary = @(
    "runId=$RunId",
    "Candidates=$($runMetrics.candidates)",
    "Enqueued=$($runMetrics.enqueued)",
    "Forwarded=$($runMetrics.forwarded)",
    "RetryScheduled=$($runMetrics.retryScheduled)",
    "FinalFailures=$($runMetrics.finalFailures)",
    "Dropped=$($runMetrics.dropped)",
    "QueueDepthStart=$($runMetrics.queueDepthStart)",
    "QueueDepthEnd=$($runMetrics.queueDepthEnd)",
    "CircuitOpen=$($runMetrics.circuitOpen)"
  ) -join " "
  Write-Output "RelayComplete $summary"
}
finally {
  Release-Lock
}
