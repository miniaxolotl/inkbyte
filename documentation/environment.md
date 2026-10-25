# Environment contract

Run `pnpm env:check` before starting services. It checks the API and website
independently, reports variable names and validation failures, and never prints
values. `pnpm env:check api` or `pnpm env:check website` checks one process.
Root `.env` is loaded by the API dev/migration commands; Next reads
`packages/website/.env.local`. Doppler process-injected values take precedence.

## Variables

| Variable                                             | Used by        | Contract                                                             |
| ---------------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| `NODE_ENV`                                           | Both           | `development`, `test`, `production`                                  |
| `PORT`                                               | API            | 1–65535, default 26090                                               |
| `DATABASE_URL`                                       | API            | PostgreSQL pooled URL; remote connections require TLS                |
| `MIGRATION_DATABASE_URL`                             | Migration/seed | Explicit direct owner URL; never in browser/runtime spec             |
| `DATABASE_SSL`                                       | API/tooling    | `require` on Neon, `disable` only for local PostgreSQL               |
| `DATABASE_POOL_MAX`                                  | API            | 1–64, default 8                                                      |
| `DATABASE_ACQUIRE_TIMEOUT_MS`                        | API            | 100–30000, default 2000; increase for Neon cold starts               |
| `DATABASE_STATEMENT_TIMEOUT_MS`                      | API            | 100–30000, default 10000                                             |
| `API_ORIGIN`                                         | API/deploy     | Exact public origin; HTTPS outside loopback                          |
| `SITE_URL`                                           | Both           | Canonical website origin, `https://inkbyte.ca` in production         |
| `INKBYTE_API_URL`                                    | Website        | API origin; never a browser credential                               |
| `DEFAULT_DOMAINS`                                    | API/seed       | Bare names, default `inkb.ca,inkbyte.ca`; first is default           |
| `CLERK_SECRET_KEY`                                   | API/website    | Dedicated instance `sk_…`; server-only                               |
| `CLERK_PUBLISHABLE_KEY`                              | API            | Dedicated instance `pk_…`                                            |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`                  | Website        | Must match API publishable key                                       |
| `CLERK_ISSUER`                                       | API            | Fixed Clerk frontend origin                                          |
| `TRACKING_SECRET`                                    | API            | At least 32 characters, stable and server-only                       |
| `TEST_DATABASE_URL`                                  | Tests          | Disposable database whose name ends in `_test`                       |
| `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`  | Local Compose  | Not needed on Neon                                                   |
| `API_PORT`, `WEB_PORT`                               | Compose        | Host port bindings; internal API/web ports stay 26090/3000           |
| `DIGITALOCEAN_ACCESS_TOKEN`                          | Deployment     | Scoped App Platform token                                            |
| `DIGITALOCEAN_APP_ID`                                | Deployment     | Actual `inkbyte` app UUID                                            |
| `INKBYTE_IMAGE_DIGEST`                               | Deployment     | Exact published `sha256:…` digest                                    |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Deployment     | Existing intended account/project; root `packages/website`           |
| `SITE_NOINDEX`                                       | Website        | Set `true` for staging/previews                                      |
| `NEXT_PUBLIC_VERCEL_INSIGHTS_ENABLED`                | Website build  | `true` only for monitored deployments; still requires visitor opt-in |

Clerk may be entirely absent for public-only build/browser tests. A partial
pair is invalid; do not substitute fake keys in a live deployment. Setting
publishable keys in `NEXT_PUBLIC_…` makes them public by design. Secret keys,
tracking keys and database URLs must never use that prefix.

## Doppler and local inventory

Project `inkbyte` contains `dev`, `stg`, and `prd`; configuration is read back
after writes. A private `secrets.md` records the same values. Empty entries are
intentional missing credentials, not valid replacements.

Website-only reference configs are connected through the existing Bramble Labs
Doppler/Vercel integration, with initial syncs read back as **synced**:

| Doppler config | Vercel environment |
| -------------- | ------------------ |
| `dev_web`      | Development        |
| `stg_web`      | Preview            |
| `prd_web`      | Production         |

These configs contain references for `SITE_URL`, `INKBYTE_API_URL`,
`NEXT_PUBLIC_VERCEL_INSIGHTS_ENABLED`, and `SITE_NOINDEX`, plus Doppler's
non-secret metadata. Readback verified that database, tracking-signing and
infrastructure credentials are absent from every Vercel target.
Public config is unmasked so dynamic sync stores it as readable Vercel Config,
not as a one-way Secret that local prebuilt deployment cannot retrieve.

Development/preview Clerk keys remain deliberately omitted while those targets
run public-only. Production now has matching `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
and `CLERK_SECRET_KEY` references in `prd_web`, pointing to its own live instance;
the server key stays masked/sensitive. The initial blank-reference setup failure
is historical, not the current production configuration. The deploy preflight
checks those target keys are present.

