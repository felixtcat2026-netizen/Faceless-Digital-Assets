import { randomUUID } from 'node:crypto';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import type { LeadGoal } from './validators';

export interface LeadRecord {
  id: string;
  email: string;
  goal: LeadGoal;
  sourcePath: string;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  eventId: string;
  checkoutSessionId: string;
  productSlug: string;
  customerEmail: string;
  totalAmountCents: number | null;
  currency: string | null;
  createdAt: string;
}

export interface LeadInput {
  email: string;
  goal: LeadGoal;
  sourcePath?: string;
}

export interface OrderInput {
  eventId: string;
  checkoutSessionId: string;
  productSlug: string;
  customerEmail: string;
  totalAmountCents: number | null;
  currency: string | null;
}

export interface PlaceholderPersistence {
  saveLead(input: LeadInput): Promise<LeadRecord>;
  saveOrder(input: OrderInput): Promise<OrderRecord>;
}

export class FilePlaceholderPersistence implements PlaceholderPersistence {
  private readonly dataDir: string;

  constructor(dataDir = resolveDataDir()) {
    this.dataDir = dataDir;
  }

  async saveLead(input: LeadInput): Promise<LeadRecord> {
    const record: LeadRecord = {
      id: randomUUID(),
      email: input.email,
      goal: input.goal,
      sourcePath: input.sourcePath ?? '/',
      createdAt: new Date().toISOString()
    };
    await this.appendRecord('leads.jsonl', record);
    return record;
  }

  async saveOrder(input: OrderInput): Promise<OrderRecord> {
    const record: OrderRecord = {
      id: randomUUID(),
      eventId: input.eventId,
      checkoutSessionId: input.checkoutSessionId,
      productSlug: input.productSlug,
      customerEmail: input.customerEmail,
      totalAmountCents: input.totalAmountCents,
      currency: input.currency,
      createdAt: new Date().toISOString()
    };
    await this.appendRecord('orders.jsonl', record);
    return record;
  }

  private async appendRecord(filename: string, payload: object): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const targetPath = path.join(this.dataDir, filename);
    await appendFile(targetPath, `${JSON.stringify(payload)}\n`, 'utf8');
  }
}

export function createPlaceholderPersistence(dataDir?: string): PlaceholderPersistence {
  return new FilePlaceholderPersistence(dataDir);
}

function resolveDataDir(): string {
  const configured = process.env.PLACEHOLDER_DATA_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd(), '.local-data');
}
