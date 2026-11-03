# Release and contribution conventions

InkByte follows the Fern/Burrow/Grove/Website patch-first release contract.
Release Please 5.0.0 (library/schema 17.6.0) owns the root manifest, changelog and
API/website package versions. Routine fixes/features bump patch through upstream
`always-bump-patch`; higher versions require `Release-As: X.Y.Z` in actual merged
history. Breaking changes without that decision fail source automation. Never
hand-bump, move tags or replace published versioned artifacts.

Feature PR → protected `development` → released tag → operator-selected frozen
`promote/production/vX.Y.Z` PR → protected `production`. Promotion uses a merge
commit and an identical released tree. Selection records source CI, operator,
tooling, source/tree and frozen head; missing/expired evidence fails admission.
Rerun the original selection to refresh evidence, never move a frozen branch.

Production PRs retain full CI validation plus promotion admission. Push/manual
source CI runs all lanes. `CI Gate` requires classification, admission and every
selected job; unselected jobs must skip. All core branches require strict CI,
resolved conversations and PRs. Auto-merge is enabled without bypass actors;
rebase is disabled. Automatic feature-head deletion preserves protected core,
frozen and source-tag refs. Dependabot alerts/security updates and public secret
scanning/push protection are enabled.

Since [June 2026](https://github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved/),
`GITHUB_TOKEN` bot PRs can create approval-required native runs. Review/approve
those runs and verify actual PR checks. Explicit exact-head dispatches provide
independent evidence but do not clear native workflow approval.

Use `type/scope-short-description` branches and `type(scope): imperative summary`
commits/PR titles. Keep commits cohesive, push a verified batch, assign PRs to
`miniaxolotl` and use one relevant label. Work in parent-workspace `worktrees/`;
keep plan/notes/status outside Git in `plans/inkbyte/`. Include relevant screenshots
only, at most four previews per row. Remove clean task worktrees after confirmed
merge. Secrets and retained provider data never belong in commits or plans.

See [deployment](deploy.md) for provider preflight, forward migrations, immutable
image delivery, API-first website deployment and partial-release recovery.
