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
- `CI Gate`: requires classification, promotion admission and each selected job;
  unselected jobs must skip. Production PRs and manual promotion validation run
  every lane. Both `development` and `production`
  require an up-to-date GitHub Actions CI Gate and a pull request, including for
  administrators. Force pushes/deletions are disabled; conversations must be
  resolved. No additional human approval is imposed on the single-owner repo.
- `Source Release`: Release Please on protected `development`. Its bot-created
  or updated release PRs explicitly dispatch independent exact-head CI. Native
  bot-PR runs can require maintainer approval; a manual green run does not clear
  that approval. The dispatcher verifies each PR is an open,
  non-draft, same-repository bot release targeting development before dispatch.
- `Select Release Candidate`: the operator selects a released immutable `vX.Y.Z`
  from protected development. It verifies independent source CI and Release Please
  provenance, freezes `promote/production/vX.Y.Z` with matching trees, and records
  operator/run/source evidence. Merge that PR with a merge commit.
- `Deploy`: protected `production` only. Waits for exact-production independent
  CI and admits the frozen released source. It checks out that source and
  preflights provider configuration before publication. It reuses source-addressed
  GHCR digests on retries, rejects conflicting version tags, publishes missing
  images with provenance/SBOM and promotes verified digests to version/latest tags.
  The retained manifest binds both image digests to the source/tag. It applies
  forward Neon migrations and the domain seed, rolls DigitalOcean and checks
  readiness, then deploys a prebuilt Vercel website. Website delivery verifies
  project/source/production metadata, homepage health and public `/release.json`
  identity, retaining `website-deployment.json`. Current-production checks run
  before migrations, API rollout and website publication.

GitHub's `Production` environment accepts only the `production` branch, not tags
or preview branches. The default Actions token is read-only; release and image
publication jobs opt into their necessary permissions. Follow
[release conventions](release-conventions.md) for patch-first intent, frozen
admission and immutable artifact recovery. Retry a partial release at the same
current production ref; conflicting published content requires a new release.

Unlike the standalone Bramble Labs marketing site, InkByte's delivery workflow
coordinates API readiness before publishing the website. The dedicated Vercel
project retains its Git link and uses ignored-build command `exit 0` plus
`packages/website/vercel.json` with `git.deploymentEnabled: false` to block
independent Git builds. `gitProviderOptions.createDeployments` controls only
GitHub deployment records. Web Analytics and website-only Doppler syncs are
configured independently of delivery. The exact website target is
[`bramble-labs-inc/inkbyte`](https://vercel.com/bramble-labs-inc/inkbyte), with
root directory `packages/website`. A project-scoped CI access token is configured
as `VERCEL_TOKEN`, with verified project/team IDs; see
[environment.md](environment.md) for storage and rotation. Production Branch
Tracking is `production`, verified in the dashboard and project API on 2026-11-02.
Keep the ignored-build command and source Git deployment control enabled so
publication remains coordinated by `Deploy`.

The owner deleted the legacy `mawa-projects/inkbyte` project from its separate
Vercel account on 2026-11-02. Controls on `bramble-labs-inc/inkbyte` apply only to
that project; any future project linked to this repository must also block
independent Git builds before use.

Configure the production GitHub environment with the deployment secrets and
variables listed in [environment.md](environment.md). Provision and verify the
App Platform target/`DIGITALOCEAN_APP_ID`, an operational provider account and exact
DNS targets before the first rollout. Review forward migrations before merging an
incompatible rollout. Never point an integration at the removed `packages/web` root.

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
