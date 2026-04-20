# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # run web storefront (http://localhost:5173)
pnpm lint           # lint all workspaces
pnpm typecheck      # typecheck all workspaces
pnpm test           # run all unit tests
pnpm build          # build all workspaces
pnpm run ci         # lint + typecheck + test + build

# Run a single test file
pnpm --filter @faceless/web exec vitest run src/server/stripe.test.ts

# Stripe local webhook forwarding (requires Stripe CLI + pnpm dev running)
pnpm stripe:webhook

# Supabase local stack
pnpm supabase:start
pnpm supabase:stop

# Paperclip relay (PowerShell only)
powershell -ExecutionPolicy Bypass -File scripts\paperclip_to_make.ps1
powershell -ExecutionPolicy Bypass -File scripts\paperclip_to_make.ps1 -DryRun
```

## Architecture

**Monorepo layout:**
- `apps/web` — Vite + TypeScript SPA with server-side API middleware
- `packages/ui` — shared UI component library (`@faceless/ui`)
- `packages/config/eslint` + `packages/config/typescript` — shared tooling config
- `scripts/` — PowerShell relay scripts for Paperclip → Make integration
- `docs/` — local dev and agent reliability layer documentation

**Web app (`apps/web`):**

The app is a Vite SPA where API routes are served by a Vite plugin (`src/server/viteApiPlugin.ts`) that intercepts requests in dev/preview. In production, API routes must be separately hosted.

Key server modules under `src/server/`:
- `api.ts` — single `handleApiRequest()` dispatcher for all `/api/*` routes; designed for dependency injection (persistence, fetch, env) to enable unit testing without HTTP
- `validators.ts` — Zod-based request validation for checkout and lead capture
- `stripe.ts` — Stripe SDK wrapper (checkout session creation, webhook signature verification)
- `persistence.ts` — file-based placeholder persistence writing to `.local-data/orders.jsonl` and `.local-data/leads.jsonl`
- `relayStatus.ts` — reads Paperclip relay state JSON for the `/api/paperclip/relay-status` endpoint

**Storefront routes:**
- `/` landing, `/catalog`, `/product/:slug`, `/lead-magnet`, `/paperclip-dashboard`

**API routes:**
- `POST /api/stripe/checkout-session` — validates product slug + email, creates Stripe Checkout Session
- `POST /api/stripe/webhook` — verifies Stripe signature, persists placeholder order
- `POST /api/lead-magnet` — validates and persists placeholder lead
- `GET /api/paperclip/relay-status` — returns relay queue/circuit/metrics snapshot

**Paperclip reliability layer (`scripts/paperclip_to_make.ps1`):**

PowerShell script that forwards Paperclip approval events to Make.com with a durable queue, circuit breaker, exponential backoff, idempotency keys, and dead-letter retention. All behaviour is controlled via environment variables documented in `docs/agent-reliability-layer.md`. The gateway control UI is at `http://127.0.0.1:18789/` (not port 3100).

## Environment Setup

Copy and populate before running:
```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Required for checkout/webhook: `APP_BASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`  
Optional for Paperclip relay: `PAPERCLIP_API_BASE`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_API_KEY`, `MAKE_WEBHOOK_URL`, `MAKE_WEBHOOK_API_KEY`
