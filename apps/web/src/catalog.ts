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
    catalogTeaser: 'Launch a sellable faceless offer this week with plug-and-play positioning, pricing, and delivery assets.',
    audience: 'first-time digital product builders who want a fast, low-overhead launch',
    outcome: 'go from loose idea to live offer without building everything from scratch',
    promise: 'Package your knowledge into a clean offer, publish it quickly, and start collecting real buying signals.',
    implementationTime: 'Set up the core assets in one focused afternoon and refine from live feedback.',
    whatYouGet: [
      'Offer positioning worksheet, pricing prompts, and launch checklist',
      'Landing page copy prompts and simple fulfillment handoff templates',
      'Examples you can adapt for a first faceless product launch'
    ],
    bonus: 'Includes a quick-start sprint outline for your first 7 days.',
    ctaLabel: 'Get the Launch Kit'
  },
  {
    slug: 'carousel-copy-bundle',
    title: 'Carousel Copy Bundle',
    price: '$19',
    priceCents: 1900,
    currency: 'usd',
    catalogTeaser: 'Turn silent scrolling into clicks with ready-to-customize carousel hooks, slides, and CTA frameworks.',
    audience: 'creators and operators who need faster content that still sounds persuasive',
    outcome: 'publish sharper educational and promotional carousels without staring at a blank page',
    promise: 'Skip the drafting spiral and ship conversion-minded carousel copy in minutes instead of hours.',
    implementationTime: 'Customize a post angle, plug in your offer, and publish the same day.',
    whatYouGet: [
      'Hook formulas, body slide frameworks, and CTA endings for multiple post angles',
      'Swipeable examples for promotion, authority building, and lead generation',
      'Messaging structures built to move readers from curiosity to action'
    ],
    bonus: 'Includes extra CTA prompts for link clicks, replies, and lead magnet signups.',
    ctaLabel: 'Download the Copy Bundle'
  },
  {
    slug: 'notion-ops-dashboard',
    title: 'Notion Ops Dashboard',
    price: '$39',
    priceCents: 3900,
    currency: 'usd',
    catalogTeaser: 'Run launches, content, and fulfillment from one clean workspace instead of scattered tabs and spreadsheets.',
    audience: 'solo operators who need a lightweight command center for recurring launches',
    outcome: 'track ideas, production, sales follow-up, and weekly priorities in one place',
    promise: 'Replace messy manual tracking with a simple system you can open daily and trust immediately.',
    implementationTime: 'Duplicate the dashboard, connect your workflow, and start using it in under 30 minutes.',
    whatYouGet: [
      'A ready-to-duplicate Notion workspace for launch planning and execution',
      'Views for pipeline status, weekly cadence, and follow-up visibility',
      'Simple SOP prompts that make handoffs and reviews easier to manage'
    ],
    bonus: 'Includes a weekly review template to keep launches moving without extra admin.',
    ctaLabel: 'Access the Ops Dashboard'
  }
];

export function findProductBySlug(slug: string): CatalogProduct | undefined {
  return PRODUCT_CATALOG.find((product) => product.slug === slug);
}
