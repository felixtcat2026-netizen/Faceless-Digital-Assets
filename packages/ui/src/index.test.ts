import { describe, expect, it } from 'vitest';
import { formatProductTitle } from './index';

describe('formatProductTitle', () => {
  it('normalizes whitespace in product titles', () => {
    expect(formatProductTitle('  New   Pack  ')).toBe('New Pack');
  });
});