Verified during this rebuild:

- Neon pooled/direct connection strings are stored separately with
  `sslmode=verify-full`. Each environment has its own random tracking key.
- Development Clerk application:
  `app_3L9lKNz2Cu9t2wGOBtdoet1IyL6`. The development publishable key and
  issuer are stored; its **secret key still needs dashboard retrieval**.
- Production Clerk instance `ins_3LA3ks5sniRZYkfCzm30Adc91Bv` is provisioned.
  Its keys/issuer are stored privately and delivered to the production targets;
  DNS, mail and both domain certificates are verified complete by Clerk.
  See [clerk-production.md](clerk-production.md).
- A dedicated DigitalOcean deployment token is stored masked in `inkbyte/prd`
  and encrypted in GitHub `Production`. It is named
  `inkbyte-production-ci-20261025`, expires 2027-01-22, and permits
  `app:create`, `app:read`, `app:update` plus the provider-required
  `regions:read`, `sizes:read`, `actions:read` dependencies. It has no delete,
  console, database or billing permissions. The Bramble Labs team was selected;
  unrelated existing tokens/resources were retained. Rotation is required before
  expiry. DigitalOcean does not narrow this resource-type token to one app.
- DigitalOcean app provisioning/ID remain pending. Local preview/development
  authentication remains intentionally unconfigured.
- Vercel project `prj_EUrWTWEukjkxx3tANxhxwYFGAvnC` exists in Bramble Labs
  (`team_laf9rnD2nve33edSTfwW5LTQ`), with Next.js, Node 24 and
  `packages/website` configured. Both purchased domains are attached and the
  production website/API origins are set. Project IDs are saved in Doppler.
  The exact target is `https://vercel.com/bramble-labs-inc/inkbyte`. The owner
  browser session can select an InkByte-only token, but creation requires an
  email-code reauthentication (`challenge_required_email_otp`). Until the owner
  completes it, `VERCEL_TOKEN` is unconfigured. No account-wide token or expiring
  CLI OAuth credential was substituted, and no verification gate was bypassed.
- `stg` currently references Neon's development branch; isolate it before
  treating it as a retained staging environment.
- Initial Neon connection strings use an owner role. Provision a least-privilege
  runtime role before production, retaining owner credentials only for migrations.

GitHub currently receives deploy configuration through environment secrets and
variables; its synchronization is separate from the website-only Vercel syncs.
Do not reuse another product's credentials to fill empty entries.

Vercel Web Analytics' included tier is enabled on the dedicated InkByte project.
The Web Analytics/Speed Insights SDKs match the reference websites and need no
private ingest key. Production enables their build flag; dev/staging default to
disabled. Collection still requires explicit visitor consent and excludes
private routes. No Plus upgrade was selected. Speed Insights needs a deployed
build and eligible visits before its dashboard can show real data.

The GitHub production environment now has the intended Vercel project/team IDs,
public origins and encrypted direct Neon migration URL. Its prior protection
rules and any existing values were preserved. Production Clerk keys are now
configured. Its public origins and project/team IDs were synchronized again
from Doppler. The DigitalOcean token is configured; Vercel email verification,
the app ID and remaining infrastructure requirements are still pending.
GitHub Production is restricted to the production branch; root database/tracking
credentials are not copied into website environments.
