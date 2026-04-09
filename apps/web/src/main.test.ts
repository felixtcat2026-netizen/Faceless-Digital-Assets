import { describe, expect, it } from 'vitest';
import { getPageTitle, renderStorefront, resolveStorefrontRoute } from './main';

describe('resolveStorefrontRoute', () => {
  it('routes home requests', () => {
    expect(resolveStorefrontRoute('/')).toEqual({ kind: 'home' });
  });

  it('routes known static pages', () => {
    expect(resolveStorefrontRoute('/catalog')).toEqual({ kind: 'catalog' });
    expect(resolveStorefrontRoute('/lead-magnet')).toEqual({ kind: 'leadMagnet' });
  });

  it('routes product detail pages by slug', () => {
    expect(resolveStorefrontRoute('/product/notion-ops-dashboard')).toEqual({
      kind: 'product',
      slug: 'notion-ops-dashboard'
    });
  });

  it('falls back to notFound for unknown paths', () => {
    expect(resolveStorefrontRoute('/missing-path')).toEqual({
      kind: 'notFound',
      pathname: '/missing-path'
    });
  });
});

describe('renderStorefront', () => {
  it('renders the catalog skeleton', () => {
    const html = renderStorefront('/catalog');
    expect(html).toContain('Product Catalog');
    expect(html).toContain('Creator Launch Kit');
    expect(html).toContain('/product/creator-launch-kit');
  });

  it('renders the product detail skeleton', () => {
    const html = renderStorefront('/product/carousel-copy-bundle');
    expect(html).toContain('Product Detail Skeleton');
    expect(html).toContain('carousel-copy-bundle');
    expect(html).toContain('Stripe integration');
  });

  it('renders the lead magnet capture skeleton', () => {
    const html = renderStorefront('/lead-magnet');
    expect(html).toContain('Lead Magnet Capture');
    expect(html).toContain('Send Starter Pack');
  });
});

describe('getPageTitle', () => {
  it('returns a stable title for each route', () => {
    expect(getPageTitle({ kind: 'home' })).toContain('Home');
    expect(getPageTitle({ kind: 'catalog' })).toContain('Catalog');
    expect(getPageTitle({ kind: 'product', slug: 'abc' })).toContain('Product');
    expect(getPageTitle({ kind: 'leadMagnet' })).toContain('Starter Pack');
  });
});
