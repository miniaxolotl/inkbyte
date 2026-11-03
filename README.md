# InkByte

InkByte is a URL shortener with click analytics. Short links live on a domain
you control, and every click is recorded so you can see what actually works.

This repository is a pnpm monorepo:

| Path               | What it is                                               |
| ------------------ | -------------------------------------------------------- |
| `packages/api`     | Hono API over PostgreSQL (Knex + Objection)              |
| `packages/website` | Next.js 16 App Router site with the dashboard            |
| `lib/config`       | zod-validated environment for the API and the website    |
| `lib/database`     | Database connection, Objection models and migrations     |
| `lib/shared`       | Shared contracts, error type and Zod schemas             |
| `tests`            | `node:test` suites running against a disposable database |

Accounts are handled by Clerk. PostgreSQL is hosted on Neon; the API targets
DigitalOcean App Platform and the website targets Vercel. The main domain is
`inkbyte.ca`; `inkb.ca` is the short domain. Production rollout is pending the
remaining provider credentials and verification.

## Requirements

- Node 24
- pnpm 10.33.2 (the version is pinned in `package.json`)
- A Clerk application
- A PostgreSQL database — the bundled Compose file provides one locally

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create your environment files:

   ```bash
   cp .env.example .env
   cp packages/website/.env.example packages/website/.env.local
   ```

3. Fill in the Clerk keys and the database connection string. For local
   Postgres, start it first:

   ```bash
   docker compose up -d postgres
   ```

4. Create the schema and the default domains:

   ```bash
   pnpm env:check
   pnpm db:migrate
   pnpm db:seed
   ```

5. Run the API and the website:

   ```bash
   pnpm dev
   ```

   The API listens on <http://localhost:26090> and the website on
   <http://localhost:3000>.

## Verification

```bash
pnpm lint           # API, libraries, scripts and tests
pnpm lint:website   # Next.js application
pnpm check-types    # tsc across the workspace
pnpm build          # API bundle and Next.js production build
pnpm test:db:setup  # prepare the disposable test database
pnpm test           # node:test suites
```

The test suite requires `TEST_DATABASE_URL` pointing at a database whose name
ends in `_test`. The bootstrap refuses anything else so a retained database can
never be truncated by a test run.

## Docker

`docker compose up --build` starts the API, the website and a local Postgres
database, with migrations and the domain seed running as one-shot services
before the API starts.

## Documentation

- [Development](documentation/development.md) — local workflow, testing and
  troubleshooting.
- [Deployment](documentation/deploy.md) — Neon, Clerk and the production
  pipeline.
- [Architecture](documentation/architecture.md) — how the pieces fit together.
- [Environment and Doppler](documentation/environment.md) — variable validation,
  private operator copies and outstanding setup requirements.
- [UI refinements](documentation/ui.md) — page behaviour, screenshots and
  authenticated-verification limits.
- [Security verification](documentation/security.md) — test-fixture findings,
  metadata/privacy boundaries and production acceptance limits.
- [Clerk production](documentation/clerk-production.md) — identity resources,
  DNS records, credential delivery and provider verification status.

## Features

- Domain-scoped short links with editable destinations, pausing and soft deletion.
- SVG QR codes that continue working after destination updates.
- Published link-in-bio pages with individually tracked items.
- Optional CTA interstitials with impression and continuation counts.
- Signed visitor cookies, bot filtering, privacy-limited referrers and analytics.

The website retains the original squid artwork, typography and palette with a
quieter responsive layout. Screenshots are in `documentation/screenshots/`.

## License

MIT
