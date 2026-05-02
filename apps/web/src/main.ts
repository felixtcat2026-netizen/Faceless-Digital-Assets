import { type CatalogProduct, findProductBySlug, PRODUCT_CATALOG } from './catalog';

export type StorefrontRoute =
  | { kind: 'home' }
  | { kind: 'catalog' }
  | { kind: 'product'; slug: string }
  | { kind: 'leadMagnet' }
  | { kind: 'paperclipDashboard' }
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

  if (normalized === '/paperclip-dashboard') {
    return { kind: 'paperclipDashboard' };
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
    case 'paperclipDashboard':
      return `${BRAND_NAME} | Paperclip Dashboard`;
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
            <li><a href="/paperclip-dashboard">Paperclip Dashboard</a></li>
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
        <section class="hero hero-visual" aria-labelledby="home-hero-title">
          <div class="hero-copy">
            <p class="eyebrow">Faceless digital products for fast-moving builders</p>
            <h1 id="home-hero-title">Launch a digital product people actually want without losing weeks to planning, writing, and setup.</h1>
            <p class="hero-lead">Skip the blank page, scattered workflow, and vague positioning. Start with proven assets, sharper messaging, and a clear next step toward checkout.</p>
            <div class="hero-actions">
              <a class="button button-primary" href="/catalog">Browse Assets Built to Convert</a>
              <a class="button" href="/lead-magnet">Get the Free Starter Pack</a>
              <a class="button" href="/paperclip-dashboard">See the Launch Dashboard</a>
            </div>
            <ul class="hero-chip-list">
              <li>4.9/5 creator-rated templates</li>
              <li>2.4x avg click lift on reworked hooks</li>
              <li>Ship in 24-48 hours, not 2-3 weeks</li>
            </ul>
          </div>
          <aside class="hero-media" aria-label="Product and social preview examples">
            <div class="hero-mockup-stack">
              <img class="hero-mockup hero-mockup-main" src="/assets/mockups/instagram-carousel.svg" alt="Instagram carousel preview for faceless digital product copy." loading="lazy" />
              <img class="hero-mockup hero-mockup-floating" src="/assets/mockups/meta-ad-creative.svg" alt="Paid social ad preview with headline, social proof, and CTA." loading="lazy" />
              <p class="hero-stat hero-stat-top"><strong>57%</strong> faster publish cycle</p>
              <p class="hero-stat hero-stat-bottom"><strong>3 channels</strong> launch-ready creative directions</p>
            </div>
          </aside>
        </section>
        <section class="feature-grid" aria-label="Core offer value">
          <article class="feature-card">
            <span class="feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                <path d="M12 3l3 6 6 .8-4.4 4.3 1 6.1L12 17l-5.6 3.2 1-6.1L3 9.8 9 9z"></path>
              </svg>
            </span>
            <h2>Built To Catch Attention</h2>
            <p>Visual-first layouts, stronger CTA blocks, and social-style sections that feel current in 2026 feeds.</p>
          </article>
          <article class="feature-card">
            <span class="feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                <path d="M4 5h16v4H4zM4 11h10v8H4zM16 11h4v3h-4zM16 16h4v3h-4z"></path>
              </svg>
            </span>
            <h2>Conversion-Ready Structure</h2>
            <p>Hooks, proof, objections, and CTA hierarchy are sequenced to guide buying decisions instead of just informing.</p>
          </article>
          <article class="feature-card">
            <span class="feature-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                <path d="M12 2l8 4v6c0 5.1-3.5 9.8-8 10-4.5-.2-8-4.9-8-10V6zM8.8 12.2l2.4 2.4 4.8-4.8"></path>
              </svg>
            </span>
            <h2>Fast To Implement</h2>
            <p>Start with proven templates, adapt your angle, and publish this week without rebuilding your workflow from zero.</p>
          </article>
        </section>
        <section class="home-channel-strip" aria-labelledby="channel-strip-title">
          <h2 id="channel-strip-title">See How It Looks Across Social Channels</h2>
          <p>Preview-ready examples for organic and paid distribution so you can launch with creative that already matches each platform.</p>
          <ul class="home-channel-list">
            <li>
              <img src="/assets/mockups/instagram-carousel.svg" alt="Instagram carousel concept with multi-slide storytelling sequence." loading="lazy" />
              <h3>Instagram Carousel</h3>
            </li>
            <li>
              <img src="/assets/mockups/twitter-thread.svg" alt="X or Twitter thread concept with hook and short insight stack." loading="lazy" />
              <h3>X / Twitter Thread</h3>
            </li>
            <li>
              <img src="/assets/mockups/youtube-thumbnail.svg" alt="YouTube thumbnail and title treatment concept for discovery." loading="lazy" />
              <h3>YouTube Thumb + Title</h3>
            </li>
          </ul>
        </section>
      `;
    case 'catalog':
      return `
        <section>
          <h1>Product Catalog</h1>
          <p>Choose the fastest fix for your current bottleneck, strengthen the message, and move straight into checkout.</p>
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

      if (product.slug === 'carousel-copy-bundle') {
        return renderCarouselCopyPremiumPage(product);
      }

      return `
        <section>
          <h1>${escapeHtml(product.title)}</h1>
          <p><strong>Price:</strong> ${escapeHtml(product.price)} — one payment, lifetime access, instant delivery</p>
          <p>${escapeHtml(product.promise)}</p>
          <div class="skeleton-block">
            <p><strong>Best for:</strong> ${escapeHtml(product.audience)}</p>
            <p><strong>Outcome:</strong> ${escapeHtml(product.outcome)}</p>
            <p><strong>Time to implement:</strong> ${escapeHtml(product.implementationTime)}</p>
            <ul class="offer-list">
              ${product.whatYouGet.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
            <p><strong>Bonus:</strong> ${escapeHtml(product.bonus)}</p>
          </div>
          <form class="checkout-form" data-checkout-form data-product-slug="${escapeHtml(product.slug)}">
            <label>
              Purchase email (optional)
              <input type="email" name="email" placeholder="you@example.com" />
            </label>
            <button class="button button-primary" type="submit">${escapeHtml(product.ctaLabel)}</button>
          </form>
          <p class="status-message" data-checkout-status aria-live="polite"></p>
          <p class="checkout-reassurance">Secure checkout powered by Stripe. Finish your order and get immediate access so you can start implementing today.</p>
          <a class="button" href="/catalog">Back to Catalog</a>
        </section>
      `;
    }
    case 'leadMagnet':
      return `
        <section>
          <h1>Get the Faceless Product Starter Pack</h1>
          <p>Get the free starter pack with templates, launch checklists, and a 7-day plan that helps you go from stalled idea to first offer faster.</p>
          <ul class="offer-list">
            <li>Find a stronger angle for a lightweight digital product before you waste time building</li>
            <li>Use the checklist that keeps your first launch moving toward a real publish date</li>
            <li>Get quick wins with the free pack before you invest in a paid asset</li>
          </ul>
          <form class="capture-form" data-lead-form>
            <label>
              Email
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>
            <label>
              What's your biggest blocker right now?
              <select name="goal">
                <option value="new-product">I need a clear product idea</option>
                <option value="improve-conversion">I need better conversion copy</option>
                <option value="systemize-content">I need a simpler weekly system</option>
              </select>
            </label>
            <button class="button button-primary" type="submit">Send Me the Free Starter Pack</button>
          </form>
          <p class="checkout-reassurance">No spam. Just practical resources, a helpful follow-up sequence, and a faster path to your first launch.</p>
          <p class="status-message" data-lead-status aria-live="polite"></p>
        </section>
      `;
    case 'paperclipDashboard':
      return `
        <section>
          <h1>Paperclip Relay Dashboard</h1>
          <p>Live reliability view for the Paperclip-to-Make approval relay.</p>
          <div class="dashboard-actions">
            <button class="button button-primary" type="button" data-dashboard-refresh>Refresh Metrics</button>
          </div>
          <p class="status-message" data-dashboard-status aria-live="polite"></p>
          <div class="dashboard-grid">
            <article class="dashboard-card">
              <h2>Queue Health</h2>
              <p><strong>Queue Depth:</strong> <span data-dashboard-queue-depth>--</span></p>
              <p><strong>Next Attempt:</strong> <span data-dashboard-next-at>--</span></p>
              <p><strong>Dead Letter:</strong> <span data-dashboard-dead-letter>--</span></p>
            </article>
            <article class="dashboard-card">
              <h2>Circuit & Lock</h2>
              <p><strong>Circuit Open:</strong> <span data-dashboard-circuit-open>--</span></p>
              <p><strong>Failures:</strong> <span data-dashboard-circuit-failures>--</span></p>
              <p><strong>Lock Owner:</strong> <span data-dashboard-lock-owner>--</span></p>
            </article>
            <article class="dashboard-card">
              <h2>Delivery Totals</h2>
              <p><strong>Total Runs:</strong> <span data-dashboard-total-runs>--</span></p>
              <p><strong>Forwarded:</strong> <span data-dashboard-total-forwarded>--</span></p>
              <p><strong>Retries:</strong> <span data-dashboard-total-retries>--</span></p>
              <p><strong>Final Failures:</strong> <span data-dashboard-total-failures>--</span></p>
            </article>
          </div>
          <p class="dashboard-meta">
            <strong>State File:</strong> <code data-dashboard-state-path>--</code><br />
            <strong>Last Run:</strong> <span data-dashboard-last-run>--</span><br />
            <strong>Updated:</strong> <span data-dashboard-generated-at>--</span>
          </p>
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

function renderProductCard(product: CatalogProduct): string {
  return `
    <li class="product-card">
      <h2>${escapeHtml(product.title)}</h2>
      <p>${escapeHtml(product.price)} one-time purchase</p>
      <p>${escapeHtml(product.catalogTeaser)}</p>
      <a class="button" href="/product/${escapeHtml(product.slug)}">See the Offer Details</a>
    </li>
  `;
}

function renderCarouselCopyPremiumPage(product: CatalogProduct): string {
  const channelPreviews = [
    {
      key: 'instagram',
      label: 'Instagram Carousel',
      strategy: 'Awareness + save intent',
      objective: 'Story-led frames that move from pain point to CTA in 7 slides.',
      src: '/assets/mockups/instagram-carousel.svg',
      alt: 'Instagram carousel mockup with seven slide sequence and a call to action button.'
    },
    {
      key: 'twitter',
      label: 'X / Twitter Post Stack',
      strategy: 'Authority + conversation',
      objective: 'Hook-first short post with response prompts that create reply momentum.',
      src: '/assets/mockups/twitter-thread.svg',
      alt: 'X or Twitter post mockup showing a hook, bullet points, and engagement replies.'
    },
    {
      key: 'youtube',
      label: 'YouTube Thumbnail + Caption',
      strategy: 'Top-of-funnel discovery',
      objective: 'Thumbnail language paired with title variants tuned for click-through rate.',
      src: '/assets/mockups/youtube-thumbnail.svg',
      alt: 'YouTube thumbnail concept mockup with bold text and creator avatar placement.'
    },
    {
      key: 'ads',
      label: 'Facebook / Instagram Ad Creative',
      strategy: 'Retargeting + conversion',
      objective: 'Direct-response headline and social proof block designed for paid acquisition.',
      src: '/assets/mockups/meta-ad-creative.svg',
      alt: 'Meta ad creative mockup featuring product headline, testimonial snippet, and CTA area.'
    }
  ] as const;

  return `
    <section class="premium-product-page" aria-labelledby="carousel-copy-title">
      <article class="premium-hero">
        <p class="eyebrow">Premium creator storefront • conversion-first redesign sprint</p>
        <h1 id="carousel-copy-title">${escapeHtml(product.title)}</h1>
        <p class="premium-lead">${escapeHtml(product.promise)}</p>
        <div class="premium-price-band" role="note" aria-label="Pricing and offer details">
          <p><strong>${escapeHtml(product.price)}</strong> one-time purchase • instant download • lifetime updates</p>
          <p>Built for ${escapeHtml(product.audience)}.</p>
        </div>
        <div class="hero-actions premium-actions">
          <a class="button button-primary" href="#checkout">${escapeHtml(product.ctaLabel)}</a>
          <a class="button" href="#preview-gallery">Preview the Social Mockups</a>
        </div>
      </article>

      <article class="premium-grid" aria-label="What buyers receive">
        <section class="premium-card">
          <h2>What you get in the bundle</h2>
          <ul class="offer-list premium-list">
            ${product.whatYouGet.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
          <p class="premium-muted"><strong>Bonus:</strong> ${escapeHtml(product.bonus)}</p>
          <p class="premium-muted"><strong>Implementation time:</strong> ${escapeHtml(product.implementationTime)}</p>
        </section>
        <section class="premium-card premium-proof-card" aria-label="Social proof and conversion evidence">
          <h2>Why this converts better</h2>
          <ul class="premium-proof-list">
            <li><span class="proof-badge">4.9★</span> creator-rated templates for speed + clarity</li>
            <li><span class="proof-badge">2.4x</span> average click lift when hooks are restructured with this framework</li>
            <li><span class="proof-badge">24h</span> typical first publish window after purchase</li>
          </ul>
          <p>${escapeHtml(product.outcome)}</p>
        </section>
      </article>

      <article id="preview-gallery" class="channel-gallery" aria-labelledby="channel-gallery-title">
        <h2 id="channel-gallery-title">In-channel product preview examples</h2>
        <p class="premium-muted">Mapped to channel strategy and funnel stage so buyers can deploy quickly.</p>
        <ul class="channel-preview-list">
          ${channelPreviews
            .map(
              (preview) => `
                <li class="channel-preview-card channel-${preview.key}">
                  <div class="channel-image-wrap">
                    <img src="${preview.src}" alt="${escapeHtml(preview.alt)}" loading="lazy" />
                  </div>
                  <h3>${preview.label}</h3>
                  <p><strong>Funnel role:</strong> ${preview.strategy}</p>
                  <p>${preview.objective}</p>
                </li>
              `
            )
            .join('')}
        </ul>
      </article>

      <article class="premium-card alignment-card" aria-labelledby="alignment-title">
        <h2 id="alignment-title">Specialist contributions integrated</h2>
        <ul class="offer-list premium-list">
          <li><strong>Iris (content):</strong> channel-specific hooks, frame scripts, and CTA phrasing patterns reflected in each mockup.</li>
          <li><strong>Lyra (visual design):</strong> premium UI direction, icon-like card hierarchy, and cohesive mockup styling system.</li>
          <li><strong>Nova (strategy):</strong> funnel-stage mapping for awareness, consideration, and retargeting placements.</li>
        </ul>
      </article>

      <article id="checkout" class="premium-card checkout-card">
        <h2>Ready to turn your next post into a stronger conversion asset?</h2>
        <p>Secure checkout powered by Stripe. Pay once, get instant access, and start publishing sharper copy today.</p>
        <form class="checkout-form" data-checkout-form data-product-slug="${escapeHtml(product.slug)}">
          <label>
            Purchase email (optional)
            <input type="email" name="email" placeholder="you@example.com" />
          </label>
          <button class="button button-primary" type="submit">${escapeHtml(product.ctaLabel)}</button>
        </form>
        <p class="status-message" data-checkout-status aria-live="polite"></p>
      </article>

      <a class="button" href="/catalog">Back to Catalog</a>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

  if (route.kind === 'paperclipDashboard') {
    bindPaperclipDashboard(root);
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

function bindPaperclipDashboard(root: HTMLElement): void {
  const status = root.querySelector<HTMLElement>('[data-dashboard-status]');
  const refreshButton = root.querySelector<HTMLButtonElement>('[data-dashboard-refresh]');
  if (!status || !refreshButton) {
    return;
  }

  const load = async () => {
    refreshButton.disabled = true;
    setStatus(status, 'Loading relay metrics...', false);

    try {
      const response = await fetch('/api/paperclip/relay-status', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const payload = await parseJsonResponse(response);
      if (!response.ok) {
        const apiError = typeof payload?.error === 'string' ? payload.error : 'Request failed.';
        throw new Error(apiError);
      }

      const relay = isRecord(payload?.relay) ? payload.relay : null;
      if (!relay) {
        throw new Error('Relay payload is missing.');
      }

      updateDashboardValue(root, 'queue-depth', asNumberText(relay.queueDepth));
      updateDashboardValue(root, 'next-at', formatDateTime(relay.nextAttemptAt));
      updateDashboardValue(root, 'dead-letter', asNumberText(relay.deadLetterDepth));

      const circuit = isRecord(relay.circuit) ? relay.circuit : null;
      updateDashboardValue(root, 'circuit-open', asYesNo(circuit?.isOpen));
      updateDashboardValue(root, 'circuit-failures', asNumberText(circuit?.consecutiveFailures));

      const lock = isRecord(relay.lock) ? relay.lock : null;
      updateDashboardValue(root, 'lock-owner', asString(lock?.owner, 'none'));

      const metrics = isRecord(relay.metrics) ? relay.metrics : null;
      updateDashboardValue(root, 'total-runs', asNumberText(metrics?.totalRuns));
      updateDashboardValue(root, 'total-forwarded', asNumberText(metrics?.totalForwarded));
      updateDashboardValue(root, 'total-retries', asNumberText(metrics?.totalRetryScheduled));
      updateDashboardValue(root, 'total-failures', asNumberText(metrics?.totalFinalFailures));
      updateDashboardValue(root, 'state-path', asString(relay.statePath, '--'));
      updateDashboardValue(root, 'last-run', formatDateTime(metrics?.lastRunAt));
      updateDashboardValue(root, 'generated-at', formatDateTime(relay.generatedAt));

      setStatus(status, 'Relay metrics refreshed.', false, true);
    } catch (error) {
      setStatus(status, `Dashboard refresh failed: ${toErrorMessage(error)}`, true);
    } finally {
      refreshButton.disabled = false;
    }
  };

  refreshButton.addEventListener('click', () => {
    void load();
  });
  void load();
  globalThis.setInterval(() => {
    void load();
  }, 15_000);
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

function updateDashboardValue(root: HTMLElement, key: string, value: string): void {
  const target = root.querySelector<HTMLElement>(`[data-dashboard-${key}]`);
  if (!target) {
    return;
  }

  target.textContent = value;
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

function asYesNo(value: unknown): string {
  return value === true ? 'yes' : 'no';
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asNumberText(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '0';
}

function formatDateTime(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '--';
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}
