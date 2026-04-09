import { describe, expect, it } from 'vitest';
import { parseCheckoutRequest, parseLeadCaptureRequest } from './validators';

describe('parseCheckoutRequest', () => {
  it('accepts a valid checkout request', () => {
    const result = parseCheckoutRequest({
      productSlug: 'creator-launch-kit',
      customerEmail: 'buyer@example.com'
    });

    expect(result).toEqual({
      ok: true,
      value: {
        productSlug: 'creator-launch-kit',
        customerEmail: 'buyer@example.com'
      }
    });
  });

  it('rejects an invalid optional customerEmail', () => {
    const result = parseCheckoutRequest({
      productSlug: 'creator-launch-kit',
      customerEmail: 'bad-email'
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('customerEmail');
    }
  });
});

describe('parseLeadCaptureRequest', () => {
  it('accepts a valid lead capture request', () => {
    const result = parseLeadCaptureRequest({
      email: 'lead@example.com',
      goal: 'new-product',
      sourcePath: '/lead-magnet'
    });

    expect(result).toEqual({
      ok: true,
      value: {
        email: 'lead@example.com',
        goal: 'new-product',
        sourcePath: '/lead-magnet'
      }
    });
  });

  it('rejects unsupported goals', () => {
    const result = parseLeadCaptureRequest({
      email: 'lead@example.com',
      goal: 'unknown'
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('goal');
    }
  });
});
