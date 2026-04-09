export function createLandingHeadline(brandName: string): string {
  return `${brandName} digital products, shipped weekly.`;
}

const root = globalThis.document?.getElementById('app');

if (root) {
  root.textContent = createLandingHeadline('Faceless Digital Assets');
}
