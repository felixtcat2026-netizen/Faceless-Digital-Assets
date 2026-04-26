import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface RelayStatusSnapshot {
  generatedAt: string;
  statePath: string;
  stateExists: boolean;
  queueDepth: number;
  deadLetterDepth: number;
  nextAttemptAt: string | null;
  lock: {
    present: boolean;
    owner: string | null;
    expiresAt: string | null;
  };
  circuit: {
    isOpen: boolean;
    consecutiveFailures: number;
    openUntil: string | null;
    lastError: string | null;
  };
  metrics: {
    lastRunAt: string | null;
    lastRunId: string | null;
    totalRuns: number;
    totalCandidates: number;
    totalEnqueued: number;
    totalForwarded: number;
    totalRetryScheduled: number;
    totalFinalFailures: number;
    totalDropped: number;
  };
}

export interface RelayStatusOptions {
  statePath?: string;
}

export async function readRelayStatusSnapshot(
  options: RelayStatusOptions = {}
): Promise<RelayStatusSnapshot> {
  const resolvedStatePath = resolveRelayStatePath(options.statePath);
  const nowIso = new Date().toISOString();

  const state = await readJsonFile(resolvedStatePath);
  const queue = asArray(getRecordValue(state, 'queue'));
  const deadLetter = asArray(getRecordValue(state, 'deadLetter'));
  const circuit = asRecord(getRecordValue(state, 'circuit'));
  const metrics = asRecord(getRecordValue(state, 'metrics'));
  const lock = asRecord(await readJsonFile(`${resolvedStatePath}.lock`));

  const openUntil = asOptionalString(getRecordValue(circuit, 'openUntil'));

  return {
    generatedAt: nowIso,
    statePath: resolvedStatePath,
    stateExists: state !== null,
    queueDepth: queue.length,
    deadLetterDepth: deadLetter.length,
    nextAttemptAt: getNextAttemptAt(queue),
    lock: {
      present: lock !== null,
      owner: asOptionalString(getRecordValue(lock, 'owner')),
      expiresAt: asOptionalString(getRecordValue(lock, 'expiresAt'))
    },
    circuit: {
      isOpen: isFutureIsoTime(openUntil),
      consecutiveFailures: asNumber(getRecordValue(circuit, 'consecutiveFailures')),
      openUntil,
      lastError: asOptionalString(getRecordValue(circuit, 'lastError'))
    },
    metrics: {
      lastRunAt: asOptionalString(getRecordValue(metrics, 'lastRunAt')),
      lastRunId: asOptionalString(getRecordValue(metrics, 'lastRunId')),
      totalRuns: asNumber(getRecordValue(metrics, 'totalRuns')),
      totalCandidates: asNumber(getRecordValue(metrics, 'totalCandidates')),
      totalEnqueued: asNumber(getRecordValue(metrics, 'totalEnqueued')),
      totalForwarded: asNumber(getRecordValue(metrics, 'totalForwarded')),
      totalRetryScheduled: asNumber(getRecordValue(metrics, 'totalRetryScheduled')),
      totalFinalFailures: asNumber(getRecordValue(metrics, 'totalFinalFailures')),
      totalDropped: asNumber(getRecordValue(metrics, 'totalDropped'))
    }
  };
}

function resolveRelayStatePath(override: string | undefined): string {
  const fromOption = (override ?? '').trim();
  if (fromOption) {
    return path.resolve(fromOption);
  }

  const fromEnv = (process.env.PAPERCLIP_RELAY_STATE_PATH ?? '').trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  return path.resolve(process.cwd(), 'scripts', 'paperclip_to_make.state.json');
}

async function readJsonFile(targetPath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(targetPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return asRecord(parsed);
  } catch (error) {
    if (isFileNotFound(error)) {
      return null;
    }

    throw error;
  }
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getRecordValue(record: Record<string, unknown> | null, key: string): unknown {
  if (!record) {
    return undefined;
  }

  return record[key];
}

function getNextAttemptAt(queue: unknown[]): string | null {
  for (const item of queue) {
    const itemRecord = asRecord(item);
    const candidate = asOptionalString(getRecordValue(itemRecord, 'nextAttemptAt'));
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function isFutureIsoTime(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return parsed > Date.now();
}
