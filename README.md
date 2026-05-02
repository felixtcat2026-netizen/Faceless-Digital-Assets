# Faceless Digital Assets

Monorepo for storefront MVP implementation, shared packages, and local dev workflows.

## Local Setup

1. Use Node from `.nvmrc`:
   - `nvm use` (or install `24.13.1` first if missing)
2. Install dependencies:
   - `pnpm install`
3. Create env files:
   - `cp .env.example .env`
   - `cp apps/web/.env.example apps/web/.env`

## Common Commands

- `pnpm dev` - run the web storefront locally
- `pnpm lint` - lint all workspaces
- `pnpm typecheck` - typecheck all workspaces
- `pnpm test` - run unit tests
- `pnpm build` - build all workspaces
- `pnpm run ci` - run lint + typecheck + test + build

## Storefront Routes (MVP Slice)

- `/` - landing/home shell
- `/catalog` - product catalog skeleton
- `/product/:slug` - product detail skeleton
- `/lead-magnet` - lead capture skeleton
- `/paperclip-dashboard` - relay reliability metrics dashboard

## API Routes (Vertical Slice)

- `POST /api/stripe/checkout-session` - validates product/email and creates Stripe Checkout Session
- `POST /api/stripe/webhook` - verifies Stripe signature and stores placeholder order records
- `POST /api/lead-magnet` - validates and stores placeholder lead records
- `GET /api/paperclip/relay-status` - returns Paperclip relay queue/circuit/metrics snapshot

## Local Integrations

- Stripe webhook listener:
  - `pnpm stripe:webhook`
- Supabase local stack:
  - `pnpm supabase:start`
  - `pnpm supabase:stop`
- Paperclip approval relay reliability layer:
  - `powershell -ExecutionPolicy Bypass -File scripts\paperclip_to_make.ps1`
  - details: `docs/agent-reliability-layer.md`

Detailed local integration notes are in `docs/local-development.md`.

## Workspace Layout

- `apps/web`
- `packages/ui`
- `packages/config/eslint`
- `packages/config/typescript`
- `docs`
