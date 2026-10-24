# Deployment

## Domains and providers

| Name             | Purpose                                    | Host                        |
| ---------------- | ------------------------------------------ | --------------------------- |
| `inkbyte.ca`     | Website, accounts, dashboard and bio pages | Vercel                      |
| `inkb.ca`        | Short links and QR destinations            | The same Vercel project     |
| `api.inkbyte.ca` | Hono API                                   | DigitalOcean App Platform   |
| Neon `inkbyte`   | PostgreSQL                                 | AWS US East 1               |
| Clerk `InkByte`  | Accounts                                   | Dedicated Clerk application |

Both purchased zones are in Cloudflare. Add the exact DNS targets supplied by
Vercel and DigitalOcean after attaching the domains there; do not guess them.
Use DNS-only records until each platform has validated its certificate. Do not
cache `/r/*`, `/l/*`, `/<slug>`, `/visit/*`, API calls or authenticated pages:
caching bypasses click recording. Use Full (strict) TLS if proxying is enabled.
Do not redirect `inkb.ca` wholesale to the marketing site; both domains must
execute the short-link resolver.

## Configuration and secrets

Doppler project **`inkbyte`** is the secret store. `dev`, `stg`, and `prd` are
separate configurations. `doppler.yaml` selects `dev` locally:

```bash
doppler run -- pnpm env:check
doppler run -- pnpm dev
```

`secrets.md` is a gitignored, mode-0600 local operator copy. Never put it in a
commit, Docker build context, screenshot, PR or plan. See
[environment.md](environment.md) for the variable contract and current gaps.
The dedicated `_web` configs now synchronize safe website configuration to
Vercel Development/Preview/Production through the existing Bramble Labs
integration. Root configs containing database and infrastructure credentials
are never synchronized to Vercel. DigitalOcean/GitHub setup is separate.
See [environment.md](environment.md) before adding the pending Clerk references.

### Neon

Project ID: `small-mouse-26737910`.

- `main`: production, initially empty.
- `development`: development; currently also referenced by `stg`. Provision
  an isolated staging branch before using staging with retained data.
- `test`: separate `inkbyte_test` database for disposable tests.

Runtime uses a pooled `DATABASE_URL`; migrations use the direct,
non-`-pooler` `MIGRATION_DATABASE_URL`. Use `sslmode=verify-full` and
`DATABASE_SSL=require`. Certificates are verified; do **not** disable
`rejectUnauthorized`. Provision a non-owner runtime role before production:
the initially provisioned Neon URLs use the owner and are setup credentials,
not a least-privilege runtime configuration.

```bash
doppler run -- pnpm db:migrate
doppler run -- pnpm db:seed
```

Migrations are explicit and forward-only. Never reset an existing database.
The seed adds/updates domains without deleting retained legacy domains or links.

### Clerk

The dedicated development application is provisioned. Its secret key must be
copied from the Clerk dashboard; the connector deliberately does not return
secret keys. Production is **not** provisioned or DNS-verified yet. Configure
the production instance for `inkbyte.ca`, register authorized origins, and put
its keys and issuer into `prd`. Do not reuse Grove/Fern credentials.

The API verifies RS256 session tokens against the fixed issuer, requires a
session ID and matches the authorized-party claim to `SITE_URL`. The website
forwards tokens through its authenticated BFF; tokens are not passed as client
component props. Clerk handles sign-up, sign-in, verification, recovery and
account management.

## DigitalOcean App Platform

`.do/app.json` describes the API. The placeholder digest cannot be deployed;
`scripts/deploy/src/digitalocean.mjs` requires an actual SHA-256 digest.
Initial provisioning validates production Clerk keys, verified database TLS,
origins and the tracking key. Migration credentials are never included in the
runtime spec.

```bash
node scripts/deploy/src/digitalocean.mjs --propose --digest "$INKBYTE_IMAGE_DIGEST"
# Once the proposal/cost and provider configuration are approved:
node scripts/deploy/src/digitalocean.mjs --create --digest "$INKBYTE_IMAGE_DIGEST" --wait
```

Subsequent rollouts supply `DIGITALOCEAN_APP_ID` and update only the API image
digest, preserving encrypted secrets, DNS and operator settings. The script
waits for the **new** deployment, never an older active deployment. Ensure
the GHCR image is public or configure a registry credential in App Platform.

## CI/CD

- `CI`: frozen pnpm install, lint, types, API/database tests, production web
  build, browser tests, deployment-spec tests, actionlint, both images.
- `CI Gate`: requires every CI job. Set it as a required branch check.
- `Source Release`: Release Please on protected `development`.
- `Deploy`: protected `production` only. Waits for exact-source independent
  CI, publishes digest-addressed GHCR images with provenance/SBOM, applies
  forward Neon migrations and the domain seed, rolls DigitalOcean and checks
  readiness, then deploys a prebuilt Vercel website.

Unlike the standalone Bramble Labs marketing site, InkByte's dedicated Vercel
project is not Git-connected: its current workflow coordinates the API rollout
before publishing the website. Web Analytics and website-only Doppler syncs are
configured independently of delivery. A persistent authorized Vercel CI token
is still missing; CLI OAuth credentials are not a substitute. Moving to Git
delivery requires a deliberate pipeline change, not a second automatic deploy.

Configure the production GitHub environment with the deployment secrets and
variables listed in [environment.md](environment.md). Review migrations before
merging an incompatible rollout. The legacy `mawa-projects` Vercel integration
must be disconnected or updated to root directory **`packages/website`**;
its old `packages/web` root no longer exists. No production rollout has been
performed as part of the source rebuild.

## Legacy data

The new schema does not automatically import MySQL. Before cutover:

1. Export and back up the old MySQL database read-only. The original Prisma
   schema remains available at `git show 8c32f34:prisma/schema.prisma`.
2. Import accounts into the dedicated Clerk instance using its supported
   migration flow; map old user IDs to verified Clerk subjects. Do not attach
   anonymous legacy links to an arbitrary account.
3. Map `Domain.slug`, `Link.slug`, `Link.long_url`, ownership and tracking/CTA
   fields into the new tables. Keep domain/slug combinations unchanged for
   existing published links. Supply ownership explicitly for orphaned links.
4. Import historical logs only with a documented visitor-ID mapping and
   appropriate privacy/retention handling; keep the original backup.
5. Verify representative `/l/<slug>` links and domain collisions on an isolated
   branch before changing DNS. Legacy passwords and sessions are not copied
   into the new API.
