# Deployment

InkByte deploys as two services: the API and the website. The API is a
container; the website is a Next.js application that can run on any Node 24
host or on Vercel.

## Services and credentials

| Service  | What it provides                    | Where the credential lives             |
| -------- | ----------------------------------- | -------------------------------------- |
| Neon     | Hosted PostgreSQL 17+               | `DATABASE_URL`, `MIGRATION_DATABASE_URL` |
| Clerk    | Accounts, sessions and JWTs         | `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_ISSUER` |
| Railway  | Runs the API container              | `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`, `RAILWAY_API_SERVICE_ID` |
| Vercel   | Builds and serves the website       | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |

Never commit these values. Set them as GitHub environment secrets on the
`production` environment and as repository variables for non-secret
configuration.

## Neon

Create one Neon project for InkByte and use its branches as environments:

| Branch       | Purpose                                    |
| ------------ | ------------------------------------------ |
| `main`       | Production data                            |
| `development`| Pre-production data and manual verification |
| `test`       | Disposable data for CI                     |

For each branch, copy the **pooled** connection string into
`DATABASE_URL` and the **direct** connection string into
`MIGRATION_DATABASE_URL`. Migrations must not run through the pooler.

Set `DATABASE_SSL=require` for Neon. The API uses TLS with
`rejectUnauthorized: false` because Neon presents a certificate that is not
chained to a public root on pooled endpoints.

```bash
# Apply the schema forward
pnpm db:migrate

# Register the short domains
pnpm db:seed
```

Migrations are forward-only by design — every `down()` throws. Never reset or
truncate a retained database. To roll back a bad release, add a new forward
migration.

## Clerk

Create a dedicated Clerk application for InkByte and add the production and
staging origins to its allowed origins.

- `CLERK_PUBLISHABLE_KEY` — starts with `pk_`.
- `CLERK_SECRET_KEY` — starts with `sk_`.
- `CLERK_ISSUER` — the instance host, for example
  `https://clerk.example.com`. The API derives the JWKS URL from this value
  and never from the request, so a hostile host header cannot redirect token
  verification.

The website forwards the Clerk session token to the API through
`/api/inkbyte/[...path]`. The API verifies it and applies the ownership rules;
the browser never holds an API credential.

## Pipeline

The workflows follow the shared Bramble Labs baseline.

| Workflow         | Name                     | Responsibility                                     |
| ---------------- | ------------------------ | -------------------------------------------------- |
| `ci.yml`         | CI                       | Lint, typecheck, build, tests and container builds |
| `release.yml`    | Source Release           | Release Please on `development`                     |
| `deploy.yml`     | Deploy                   | Publish images and roll the services on `production` |

`CI Gate` is the required status check. It aggregates the `Website`,
`TypeScript Tests` and `Container Build` jobs and fails if any of them fails.

The deploy workflow:

1. Confirms `production` still points at the commit being deployed.
2. Builds and publishes the API and website images to GHCR with provenance
   and an SBOM, tagged `sha-<sha>` and `latest`.
3. Points the Railway API service at the immutable image digest.
4. Polls `/health/ready` until the API reports readiness.
5. Builds and deploys the website to Vercel.

## Service configuration

The API reads:

| Variable                    | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `PORT`                      | Listen port, default `26090`                     |
| `API_ORIGIN`                | Public API origin                                |
| `SITE_URL`                  | Website origin, used for CORS and short URLs     |
| `DATABASE_URL`              | Runtime connection string                        |
| `MIGRATION_DATABASE_URL`    | Migration connection string                      |
| `DATABASE_SSL`              | `require` for Neon, `disable` for local Postgres |
| `DATABASE_POOL_MAX`         | Connection pool ceiling                          |
| `CLERK_SECRET_KEY`          | Clerk secret key                                 |
| `CLERK_PUBLISHABLE_KEY`     | Clerk publishable key                            |
| `CLERK_ISSUER`              | Clerk instance host                              |
| `DEFAULT_DOMAINS`           | Comma-separated short domains, first is default  |

The website reads `SITE_URL`, `INKBYTE_API_URL`,
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

## Health and shutdown

- `GET /health/live` — process liveness.
- `GET /health/ready` — verifies the database schema is reachable.

The API handles `SIGTERM` by closing the HTTP server and draining the
database pool. Give the service at least 30 seconds of grace period so
in-flight redirects finish.

## Local production-like run

```bash
docker compose up --build
```

This starts Postgres, runs the migration and seed services, then brings up the
API and the website. It uses the local database; point `DATABASE_URL` at Neon
to rehearse the production topology.
