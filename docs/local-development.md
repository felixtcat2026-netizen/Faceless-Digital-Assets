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
