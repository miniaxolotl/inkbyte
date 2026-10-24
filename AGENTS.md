# InkByte agent guidance

## Project

InkByte is a URL shortener with click analytics. It is a pnpm monorepo: a
Hono API over PostgreSQL, and a Next.js App Router website. Accounts are
managed by Clerk; the database runs on Neon in production.

## Layout

- **`packages/api/`** — Hono API (`@miniaxolotl/inkbyte-server`): health,
  session, link, redirect and analytics routes.
- **`packages/website/`** — Next.js 16 App Router site (`website`): landing
  page, Clerk sign-in/up, dashboard and the public `/r/[slug]` resolver.
- **`lib/config/`** — zod-validated server and website environment.
- **`lib/database/`** — Knex, Objection models and forward-only migrations.
- **`lib/shared/`** — API envelope, domain errors and Zod contracts.
- **`lib/eslint-config/`**, **`lib/typescript-config/`** — shared configs.
- **`scripts/build.mjs`** — esbuild bundle for the API.
- **`scripts/database/`** — disposable test database bootstrap.
- **`scripts/ci/`** — checksum-verified actionlint launcher.
- **`tests/`** — `node:test` suites run through `tsx`.

## Toolchain

- Node **24**, pnpm **10.33.2** (exact pin in `package.json`).
- TypeScript ESM with `.ts` import extensions and `nodenext` resolution.
- Run `pnpm lint`, `pnpm lint:website`, `pnpm check-types`, `pnpm build`,
  `pnpm test:db:setup` and `pnpm test`.

## Services

- **PostgreSQL** — local `postgres:17-alpine` in Compose; Neon in production.
  Connection strings arrive through `DATABASE_URL` and
  `MIGRATION_DATABASE_URL`.
- **Clerk** — issues session tokens. The API verifies them against the
  instance JWKS using the fixed `CLERK_ISSUER`; the website forwards the
  session token through `/api/inkbyte/[...path]`.
- **Neon** — the hosted database. The `main`, `development` and `test`
  branches back production, pre-production and CI respectively.

## Rules

- Migrations are forward-only. Every `down()` throws on purpose; never reset
  or truncate a retained database.
- Link ownership is enforced in the API. Never expose another account's
  links, click data or analytics.
- Never log SQL, connection strings, tokens or password material. The API
  error handler emits content-free diagnostics only.
- Keep credentials out of source, plans and diagnostics. Use `.env` locally
  and GitHub environment secrets in CI.
- Branches: feature PR → `development` → `production`. Never push directly
  to a protected branch, never move a released tag.
- The `CI Gate` check must pass before a pull request is merged.
- Read `documentation/deploy.md` before touching deployment configuration and
  `documentation/development.md` before changing the test harness.
