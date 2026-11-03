import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertCandidate,
  assertCi,
  assertSelection,
  promotionTag,
} from "./promotion.mjs";

const sha = "a".repeat(40);
const tree = "b".repeat(40);
const policy = {
  repository: "miniaxolotl/inkbyte",
  operator: "miniaxolotl",
  branches: ["development", "production"],
};
const candidate = {
  tag: "v0.2.1",
  sha,
  tree,
  version: "0.2.1",
  manifestVersion: "0.2.1",
  release: { tag_name: "v0.2.1", draft: false },
  releasePr: {
    merged_at: "2026-11-02",
    merge_commit_sha: sha,
    base: { ref: "development", repo: { full_name: policy.repository } },
    head: { repo: { full_name: policy.repository } },
    labels: [{ name: "autorelease:tagged" }],
  },
};
test("release evidence requires every declared CI job including quality and classification", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const names = [...workflow.matchAll(/^ {4}name: (.+)$/gm)].map(
    (match) => match[1],
  );
  const actual = JSON.parse(
    readFileSync("scripts/release/policy.json", "utf8"),
  );
  assert.deepEqual([...actual.ciJobs].sort(), names.sort());
});
test("publication requires frozen, same-repository, released source and matching trees", () => {
  const pr = {
    base: { ref: "production" },
    head: {
      ref: "promote/production/v0.2.1",
      repo: { full_name: policy.repository },
    },
  };
  assert.equal(promotionTag(policy, pr), candidate.tag);
  assert.doesNotThrow(() => assertCandidate(policy, candidate, tree));
  for (const ref of [
    "development",
    "promote/production/latest",
    "promote/staging/v0.2.1",
  ])
    assert.throws(() =>
      promotionTag(policy, { ...pr, head: { ...pr.head, ref } }),
    );
  assert.throws(() =>
    promotionTag(policy, {
      ...pr,
      head: { ...pr.head, repo: { full_name: "fork/inkbyte" } },
    }),
  );
  for (const change of [
    { releasePr: null },
    { manifestVersion: "0.2.0" },
    { release: { ...candidate.release, draft: true } },
  ])
    assert.throws(() =>
      assertCandidate(policy, { ...candidate, ...change }, tree),
    );
  assert.throws(() => assertCandidate(policy, candidate, "c".repeat(40)));
});
test("independent CI rejects skipped, partial, foreign, PR-only and self evidence", () => {
  const run = {
    id: 17,
    run_attempt: 1,
    path: ".github/workflows/ci.yml",
    head_sha: sha,
    head_repository: { full_name: policy.repository },
    event: "push",
    status: "completed",
    conclusion: "success",
  };
  const jobs = ["TypeScript Tests", "Website", "CI Gate"].map((name) => ({
    name,
    run_id: 17,
    run_attempt: 1,
    head_sha: sha,
    status: "completed",
    conclusion: "success",
  }));
  const options = {
    repository: policy.repository,
    sha,
    required: jobs.map((job) => job.name),
    exclude: 18,
  };
  assert.equal(assertCi(run, jobs, options), true);
  for (const change of [
    { event: "pull_request" },
    { id: 18 },
    { conclusion: "failure" },
    { head_repository: { full_name: "fork/inkbyte" } },
    { head_sha: tree },
  ])
    assert.equal(assertCi({ ...run, ...change }, jobs, options), false);
  for (const selected of [
    jobs.slice(1),
    [...jobs, jobs[0]],
    [{ ...jobs[0], conclusion: "skipped" }, ...jobs.slice(1)],
  ])
    assert.equal(assertCi(run, selected, options), false);
});
test("bot candidate selection binds operator, workflow, run, source and exact frozen head", () => {
  const pr = { number: 5, head: { sha }, base: { ref: "production" } };
  const run = {
    id: 12,
    event: "workflow_dispatch",
    head_branch: "development",
    head_repository: { full_name: policy.repository },
    path: ".github/workflows/promote.yml",
    actor: { login: policy.operator },
    triggering_actor: { login: policy.operator },
    head_sha: tree,
  };
  const record = {
    repository: policy.repository,
    run: 12,
    tooling: tree,
    pr: 5,
    head: sha,
    target: "production",
    tag: candidate.tag,
    sha,
    tree,
  };
  assert.doesNotThrow(() =>
    assertSelection(policy, pr, candidate, run, record),
  );
  for (const change of [
    { head: tree },
    { sha: tree },
    { tag: "v0.2.2" },
    { pr: 6 },
    { run: 13 },
  ])
    assert.throws(() =>
      assertSelection(policy, pr, candidate, run, { ...record, ...change }),
    );
  assert.throws(() =>
    assertSelection(
      policy,
      pr,
      candidate,
      { ...run, triggering_actor: { login: "other" } },
      record,
    ),
  );
});
