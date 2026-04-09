export interface CatalogProduct {
  slug: string;
  title: string;
  price: string;
  priceCents: number;
  currency: 'usd';
}

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    slug: 'creator-launch-kit',
    title: 'Creator Launch Kit',
    price: '$29',
    priceCents: 2900,
    currency: 'usd'
  },
  {
    slug: 'carousel-copy-bundle',
    title: 'Carousel Copy Bundle',
    price: '$19',
    priceCents: 1900,
    currency: 'usd'
  },
  {
    slug: 'notion-ops-dashboard',
    title: 'Notion Ops Dashboard',
    price: '$39',
    priceCents: 3900,
    currency: 'usd'
  }
];

export function findProductBySlug(slug: string): CatalogProduct | undefined {
  return PRODUCT_CATALOG.find((product) => product.slug === slug);
}
