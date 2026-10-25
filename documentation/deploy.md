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
See [environment.md](environment.md) for the configured production Clerk pair
and the separate development/preview configuration requirements.

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

The existing InkByte application now has a dedicated production instance on
`inkbyte.ca`. Its keys and fixed issuer are stored in Doppler, the complete
website pair is referenced by `prd_web`, and GitHub production has the required
website keys. Five DNS-only Cloudflare CNAMEs are verified. The authentication
domain serves its signing keys over verified HTTPS; Clerk reports DNS, email
and both authentication and hosted account-portal TLS complete. See
[Clerk production setup](clerk-production.md) for resources and verification.

The local preview remains public-only. Never put production keys on localhost
or reuse another product's Clerk credentials. The official authenticated CLI can
retrieve keys privately; no key value belongs in documentation or diagnostics.

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
- `CI Gate`: requires every CI job. Both `development` and `production` now
  require an up-to-date GitHub Actions CI Gate and a pull request, including for
  administrators. Force pushes/deletions are disabled; conversations must be
  resolved. No additional human approval is imposed on the single-owner repo.
- `Source Release`: Release Please on protected `development`. Its bot-created
  or updated release PRs explicitly dispatch CI, because `GITHUB_TOKEN` PR events
  do not trigger another Actions run. The dispatcher verifies each PR is an open,
  non-draft, same-repository bot release targeting development before dispatch.
- `Deploy`: protected `production` only. Waits for exact-source independent
  CI, publishes digest-addressed GHCR images with provenance/SBOM, applies
  forward Neon migrations and the domain seed, rolls DigitalOcean and checks
  readiness, then deploys a prebuilt Vercel website.

GitHub's `Production` environment accepts only the `production` branch, not tags
or preview branches. The default Actions token is read-only; release and image
publication jobs opt into their necessary write permissions. Source Release was
verified on the protected development branch and opened release PR #2.

Unlike the standalone Bramble Labs marketing site, InkByte's dedicated Vercel
project is not Git-connected: its current workflow coordinates the API rollout
before publishing the website. Web Analytics and website-only Doppler syncs are
configured independently of delivery. The exact website target is
[`bramble-labs-inc/inkbyte`](https://vercel.com/bramble-labs-inc/inkbyte), with
root directory `packages/website`. A project-scoped Vercel CI token is awaiting
the owner's email verification; CLI OAuth credentials are not a substitute. Moving to Git
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
