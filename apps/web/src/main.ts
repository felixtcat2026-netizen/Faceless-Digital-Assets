export type StorefrontRoute =
  | { kind: 'home' }
  | { kind: 'catalog' }
  | { kind: 'product'; slug: string }
  | { kind: 'leadMagnet' }
  | { kind: 'notFound'; pathname: string };

const BRAND_NAME = 'Faceless Digital Assets';

const PRODUCT_PREVIEWS = [
  { slug: 'creator-launch-kit', title: 'Creator Launch Kit', price: '$29' },
  { slug: 'carousel-copy-bundle', title: 'Carousel Copy Bundle', price: '$19' },
  { slug: 'notion-ops-dashboard', title: 'Notion Ops Dashboard', price: '$39' }
];

export function resolveStorefrontRoute(pathname: string): StorefrontRoute {
  const normalized = normalizePathname(pathname);

  if (normalized === '/') {
    return { kind: 'home' };
  }

  if (normalized === '/catalog') {
    return { kind: 'catalog' };
  }

  if (normalized === '/lead-magnet') {
    return { kind: 'leadMagnet' };
  }

  const productMatch = normalized.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    const slug = productMatch[1];
    if (slug) {
      return { kind: 'product', slug };
    }
  }

  return { kind: 'notFound', pathname: normalized };
}

export function getPageTitle(route: StorefrontRoute): string {
  switch (route.kind) {
    case 'home':
      return `${BRAND_NAME} | Home`;
    case 'catalog':
      return `${BRAND_NAME} | Catalog`;
    case 'product':
      return `${BRAND_NAME} | Product`;
    case 'leadMagnet':
      return `${BRAND_NAME} | Starter Pack`;
    case 'notFound':
      return `${BRAND_NAME} | Not Found`;
    default:
      return BRAND_NAME;
  }
}

export function renderStorefront(pathname: string): string {
  return renderRoute(resolveStorefrontRoute(pathname));
}

function renderRoute(route: StorefrontRoute): string {
  const pageBody = renderPageBody(route);

  return `
    <div class="page-shell">
      <header class="site-header">
        <p class="brand">${BRAND_NAME}</p>
        <nav>
          <ul class="nav-list">
            <li><a href="/">Home</a></li>
            <li><a href="/catalog">Catalog</a></li>
            <li><a href="/lead-magnet">Starter Pack</a></li>
          </ul>
        </nav>
      </header>
      <main class="page-content">
        ${pageBody}
      </main>
      <footer class="site-footer">
        <small>Built for lightweight digital-product experimentation.</small>
      </footer>
    </div>
  `.trim();
}

function renderPageBody(route: StorefrontRoute): string {
  switch (route.kind) {
    case 'home':
      return `
        <section class="hero">
          <h1>Ship faceless digital products with a repeatable weekly cadence.</h1>
          <p>Launch proven assets, test demand quickly, and grow from signal.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="/catalog">Browse Catalog</a>
            <a class="button" href="/lead-magnet">Get Free Starter Pack</a>
          </div>
        </section>
      `;
    case 'catalog':
      return `
        <section>
          <h1>Product Catalog</h1>
          <p>Current MVP assortment. Payments and fulfillment wiring are next milestones.</p>
          <ul class="product-list">
            ${PRODUCT_PREVIEWS.map(renderProductCard).join('')}
          </ul>
        </section>
      `;
    case 'product':
      return `
        <section>
          <h1>Product Detail Skeleton</h1>
          <p>Slug: <code>${escapeHtml(route.slug)}</code></p>
          <div class="skeleton-block">
            <p><strong>Offer summary:</strong> Final copy pending.</p>
            <p><strong>Value bullets:</strong> Placeholder content for merchandising.</p>
            <p><strong>Checkout:</strong> Stripe integration to be connected.</p>
          </div>
          <a class="button" href="/catalog">Back to Catalog</a>
        </section>
      `;
    case 'leadMagnet':
      return `
        <section>
          <h1>Lead Magnet Capture</h1>
          <p>Collect emails before checkout stack is fully active.</p>
          <form class="capture-form">
            <label>
              Email
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>
            <label>
              Goal
              <select name="goal">
                <option value="new-product">Launch first product</option>
                <option value="improve-conversion">Improve conversion</option>
                <option value="systemize-content">Systemize content output</option>
              </select>
            </label>
            <button class="button button-primary" type="submit">Send Starter Pack</button>
          </form>
        </section>
      `;
    case 'notFound':
      return `
        <section>
          <h1>Page Not Found</h1>
          <p>No storefront route exists for <code>${escapeHtml(route.pathname)}</code>.</p>
          <a class="button" href="/">Return Home</a>
        </section>
      `;
    default:
      return '<section><p>Unknown route.</p></section>';
  }
}

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (trimmed.length === 0) {
    return '/';
  }

  const [beforeQuery = ''] = trimmed.split('?');
  const [pathOnly = ''] = beforeQuery.split('#');
  if (pathOnly.length === 0) {
    return '/';
  }

  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

function renderProductCard(product: { slug: string; title: string; price: string }): string {
  return `
    <li class="product-card">
      <h2>${escapeHtml(product.title)}</h2>
      <p>${escapeHtml(product.price)} one-time purchase</p>
      <a class="button" href="/product/${escapeHtml(product.slug)}">Open Detail</a>
    </li>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function mountStorefront(doc: Document, pathname: string): void {
  const root = doc.getElementById('app');
  if (!root) {
    return;
  }

  const route = resolveStorefrontRoute(pathname);
  root.innerHTML = renderRoute(route);
  doc.title = getPageTitle(route);
}

if (typeof document !== 'undefined') {
  mountStorefront(document, globalThis.location?.pathname ?? '/');
}
