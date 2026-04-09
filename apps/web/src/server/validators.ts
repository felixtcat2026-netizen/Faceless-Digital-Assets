const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LEAD_GOALS = [
  'new-product',
  'improve-conversion',
  'systemize-content'
] as const;

export type LeadGoal = (typeof LEAD_GOALS)[number];

export interface CheckoutRequestInput {
  productSlug: string;
  customerEmail?: string;
}

export interface LeadCaptureInput {
  email: string;
  goal: LeadGoal;
  sourcePath?: string;
}

interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

interface ValidationFailure {
  ok: false;
  error: string;
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function parseCheckoutRequest(payload: unknown): ValidationResult<CheckoutRequestInput> {
  if (!isRecord(payload)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const productSlug = normalizeString(payload.productSlug);
  if (!productSlug) {
    return { ok: false, error: 'productSlug is required.' };
  }

  const customerEmail = normalizeString(payload.customerEmail);
  if (customerEmail && !EMAIL_REGEX.test(customerEmail)) {
    return { ok: false, error: 'customerEmail must be a valid email when provided.' };
  }

  return { ok: true, value: { productSlug, customerEmail: customerEmail || undefined } };
}

export function parseLeadCaptureRequest(payload: unknown): ValidationResult<LeadCaptureInput> {
  if (!isRecord(payload)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const email = normalizeString(payload.email);
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'email must be a valid email address.' };
  }

  const goal = normalizeString(payload.goal);
  if (!goal || !LEAD_GOALS.includes(goal as LeadGoal)) {
    return {
      ok: false,
      error: `goal must be one of: ${LEAD_GOALS.join(', ')}.`
    };
  }

  const sourcePath = normalizeString(payload.sourcePath) || undefined;
  return { ok: true, value: { email, goal: goal as LeadGoal, sourcePath } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
