import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  handleApiRequest,
  type ApiHandlerDependencies,
  type ApiResponsePayload
} from './api';
import type {
  LeadInput,
  LeadRecord,
  OrderInput,
  OrderRecord,
  PlaceholderPersistence
} from './persistence';

class MemoryPersistence implements PlaceholderPersistence {
  readonly leads: LeadRecord[] = [];
  readonly orders: OrderRecord[] = [];

  async saveLead(input: LeadInput): Promise<LeadRecord> {
    const record: LeadRecord = {
      id: `lead_${this.leads.length + 1}`,
      email: input.email,
      goal: input.goal,
      sourcePath: input.sourcePath ?? '/',
      createdAt: '2026-04-09T00:00:00.000Z'
    };
    this.leads.push(record);
    return record;
  }

  async saveOrder(input: OrderInput): Promise<OrderRecord> {
    const record: OrderRecord = {
      id: `order_${this.orders.length + 1}`,
      eventId: input.eventId,
      checkoutSessionId: input.checkoutSessionId,
      productSlug: input.productSlug,
      customerEmail: input.customerEmail,
      totalAmountCents: input.totalAmountCents,
      currency: input.currency,
      createdAt: '2026-04-09T00:00:00.000Z'
    };
    this.orders.push(record);
    return record;
  }
}

describe('handleApiRequest', () => {
  it('creates lead records for /api/lead-magnet', async () => {
    const persistence = new MemoryPersistence();
    const response = await handleApiRequest(
      new Request('http://localhost:5173/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'lead@example.com',
          goal: 'new-product',
          sourcePath: '/lead-magnet'
        })
      }),
      { persistence }
    );

    expect(response?.status).toBe(201);
    expect(persistence.leads).toHaveLength(1);
    expect(getPayload(response)?.received).toBe(true);
  });

  it('returns 404 for unknown product slugs in checkout route', async () => {
    const response = await handleApiRequest(
      new Request('http://localhost:5173/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: 'missing-product' })
      }),
      {
        environment: {
          appBaseUrl: 'http://localhost:5173',
          stripeSecretKey: 'sk_test_123'
        },
        fetchFn: async () => {
          throw new Error('fetch should not be called for unknown slugs');
        }
      }
    );

    expect(response?.status).toBe(404);
  });

  it('maps Stripe checkout success response', async () => {
    const response = await handleApiRequest(
      new Request('http://localhost:5173/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: 'creator-launch-kit',
          customerEmail: 'buyer@example.com'
        })
      }),
      withCheckoutStub()
    );

    expect(response?.status).toBe(200);
    expect(getPayload(response)).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/cs_test_123',
      sessionId: 'cs_test_123'
    });
  });

  it('persists completed checkout events when webhook signature validates', async () => {
    const persistence = new MemoryPersistence();
    const webhookSecret = 'whsec_test_secret';
    const payload = JSON.stringify({
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          amount_total: 2900,
          currency: 'usd',
          metadata: { product_slug: 'creator-launch-kit' },
          customer_details: { email: 'buyer@example.com' }
        }
      }
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const response = await handleApiRequest(
      new Request('http://localhost:5173/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` },
        body: payload
      }),
      {
        persistence,
        environment: {
          appBaseUrl: 'http://localhost:5173',
          stripeWebhookSecret: webhookSecret
        }
      }
    );

    expect(response?.status).toBe(200);
    expect(persistence.orders).toHaveLength(1);
    expect(persistence.orders[0]?.checkoutSessionId).toBe('cs_test_123');
  });
});

function withCheckoutStub(): ApiHandlerDependencies {
  return {
    environment: {
      appBaseUrl: 'http://localhost:5173',
      stripeSecretKey: 'sk_test_123'
    },
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.test/cs_test_123'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
  };
}

function getPayload(response: ApiResponsePayload | null | undefined): Record<string, unknown> | null {
  if (!response || typeof response.body !== 'object' || response.body === null) {
    return null;
  }

  return response.body as Record<string, unknown>;
}
