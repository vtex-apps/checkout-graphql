# AGENTS.md — Checkout GraphQL

## Project Overview

Checkout GraphQL is a VTEX IO app that exposes a public GraphQL surface over the VTEX Checkout REST APIs (`portal.vtexcommercestable.com.br`, `portal.vtexcommercebeta.com.br`). It aggregates order-form, shipping, payment, items, coupon, profile, and SLA data into resolvers consumed by storefront and admin clients. The repository README marks this app as **experimental** — breaking changes may ship without notice.

This is a VTEX IO app published as `vtex/checkout-graphql@0.67.2`. Builders declared in `manifest.json`: `graphql`, `node`. Tech stack: TypeScript 3.9.7 (node builder), `yarn`, `@vtex/api` 6.46.1, `graphql` 14, `vtex-test-tools` 3, ESLint with `eslint-config-vtex` + `eslint-config-vtex-react`, Prettier with `@vtex/prettier-config`.

## Prerequisites

- Node.js 12.x — matches the runtime declared in `node/service.json` (`stack: nodejs`) and pinned by `.github/workflows/ci.yml` (`actions/setup-node@v4`, `node-version: 12.x`).
- VTEX CLI: `npm i -g vtex`.
- Access to a VTEX account and a development workspace (`vtex use <workspace>`).
- `yarn` (Classic). Both the repository root and `node/` ship their own `yarn.lock`.

### Build & Run

```bash
# Authenticate
vtex login <ACCOUNT>

# Switch to a development workspace
vtex use <WORKSPACE>

# Link the app to the workspace (live-reload while you code)
vtex link

# Publish a new version (CI-driven; local publish is acceptable for beta releases)
vtex publish

# Deploy a published version to production
vtex deploy
```

The build itself runs on `builder-hub`; do **not** pre-compile locally.

### Test Commands

```bash
# Install (root + node builder)
yarn install --frozen-lockfile
cd node && yarn install --frozen-lockfile && cd ..

# Lint (whole tree, root script)
yarn lint

# Unit tests (node builder)
cd node && yarn test

# Tests + coverage (matches CI; lcov + text summary)
cd node && yarn test:coverage

# Local type-check (builder-hub owns the canonical one)
cd node && yarn tsc --noEmit
```

CI (`.github/workflows/ci.yml`) runs lint (changed-files only on PRs, full on push to `master`) and `yarn test:coverage --passWithNoTests` inside `node/` on every PR.

### Architecture Boundaries

| Builder | Folder | Responsibility |
|---------|--------|----------------|
| `node` | `node/` | TypeScript service backed by `@vtex/api`. Houses `clients/`, `directives/`, `resolvers/`, `utils/`, `constants/`, and the `Service` entry in `node/index.ts`. |
| `graphql` | `graphql/` | Public GraphQL schema (`schema.graphql`), directive declarations (`directives.graphql`), shared `types/`. Resolvers live under `node/resolvers/`. |

Rules:

- Resolvers in `node/resolvers/` reach external systems **exclusively** through clients in `node/clients/` (`checkout.ts`, `checkoutAdmin.ts`, `countryDataSettings.ts`, `graphqlServer.ts`, `session.ts`, `searchGraphQL/`). No raw HTTP from resolvers, directives, or utilities.
- Every directive in `graphql/directives.graphql` MUST have a matching implementation in `node/directives/` (and vice versa). Adding or removing one requires updating both in the same PR.
- This app has **no** `react/`, `messages/`, `store/`, `admin/`, `pages/`, or `events/` builders. Adding any of them requires a `manifest.json` change reviewed by `@vtex-apps/checkout-ui` (per `CODEOWNERS`).
- External GraphQL type imports (e.g. `vtex.checkout-graphql@0.60.0`, `vtex.graphql-server`, `vtex.messages`, `vtex.country-data-settings`) come from the URLs in `node/package.json` devDependencies and MUST stay in sync with the major versions pinned in `manifest.json.dependencies`.

### Coding Conventions

**Node**

- Compose route handlers with `compose` from `@vtex/api`; one middleware per file under `node/middlewares/` if any are added.
- Add external clients in `node/clients/index.ts` extending `IOClients`; never call third-party HTTP from resolvers, directives, or utilities directly.
- Throw typed errors from `@vtex/api` (`UserInputError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`); avoid generic `Error` at the request boundary.
- Log via `ctx.vtex.logger`; every log inside a request handler includes `account` and `workspace`.
- TypeScript is `strict: true` in `node/tsconfig.json`. Suppression annotations (`@ts-ignore`, `@ts-expect-error`, `as any`) require a justifying comment on the same line or directly above.

**GraphQL**

- Schema lives at `graphql/schema.graphql` (and `graphql/directives.graphql`, `graphql/types/*.graphql`).
- Schema changes MUST be additive and backwards-compatible. Breaking changes require a major bump in `manifest.json` and a consumer migration note in the PR description.
- The `@cacheControl` directive MUST be reviewed when added or modified — order-form and profile responses are PII-bearing and have specific cache scoping in `node/directives/noCache.ts`, `withOrderFormId.ts`, `withOwnerId.ts`.

### Constitution

Because this repository is public, the non-negotiable engineering principles for this app are stored centrally in the **spec-repo**, not under `.specify/memory/`. The canonical path is `spec-repo/checkout-graphql/constitution.md`. Agents MUST read it before generating or modifying code in this repository; this `AGENTS.md` file is operational guidance only — when the two disagree, the constitution wins.

### Safety Guardrails

- NEVER commit `node_modules/`, build outputs (`dist/`, `build/`, `lib/`, `node/coverage/`), or any artifact compiled outside `builder-hub` — repositories ship source only.
- NEVER commit secrets, account credentials, app tokens, vendor keys, or VKS contents.
- NEVER hardcode account, workspace, region, or tenant values; resolve them from `ctx.vtex.account` / `ctx.vtex.workspace`.
- NEVER add or remove a builder from `manifest.json` without a justifying PR description; builder changes affect platform validation and runtime resolution.
- NEVER include user PII (customer ids, emails, addresses, payment data) or secret values in logs.
- NEVER bypass `builder-hub` by pre-compiling locally and committing artifacts.
- NEVER read tenant settings from `process.env`; use `ctx.vtex.settings` or the app settings client.
- NEVER ship a breaking schema change to `graphql/schema.graphql` without a corresponding major bump in `manifest.json` and a consumer migration note.
- NEVER call third-party HTTP from outside `node/clients/`.
- NEVER bypass the husky `pre-commit` hook (`--no-verify`) in normal development — it runs `lint-staged` (eslint + prettier).
- AVOID local `vtex publish` for non-beta releases; the canonical path is CI-driven publish + deploy.
