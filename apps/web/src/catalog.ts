export interface CatalogProduct {
  slug: string;
  title: string;
  price: string;
  priceCents: number;
  currency: 'usd';
  catalogTeaser: string;
  audience: string;
  outcome: string;
  promise: string;
  implementationTime: string;
  whatYouGet: string[];
  bonus: string;
  ctaLabel: string;
}

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    slug: 'creator-launch-kit',
    title: 'Creator Launch Kit',
    price: '$29',
    priceCents: 2900,
    currency: 'usd',
    catalogTeaser: 'Stop overthinking your first offer and launch a faceless product this week with positioning, pricing, and delivery assets that are ready to adapt.',
    audience: 'first-time digital product builders who want the fastest path from idea to paid offer',
    outcome: 'turn a rough concept into a checkout-ready offer without wasting another week building from scratch',
    promise: 'Turn scattered notes into a clear offer people can understand, buy, and receive without the usual launch chaos.',
    implementationTime: 'Block one focused afternoon to customize the assets, then tighten the offer with real buyer feedback.',
    whatYouGet: [
      'Offer positioning worksheet, pricing prompts, and a launch checklist that removes blank-page friction',
      'Landing page copy prompts and simple fulfillment handoff templates so you can sell without duct-taping the backend',
      'Realistic examples you can adapt to publish your first faceless product faster'
    ],
    bonus: 'Includes a 7-day quick-start sprint so you know exactly what to ship next.',
    ctaLabel: 'Get Instant Access to the Launch Kit'
  },
  {
    slug: 'carousel-copy-bundle',
    title: 'Carousel Copy Bundle',
    price: '$19',
    priceCents: 1900,
    currency: 'usd',
    catalogTeaser: 'Turn passive scrolling into clicks, replies, and signups with ready-to-customize hooks, slide structures, and CTA frameworks.',
    audience: 'creators and operators who need persuasive content fast without sounding templated',
    outcome: 'publish sharper educational and promotional carousels that move readers toward a clear next step',
    promise: 'Stop burning hours on drafts that go nowhere and publish conversion-minded carousel copy the same day.',
    implementationTime: 'Pick a post angle, plug in your offer, and ship a stronger carousel in one sitting.',
    whatYouGet: [
      'Hook formulas, body slide frameworks, and CTA endings for promotion, authority, and lead generation angles',
      'Swipeable examples that help you move from idea to publishable draft in minutes',
      'Messaging structures designed to pull readers from curiosity into clicks, replies, and opt-ins'
    ],
    bonus: 'Includes extra CTA prompts for link clicks, replies, saves, and lead magnet signups.',
    ctaLabel: 'Download the Conversion Copy Bundle'
  },
  {
    slug: 'notion-ops-dashboard',
    title: 'Notion Ops Dashboard',
    price: '$39',
    priceCents: 3900,
    currency: 'usd',
    catalogTeaser: 'Replace scattered tabs and forgotten follow-ups with one command center for launches, content, and fulfillment.',
    audience: 'solo operators who need a lightweight system that keeps recurring launches from slipping',
    outcome: 'see your ideas, production, sales follow-up, and weekly priorities in one place you will actually use',
    promise: 'Trade messy manual tracking for a simple dashboard that helps you stay organized, responsive, and launch-ready.',
    implementationTime: 'Duplicate the dashboard, map it to your workflow, and start running from it in under 30 minutes.',
    whatYouGet: [
      'A ready-to-duplicate Notion workspace for launch planning, execution, and fulfillment visibility',
      'Views for pipeline status, weekly cadence, and follow-up so revenue tasks stop getting buried',
      'Simple SOP prompts that make handoffs, reviews, and recurring launches easier to manage'
    ],
    bonus: 'Includes a weekly review template to keep launches moving without adding admin overhead.',
    ctaLabel: 'Access the Ops Dashboard Today'
  }
];

export function findProductBySlug(slug: string): CatalogProduct | undefined {
  return PRODUCT_CATALOG.find((product) => product.slug === slug);
}
