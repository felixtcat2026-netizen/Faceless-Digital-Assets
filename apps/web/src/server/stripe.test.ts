import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyStripeWebhookSignature } from './stripe';

describe('verifyStripeWebhookSignature', () => {
  it('accepts a valid Stripe signature', () => {
    const webhookSecret = 'whsec_test_secret';
    const payload = JSON.stringify({ id: 'evt_123', type: 'checkout.session.completed' });
    const timestamp = 1_710_000_000;
    const signedPayload = `${timestamp}.${payload}`;
    const signature = createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
    const header = `t=${timestamp},v1=${signature}`;

    const valid = verifyStripeWebhookSignature({
      payload,
      signatureHeader: header,
      webhookSecret,
      nowMs: timestamp * 1000
    });

    expect(valid).toBe(true);
  });

  it('rejects signatures outside the tolerance window', () => {
    const webhookSecret = 'whsec_test_secret';
    const payload = '{"id":"evt_123"}';
    const timestamp = 1_710_000_000;
    const signature = createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    const header = `t=${timestamp},v1=${signature}`;

    const valid = verifyStripeWebhookSignature({
      payload,
      signatureHeader: header,
      webhookSecret,
      nowMs: (timestamp + 900) * 1000,
      toleranceSeconds: 300
    });

    expect(valid).toBe(false);
  });
});
