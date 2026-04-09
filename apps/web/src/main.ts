import { findProductBySlug, PRODUCT_CATALOG } from './catalog';

export type StorefrontRoute =
  | { kind: 'home' }
  | { kind: 'catalog' }
  | { kind: 'product'; slug: string }
  | { kind: 'leadMagnet' }
  | { kind: 'notFound'; pathname: string };

const BRAND_NAME = 'Faceless Digital Assets';

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
          <p>Current MVP assortment. Product detail pages can now launch Stripe checkout.</p>
          <ul class="product-list">
            ${PRODUCT_CATALOG.map(renderProductCard).join('')}
          </ul>
        </section>
      `;
    case 'product': {
      const product = findProductBySlug(route.slug);
      if (!product) {
        return `
          <section>
            <h1>Product Not Found</h1>
            <p>No catalog product exists for <code>${escapeHtml(route.slug)}</code>.</p>
            <a class="button" href="/catalog">Back to Catalog</a>
          </section>
        `;
      }

      return `
        <section>
          <h1>${escapeHtml(product.title)}</h1>
          <p><strong>Price:</strong> ${escapeHtml(product.price)} one-time purchase</p>
          <div class="skeleton-block">
            <p><strong>Offer summary:</strong> Production copy and assets are still in progress.</p>
            <p><strong>Value bullets:</strong> Final merchandising pass pending.</p>
            <p><strong>Checkout:</strong> Creates a Stripe Checkout Session from this page.</p>
          </div>
          <form class="checkout-form" data-checkout-form data-product-slug="${escapeHtml(product.slug)}">
            <label>
              Purchase Email (optional)
              <input type="email" name="email" placeholder="you@example.com" />
            </label>
            <button class="button button-primary" type="submit">Start Secure Checkout</button>
          </form>
          <p class="status-message" data-checkout-status aria-live="polite"></p>
          <a class="button" href="/catalog">Back to Catalog</a>
        </section>
      `;
    }
    case 'leadMagnet':
      return `
        <section>
          <h1>Lead Magnet Capture</h1>
          <p>Collect emails and store local placeholder lead records for follow-up.</p>
          <form class="capture-form" data-lead-form>
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
          <p class="status-message" data-lead-status aria-live="polite"></p>
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
  bindPageInteractions(root, route);
}

if (typeof document !== 'undefined') {
  mountStorefront(document, globalThis.location?.pathname ?? '/');
}

function bindPageInteractions(root: HTMLElement, route: StorefrontRoute): void {
  if (route.kind === 'product') {
    bindCheckoutForm(root);
  }

  if (route.kind === 'leadMagnet') {
    bindLeadCaptureForm(root);
  }
}

function bindCheckoutForm(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-checkout-form]');
  const status = root.querySelector<HTMLElement>('[data-checkout-status]');
  if (!form || !status) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const productSlug = form.dataset.productSlug;
    if (!productSlug) {
      setStatus(status, 'Checkout is unavailable for this product.', true);
      return;
    }

    const emailField = form.elements.namedItem('email');
    const customerEmail =
      emailField instanceof HTMLInputElement ? emailField.value.trim() : '';

    setFormBusy(form, true);
    setStatus(status, 'Creating Stripe Checkout Session...', false);

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug,
          customerEmail: customerEmail || undefined
        })
      });

      const payload = await parseJsonResponse(response);
      if (!response.ok) {
        const apiError = typeof payload?.error === 'string' ? payload.error : 'Request failed.';
        throw new Error(apiError);
      }

      const checkoutUrl = typeof payload?.checkoutUrl === 'string' ? payload.checkoutUrl : '';
      if (!checkoutUrl) {
        throw new Error('Stripe did not return a checkout URL.');
      }

      setStatus(status, 'Redirecting to Stripe checkout...', false);
      globalThis.location.assign(checkoutUrl);
    } catch (error) {
      setStatus(status, `Checkout request failed: ${toErrorMessage(error)}`, true);
      setFormBusy(form, false);
    }
  });
}

function bindLeadCaptureForm(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-lead-form]');
  const status = root.querySelector<HTMLElement>('[data-lead-status]');
  if (!form || !status) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const emailField = form.elements.namedItem('email');
    const goalField = form.elements.namedItem('goal');
    const email = emailField instanceof HTMLInputElement ? emailField.value.trim() : '';
    const goal = goalField instanceof HTMLSelectElement ? goalField.value.trim() : '';

    setFormBusy(form, true);
    setStatus(status, 'Saving your starter pack request...', false);

    try {
      const response = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          goal,
          sourcePath: globalThis.location?.pathname ?? '/lead-magnet'
        })
      });

      const payload = await parseJsonResponse(response);
      if (!response.ok) {
        const apiError = typeof payload?.error === 'string' ? payload.error : 'Request failed.';
        throw new Error(apiError);
      }

      form.reset();
      setStatus(status, 'Starter pack request received. Check your inbox shortly.', false, true);
    } catch (error) {
      setStatus(status, `Lead capture failed: ${toErrorMessage(error)}`, true);
    } finally {
      setFormBusy(form, false);
    }
  });
}

function setFormBusy(form: HTMLFormElement, busy: boolean): void {
  const controls = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
    'input, select, button'
  );
  controls.forEach((control) => {
    control.disabled = busy;
  });
}

function setStatus(
  element: HTMLElement,
  message: string,
  isError: boolean,
  isSuccess = false
): void {
  element.textContent = message;
  element.classList.toggle('is-error', isError);
  element.classList.toggle('is-success', isSuccess);
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const payload = (await response.json()) as unknown;
    return isRecord(payload) ? payload : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error.';
}
