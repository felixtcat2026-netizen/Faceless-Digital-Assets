import { describe, expect, it } from 'vitest';
import { createLandingHeadline } from './main';

describe('createLandingHeadline', () => {
  it('returns a deterministic hero headline', () => {
    expect(createLandingHeadline('Faceless')).toBe('Faceless digital products, shipped weekly.');
  });
});
