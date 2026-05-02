import { describe, expect, it } from 'vitest';
import { getPageTitle, renderStorefront, resolveStorefrontRoute } from './main';

describe('resolveStorefrontRoute', () => {
  it('routes home requests', () => {
    expect(resolveStorefrontRoute('/')).toEqual({ kind: 'home' });
  });

  it('routes known static pages', () => {
    expect(resolveStorefrontRoute('/catalog')).toEqual({ kind: 'catalog' });
    expect(resolveStorefrontRoute('/lead-magnet')).toEqual({ kind: 'leadMagnet' });
    expect(resolveStorefrontRoute('/paperclip-dashboard')).toEqual({ kind: 'paperclipDashboard' });
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
  it('renders the home page with conversion-focused hero copy and CTAs', () => {
    const html = renderStorefront('/');
    expect(html).toContain('Launch a digital product people actually want without losing weeks to planning, writing, and setup.');
    expect(html).toContain('Browse Assets Built to Convert');
    expect(html).toContain('Get the Free Starter Pack');
    expect(html).toContain('4.9/5 creator-rated templates');
  });

  it('renders the catalog skeleton with upgraded product teaser copy', () => {
    const html = renderStorefront('/catalog');
    expect(html).toContain('Product Catalog');
    expect(html).toContain('Choose the fastest fix for your current bottleneck, strengthen the message, and move straight into checkout.');
    expect(html).toContain('Creator Launch Kit');
    expect(html).toContain('Stop overthinking your first offer and launch a faceless product this week');
    expect(html).toContain('/product/creator-launch-kit');
  });

  it('renders the premium product detail redesign with channel previews', () => {
    const html = renderStorefront('/product/carousel-copy-bundle');
    expect(html).toContain('Carousel Copy Bundle');
    expect(html).toContain('Stop burning hours on drafts that go nowhere and publish conversion-minded carousel copy the same day.');
    expect(html).toContain('Download the Conversion Copy Bundle');
    expect(html).toContain('In-channel product preview examples');
    expect(html).toContain('/assets/mockups/instagram-carousel.svg');
    expect(html).toContain('/assets/mockups/twitter-thread.svg');
    expect(html).toContain('/assets/mockups/youtube-thumbnail.svg');
    expect(html).toContain('/assets/mockups/meta-ad-creative.svg');
    expect(html).toContain('Specialist contributions integrated');
    expect(html).toContain('carousel-copy-bundle');
  });

  it('renders the lead magnet opt-in copy', () => {
    const html = renderStorefront('/lead-magnet');
    expect(html).toContain('Get the Faceless Product Starter Pack');
    expect(html).toContain('Send Me the Free Starter Pack');
    expect(html).toContain("What's your biggest blocker right now?");
    expect(html).toContain('data-lead-form');
  });

  it('renders the paperclip relay dashboard', () => {
    const html = renderStorefront('/paperclip-dashboard');
    expect(html).toContain('Paperclip Relay Dashboard');
    expect(html).toContain('data-dashboard-refresh');
    expect(html).toContain('data-dashboard-queue-depth');
  });

  it('surfaces a direct dashboard link on the home page', () => {
    const html = renderStorefront('/');
    expect(html).toContain('/paperclip-dashboard');
    expect(html).toContain('See the Launch Dashboard');
  });
});

describe('getPageTitle', () => {
  it('returns a stable title for each route', () => {
    expect(getPageTitle({ kind: 'home' })).toContain('Home');
    expect(getPageTitle({ kind: 'catalog' })).toContain('Catalog');
    expect(getPageTitle({ kind: 'product', slug: 'abc' })).toContain('Product');
    expect(getPageTitle({ kind: 'leadMagnet' })).toContain('Starter Pack');
    expect(getPageTitle({ kind: 'paperclipDashboard' })).toContain('Paperclip Dashboard');
  });
});
