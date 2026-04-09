# Local Development Standards

## Runtime and Package Manager

- Node: `24.13.1` (`.nvmrc`)
- Package manager: `pnpm@10.33.0` (`packageManager` in root `package.json`)
- Workspace config: `pnpm-workspace.yaml`

Bootstrap:

```bash
nvm use
pnpm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Required root `.env` variables for the checkout/webhook/lead vertical slice:

- `APP_BASE_URL` (for Stripe success/cancel URLs)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PLACEHOLDER_DATA_DIR` (optional, defaults to `.local-data`)

## Day-to-Day Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm run ci
```

## Stripe CLI Local Webhooks

Prerequisites:

- Stripe CLI installed and authenticated (`stripe login`)
- Local app running (`pnpm dev`)

Forward Stripe events to local webhook endpoint:

```bash
pnpm stripe:webhook
```

Default target endpoint:

- `http://localhost:5173/api/stripe/webhook`

If the webhook endpoint changes, update the `stripe:webhook` script in root `package.json`.

## Checkout + Lead Capture Vertical Slice

Available API routes (served by Vite middleware in local dev and preview):

- `POST /api/stripe/checkout-session`
- `POST /api/stripe/webhook`
- `POST /api/lead-magnet`

Manual local test workflow:

1. Start app: `pnpm dev`
2. In another terminal start webhook forwarding: `pnpm stripe:webhook`
3. Open `http://localhost:5173/product/creator-launch-kit` and submit checkout form.
4. Complete test checkout in Stripe-hosted flow.
5. Confirm webhook acceptance and placeholder order persistence in `.local-data/orders.jsonl`.
6. Open `http://localhost:5173/lead-magnet`, submit lead form, confirm `.local-data/leads.jsonl` append.

## Supabase Local/Dev Workflow

Prerequisites:

- Supabase CLI installed
- Docker running

Start local Supabase services:

```bash
pnpm supabase:start
```

Stop services:

```bash
pnpm supabase:stop
```

Expected local defaults:

- API URL: `http://127.0.0.1:54321`
- Keys loaded from `.env` and `apps/web/.env`

For dev cloud environments, keep the same variable names and swap only values. Never commit real keys.
