# Architecture Baseline

## Layout

- `apps/web`: Storefront MVP application package.
- `packages/ui`: Shared UI utility package.
- `packages/config/eslint`: Shared ESLint baseline.
- `packages/config/typescript`: Shared TypeScript baseline.

## Storefront MVP Slice (`apps/web`)

The current storefront shell includes:

- `/`: landing/home shell
- `/catalog`: catalog page skeleton
- `/product/:slug`: product detail skeleton
- `/lead-magnet`: lead capture skeleton

The web app now also mounts local API middleware for MVP commerce flow:

- `POST /api/stripe/checkout-session`
- `POST /api/stripe/webhook`
- `POST /api/lead-magnet`

Webhook and lead/order persistence are local placeholders written to newline-delimited JSON files in `.local-data/`.

## Quality Gates

The root `ci` script and GitHub Action run:

1. `lint`
2. `typecheck`
3. `test`
4. `build`

Commands are executed through `pnpm` workspace scripts.
