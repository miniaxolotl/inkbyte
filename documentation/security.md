# Security verification notes

## Test fixtures and secret scanning

The GitGuardian alerts on `tests/src/environment.test.ts` and
`scripts/deploy/digitalocean.test.mjs` refer to synthetic PostgreSQL URLs with
the literal fixture password, not a provisioned database credential. Neither
test connects to those URLs. Remote fixture hosts now use the reserved
`.invalid` domain, and the provisioning contract generates its required fixture
password in memory instead of committing a credential-bearing remote URL.

Historical commits are not rewritten and security checks are not suppressed.
The historical incidents still require appropriate false-positive triage in
the connected GitGuardian workspace; editing a fixture does not close an
incident. Real operator credentials remain in Doppler/private ignored files,
never in this document or test output. Do not rotate real unrelated credentials
to remediate a dummy fixture finding.

## Website release boundaries

- Canonical URLs only exist for public home/help/privacy routes. Account data,
  query parameters, short-link destinations and handles are absent from generic
  private metadata. Account, bio/CTA and redirect-error pages are noindex.
- Untrusted browser history is parsed defensively and only HTTP(S) URLs with
  matching short domains can be rendered. Clearing history does not delete links.
- The UI never bypasses Clerk to preview a dashboard. Public browser tests do
  not use fake hosted account keys or contact a Clerk instance.
- Optional Vercel scripts require consent and honor DNT/GPC. The before-send
  boundary excludes all but the informational public paths.
- Source verification is not production acceptance: dedicated Clerk keys,
  provider credentials, a least-privilege runtime role and isolated staging must
  be configured and signed-in workflows accepted before rollout.
