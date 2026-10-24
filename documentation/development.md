# Development

## Setup

```bash
pnpm install
cp .env.example .env
cp packages/website/.env.example packages/website/.env.local
```

Fill in the Clerk keys, then start the local database and prepare the schema:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```

Run the API and website together:

```bash
pnpm dev
```

| Service | URL                      |
| ------- | ------------------------ |
| Website | <http://localhost:3000>  |
| API     | <http://localhost:26090> |

## Workspace layout

`lib/*` packages export TypeScript source directly, so there is no per-library
build step. `packages/api` is bundled with esbuild into
`packages/api/dist`. The website is built by Next.js.

```bash
pnpm --filter @miniaxolotl/inkbyte-server dev   # API only
pnpm --filter website dev                       # website only
pnpm build:api                                  # esbuild bundle
pnpm build:website                               # Next.js build
```

## Testing

The suite uses `node:test` through `tsx` and runs against a real PostgreSQL
database, because the behaviour under test — ownership rules, unique slug
constraints and click aggregation — only exists in the database.

```bash
export TEST_DATABASE_URL=postgresql://postgres:REPLACE@localhost:5432/inkbyte_test
pnpm test:db:setup
pnpm test
```

The bootstrap refuses any database whose name does not end in `_test`. This
guard exists so a retained development or production database can never be
truncated by a test run.

Tests import the application source directly:

```ts
import { createApp } from "@miniaxolotl/inkbyte-server";
```

The app is constructed with an injected authentication verifier, so the suite
exercises real routing, validation and database behaviour without contacting
Clerk.

## Writing tests

Follow the red-green cycle: write the failing test, run it and confirm it
fails for the expected reason, then implement the smallest change that passes.

```bash
pnpm --filter @monorepo/tests test
```

Add new behaviour to `tests/src/`. Keep each test focused on one behaviour and
name it after that behaviour.

## Linting and types

```bash
pnpm lint           # libraries, API, scripts and tests
pnpm lint:website   # Next.js application
pnpm check-types    # tsc across the workspace
pnpm format         # Prettier
```

Workflow files are checked with the checksum-verified actionlint launcher:

```bash
bash scripts/ci/run-actionlint.sh
```

## Database conventions

- Migrations live in `lib/database/src/migrations.ts` and are forward-only.
- Name them `YYYYMMDD_NNN_snake_case_description`.
- Use raw SQL for anything non-trivial; the schema builder is fine for simple
  column changes.
- Objection models use camelCase properties; `knexSnakeCaseMappers` maps them
  to the snake_case columns. Note that Knex's `.count()` replaces the select
  list, so grouped queries must re-select the grouped columns explicitly.
- PostgreSQL rejects `AS` inside `GROUP BY`. Use `groupByRaw` with the
  expression only, and alias it in the select list.

## Troubleshooting

**`SSL mode 'require' is treated as an alias for 'verify-full'`**
Use `sslmode=verify-full` explicitly in Neon URLs; the API verifies certificates.

**`relation ... is not assignable to type 'RelationType'`**
Objection 4 expects the relation class, not a string. Use
`Model.HasManyRelation` and `Model.BelongsToOneRelation`.

**`The test database name must end in _test`**
The bootstrap is doing its job. Point `TEST_DATABASE_URL` at a dedicated
disposable database.

**A redirect returns 404**
The slug must exist on the requested domain. Only loopback development hosts
may fall back to the first configured domain; arbitrary unknown hosts are
rejected. Both `inkbyte.ca` and `inkb.ca` must be attached to the website host.

## UI verification

`pnpm test:website` covers public routes, canonical/legacy redirects, CTA pages,
bio links, narrow-phone layout and history states against a fixture API. Real
Clerk account flows still need the dedicated instance secret key and a test
account. Never add an authentication bypass to capture dashboard screenshots.
The live public-only development preview for this task runs on port 3315; its
local API on 26091 rejects all account operations.

To test the consent-gated Vercel integrations like CI does:

```bash
NEXT_PUBLIC_VERCEL_INSIGHTS_ENABLED=true pnpm build:website
NEXT_PUBLIC_VERCEL_INSIGHTS_ENABLED=true pnpm test:website
```

The browser suite stubs collector scripts instead of sending test data to Vercel.
It checks no script loads before consent, that private bio routes stay excluded,
and that GPC overrides a saved opt-in. The positive opt-in test is skipped when
the optional build flag is intentionally disabled.
