import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CatalogProduct } from '../catalog';

export interface CheckoutSessionInput {
  appBaseUrl: string;
  product: CatalogProduct;
  customerEmail?: string;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

interface StripeErrorShape {
  error?: {
    message?: string;
  };
}

interface VerifyStripeSignatureInput {
  payload: string;
  signatureHeader: string;
  webhookSecret: string;
  nowMs?: number;
  toleranceSeconds?: number;
}

export async function createStripeCheckoutSession(
  input: CheckoutSessionInput,
  stripeSecretKey: string,
  fetchFn: typeof fetch = fetch
): Promise<CheckoutSessionResult> {
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', `${input.appBaseUrl}/product/${input.product.slug}?checkout=success`);
  form.set('cancel_url', `${input.appBaseUrl}/product/${input.product.slug}?checkout=cancelled`);
  form.set('line_items[0][price_data][currency]', input.product.currency);
  form.set('line_items[0][price_data][unit_amount]', String(input.product.priceCents));
  form.set('line_items[0][price_data][product_data][name]', input.product.title);
  form.set('line_items[0][quantity]', '1');
  form.set('metadata[product_slug]', input.product.slug);

  if (input.customerEmail) {
    form.set('customer_email', input.customerEmail);
  }

  const response = await fetchFn('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });

  const payload = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & StripeErrorShape)
    | null;

  if (!response.ok) {
    const message = payload?.error?.message ?? 'Stripe request failed.';
    throw new Error(message);
  }

  const id = typeof payload?.id === 'string' ? payload.id : null;
  const url = typeof payload?.url === 'string' ? payload.url : null;

  if (!id || !url) {
    throw new Error('Stripe response did not include session id/url.');
  }

  return { id, url };
}

export function verifyStripeWebhookSignature(input: VerifyStripeSignatureInput): boolean {
  const parsed = parseStripeSignatureHeader(input.signatureHeader);
  if (!parsed) {
    return false;
  }

  const nowMs = input.nowMs ?? Date.now();
  const toleranceMs = (input.toleranceSeconds ?? 300) * 1000;
  const ageMs = Math.abs(nowMs - parsed.timestamp * 1000);
  if (ageMs > toleranceMs) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${input.payload}`;
  const expected = createHmac('sha256', input.webhookSecret).update(signedPayload).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return parsed.signatures.some((candidate) => {
    if (!isHex(candidate)) {
      return false;
    }

    const candidateBuffer = Buffer.from(candidate, 'hex');
    if (candidateBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(candidateBuffer, expectedBuffer);
  });
}

function parseStripeSignatureHeader(
  signatureHeader: string
): { timestamp: number; signatures: string[] } | null {
  const timestampPart = signatureHeader
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.startsWith('t='));

  if (!timestampPart) {
    return null;
  }

  const timestamp = Number.parseInt(timestampPart.slice(2), 10);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const signatures = signatureHeader
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))
    .filter((part) => part.length > 0);

  if (signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function isHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0;
}
