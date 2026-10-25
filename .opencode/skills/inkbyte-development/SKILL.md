---
name: InkByte Development
description: Use for InkByte API and website work, PostgreSQL/Neon and Clerk integration, link and analytics behaviour, and local build verification. Applies the InkByte repository's architecture and delivery safeguards.
---

# InkByte development

Start with `AGENTS.md`, the active local plan under
`~/Development/bramble-labs/plans/inkbyte/`, and `documentation/deploy.md`.
Preserve current user changes and worktrees.

- Use Node 24 and the exact pnpm version in `package.json` (currently
  10.33.2).
- Shared packages live under `lib/`, API code in `packages/api`, website code
  in `packages/website`, tooling in `scripts/`, tests in `tests/`.
- The API owns all access rules. Links, click events and analytics are scoped
  to the owning account; never widen that scope for convenience.
- Clerk is the only identity provider. Verify tokens against the configured
  issuer JWKS and never trust a subject taken from the request body.
- PostgreSQL is the only datastore. Migrations are forward-only, and the test
  suite may only ever touch a database whose name ends in `_test`.
- Production uses Neon. Use the `neon-postgres` skill for connection,
  branching and pooling guidance, and the Neon CLI or MCP server only when
  the target really is Neon.
- Run `pnpm lint`, `pnpm lint:website`, `pnpm check-types`, `pnpm build`,
  `pnpm test:db:setup` and `pnpm test`. Workflow changes also need
  `bash scripts/ci/run-actionlint.sh`.
- Keep credentials out of source, plans and diagnostics. Migrations,
  deployments and publication require explicit task scope.
- Follow the protected-branch and `CI Gate` process. No force pushes, moved
  tags or shortcuts around CI.
