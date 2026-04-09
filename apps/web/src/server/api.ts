import { findProductBySlug } from '../catalog';
import {
  createPlaceholderPersistence,
  type OrderInput,
  type PlaceholderPersistence
} from './persistence';
import { createStripeCheckoutSession, verifyStripeWebhookSignature } from './stripe';
import { parseCheckoutRequest, parseLeadCaptureRequest } from './validators';

interface HandlerEnvironment {
  appBaseUrl: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

export interface ApiHandlerDependencies {
  environment?: Partial<HandlerEnvironment>;
  persistence?: PlaceholderPersistence;
  fetchFn?: typeof fetch;
}

export interface ApiResponsePayload {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export async function handleApiRequest(
  request: Request,
  dependencies: ApiHandlerDependencies = {}
): Promise<ApiResponsePayload | null> {
  const url = new URL(request.url);
  const environment = resolveEnvironment(dependencies.environment);
  const persistence = dependencies.persistence ?? createPlaceholderPersistence();
  const fetchFn = dependencies.fetchFn ?? fetch;

  if (url.pathname === '/api/stripe/checkout-session') {
    if (request.method !== 'POST') {
      return methodNotAllowed(['POST']);
    }

    if (!environment.stripeSecretKey) {
      return json(500, { error: 'Server misconfiguration: STRIPE_SECRET_KEY is required.' });
    }

    const body = await parseJsonBody(request);
    const parsed = parseCheckoutRequest(body);
    if (!parsed.ok) {
      return json(400, { error: parsed.error });
    }

    const product = findProductBySlug(parsed.value.productSlug);
    if (!product) {
      return json(404, { error: 'No catalog product exists for the requested slug.' });
    }

    try {
      const session = await createStripeCheckoutSession(
        {
          appBaseUrl: environment.appBaseUrl,
          product,
          customerEmail: parsed.value.customerEmail
        },
        environment.stripeSecretKey,
        fetchFn
      );

      return json(200, {
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } catch (error) {
      return json(502, {
        error: `Stripe checkout session creation failed: ${getErrorMessage(error)}`
      });
    }
  }

  if (url.pathname === '/api/stripe/webhook') {
    if (request.method !== 'POST') {
      return methodNotAllowed(['POST']);
    }

    if (!environment.stripeWebhookSecret) {
      return json(500, { error: 'Server misconfiguration: STRIPE_WEBHOOK_SECRET is required.' });
    }

    const signatureHeader = request.headers.get('stripe-signature');
    if (!signatureHeader) {
      return json(400, { error: 'Missing Stripe signature header.' });
    }

    const payload = await request.text();
    const validSignature = verifyStripeWebhookSignature({
      payload,
      signatureHeader,
      webhookSecret: environment.stripeWebhookSecret
    });

    if (!validSignature) {
      return json(400, { error: 'Invalid Stripe signature.' });
    }

    let event: unknown;
    try {
      event = JSON.parse(payload);
    } catch {
      return json(400, { error: 'Webhook payload must be valid JSON.' });
    }

    const orderInput = extractOrderFromCheckoutEvent(event);
    if (orderInput) {
      await persistence.saveOrder(orderInput);
    }

    return json(200, { received: true });
  }

  if (url.pathname === '/api/lead-magnet') {
    if (request.method !== 'POST') {
      return methodNotAllowed(['POST']);
    }

    const body = await parseJsonBody(request);
    const parsed = parseLeadCaptureRequest(body);
    if (!parsed.ok) {
      return json(400, { error: parsed.error });
    }

    const lead = await persistence.saveLead(parsed.value);
    return json(201, {
      received: true,
      leadId: lead.id
    });
  }

  return null;
}

function resolveEnvironment(overrides?: Partial<HandlerEnvironment>): HandlerEnvironment {
  const appBaseUrl = normalizeAppBaseUrl(overrides?.appBaseUrl ?? process.env.APP_BASE_URL);
  return {
    appBaseUrl,
    stripeSecretKey: (overrides?.stripeSecretKey ?? process.env.STRIPE_SECRET_KEY ?? '').trim(),
    stripeWebhookSecret: (
      overrides?.stripeWebhookSecret ??
      process.env.STRIPE_WEBHOOK_SECRET ??
      ''
    ).trim()
  };
}

function normalizeAppBaseUrl(value: string | undefined): string {
  const candidate = value?.trim() || 'http://localhost:5173';
  return candidate.replace(/\/+$/, '');
}

async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function methodNotAllowed(allowedMethods: string[]): ApiResponsePayload {
  return {
    status: 405,
    headers: { ...JSON_HEADERS, Allow: allowedMethods.join(', ') },
    body: { error: `Method not allowed. Use: ${allowedMethods.join(', ')}.` }
  };
}

function json(status: number, body: unknown): ApiResponsePayload {
  return {
    status,
    headers: JSON_HEADERS,
    body
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error.';
}

function extractOrderFromCheckoutEvent(event: unknown): OrderInput | null {
  if (!isRecord(event) || event.type !== 'checkout.session.completed') {
    return null;
  }

  const eventId = getString(event.id) ?? 'unknown_event';
  const data = isRecord(event.data) ? event.data : null;
  const object = data && isRecord(data.object) ? data.object : null;
  if (!object) {
    return null;
  }

  const checkoutSessionId = getString(object.id);
  if (!checkoutSessionId) {
    return null;
  }

  const metadata = isRecord(object.metadata) ? object.metadata : {};
  const productSlug = getString(metadata.product_slug) ?? 'unknown_product';
  const customerDetails = isRecord(object.customer_details) ? object.customer_details : {};

  return {
    eventId,
    checkoutSessionId,
    productSlug,
    customerEmail: getString(customerDetails.email) ?? 'unknown_email',
    totalAmountCents: getNumber(object.amount_total),
    currency: getString(object.currency)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
