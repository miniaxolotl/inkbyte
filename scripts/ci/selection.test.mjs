import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { classify, evaluateGate, selectEvent } from "./selection.mjs";

const policy = {
  jobs: ["api", "site"],
  rules: [
    { prefix: "api/", jobs: ["api"] },
    { prefix: "site/", jobs: ["site"] },
    { prefix: "shared/", jobs: ["api", "site"] },
  ],
};

test("repository policy covers every workflow job and shared dependencies", () => {
  const actual = JSON.parse(
    readFileSync(new URL("./job-policy.json", import.meta.url), "utf8"),
  );
  const workflow = readFileSync(
    new URL("../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  const jobs = [
    ...workflow
      .split("\njobs:\n")[1]
      .matchAll(/^ {2}([A-Za-z_][A-Za-z0-9_-]*):$/gm),
  ].map((match) => match[1]);
  assert.deepEqual(jobs.sort(), ["changes", "ci-gate", ...actual.jobs].sort());
  assert.ok(Object.values(classify(actual, ["pnpm-lock.yaml"])).every(Boolean));
  assert.ok(
    Object.values(classify(actual, [".github/workflows/ci.yml"])).every(
      Boolean,
    ),
  );
  assert.ok(
    Object.values(classify(actual, ["documentation/guide.md"])).every(
      (value) => !value,
    ),
  );
  for (const job of actual.jobs)
    assert.ok(
      workflow.includes(`fromJSON(needs.changes.outputs.selection).${job}`) ||
        workflow.includes(
          `fromJSON(needs.changes.outputs.selection)['${job}']`,
        ),
    );
});

test("selection is conservative for empty/unknown paths and includes shared dependencies", () => {
  assert.deepEqual(classify(policy, ["documentation/runbook.md"]), {
    api: false,
    site: false,
  });
  assert.deepEqual(classify(policy, ["site/page.tsx"]), {
    api: false,
    site: true,
  });
  for (const paths of [
    [],
    ["unknown"],
    ["shared/config.ts"],
    ["site/a", "api/b"],
  ])
    assert.deepEqual(classify(policy, paths), { api: true, site: true });
});

test("promotion requests allocate no validation jobs", () => {
  for (const [event, baseRef, promotionPr] of [
    ["pull_request", "production", false],
    ["workflow_dispatch", "", true],
  ])
    assert.deepEqual(
      selectEvent(policy, event, baseRef, promotionPr, ["shared/a"]),
      { api: false, site: false },
    );
  for (const event of ["push", "workflow_dispatch"])
    assert.deepEqual(
      selectEvent(policy, event, "", false, ["documentation/a.md"]),
      { api: true, site: true },
    );
});

test("gate requires selected jobs to succeed and unselected jobs to skip", () => {
  const selection = JSON.stringify({ api: true, site: false });
  const passing = {
    changes: { result: "success", outputs: { selection } },
    api: { result: "success" },
    site: { result: "skipped" },
  };
  assert.equal(evaluateGate(policy, passing), true);
  for (const needs of [
    { ...passing, changes: { result: "failure", outputs: { selection } } },
    { ...passing, api: { result: "skipped" } },
    { ...passing, site: { result: "success" } },
    { ...passing, api: { result: "failure" } },
  ])
    assert.throws(() => evaluateGate(policy, needs));
});
