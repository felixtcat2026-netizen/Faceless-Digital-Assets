# Architecture Baseline

## Layout

- `apps/web`: Initial web application package.
- `packages/ui`: Shared UI utility package.
- `packages/config/eslint`: Shared ESLint baseline.
- `packages/config/typescript`: Shared TypeScript baseline.

## Quality Gates

The root `ci` script and GitHub Action run:

1. `lint`
2. `typecheck`
3. `test`
4. `build`
