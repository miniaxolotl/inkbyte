import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import process from "node:process";
import console from "node:console";
import { pathToFileURL, URL } from "node:url";

function inventory(policy) {
  assert.ok(Array.isArray(policy.jobs) && policy.jobs.length > 0);
  assert.equal(new Set(policy.jobs).size, policy.jobs.length);
  assert.ok(
    policy.jobs.every(
      (job) =>
        /^[a-z][a-z0-9-]*$/.test(job) &&
        !["changes", "promotion", "ci-gate"].includes(job),
    ),
  );
  assert.ok(Array.isArray(policy.rules));
  for (const rule of policy.rules) {
    assert.ok(typeof rule.prefix === "string" && rule.prefix.length > 0);
    assert.ok(
      Array.isArray(rule.jobs) &&
        rule.jobs.length > 0 &&
        rule.jobs.every((job) => policy.jobs.includes(job)),
    );
  }
  return policy.jobs;
}
export function classify(policy, paths) {
  const jobs = inventory(policy);
  assert.ok(
    Array.isArray(paths) &&
      paths.every((path) => typeof path === "string" && path.length > 0),
  );
  const selection = Object.fromEntries(
    jobs.map((job) => [job, paths.length === 0]),
  );
  for (const path of paths) {
    if (
      path.startsWith("documentation/") ||
      ["README.md", "AGENTS.md", "LICENSE"].includes(path)
    )
      continue;
    const matches = path.endsWith("/package.json")
      ? []
      : policy.rules.filter((rule) => path.startsWith(rule.prefix));
    for (const job of matches.length
      ? matches.flatMap((rule) => rule.jobs)
      : jobs)
      selection[job] = true;
  }
  return selection;
}
export function diffPaths(base, head, run = execFileSync) {
  assert.match(base, /^[a-f0-9]{40}$/);
  assert.match(head, /^[a-f0-9]{40}$/);
  return run(
    "git",
    ["diff", "--name-only", "--no-renames", "-z", `${base}...${head}`],
    { encoding: "utf8", timeout: 30_000, maxBuffer: 16 * 1024 * 1024 },
  )
    .split("\0")
    .filter(Boolean);
}
export function selectEvent(policy, event, baseRef, _promotionPr, paths) {
  assert.ok(["push", "pull_request", "workflow_dispatch"].includes(event));
  return classify(
    policy,
    event === "pull_request" && baseRef === "development" ? paths : [],
  );
}
export function evaluateGate(policy, needs) {
  const jobs = inventory(policy);
  assert.ok(needs && typeof needs === "object" && !Array.isArray(needs));
  assert.deepEqual(
    Object.keys(needs).sort(),
    ["changes", "promotion", ...jobs].sort(),
    "CI job inventory mismatch",
  );
  assert.equal(needs.changes.result, "success", "Classification must succeed");
  assert.equal(
    needs.promotion.result,
    "success",
    "Promotion admission must succeed",
  );
  const selected = JSON.parse(needs.changes.outputs.selection);
  assert.ok(
    selected && typeof selected === "object" && !Array.isArray(selected),
  );
  assert.deepEqual(
    Object.keys(selected).sort(),
    [...jobs].sort(),
    "Selection inventory mismatch",
  );
  for (const job of jobs) {
    assert.equal(typeof selected[job], "boolean", "Invalid selection output");
    assert.equal(
      needs[job].result,
      selected[job] ? "success" : "skipped",
      `${job} did not match selection`,
    );
  }
  return true;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const policy = JSON.parse(
      readFileSync(new URL("./job-policy.json", import.meta.url), "utf8"),
    );
    if (process.argv[2] === "gate") {
      evaluateGate(policy, JSON.parse(process.env.NEEDS_JSON));
    } else if (process.argv[2] === "classify") {
      // Full push/manual CI remains independently admissible as release evidence.
      let paths = [];
      if (
        process.env.GITHUB_EVENT_NAME === "pull_request" &&
        process.env.GITHUB_BASE_REF === "development"
      ) {
        try {
          paths = diffPaths(process.env.BASE_SHA, process.env.HEAD_SHA);
        } catch {
          console.error("Diff unavailable; selecting all validation jobs");
        }
      }
      const selection = selectEvent(
        policy,
        process.env.GITHUB_EVENT_NAME,
        process.env.GITHUB_BASE_REF,
        Boolean(process.env.PROMOTION_PR),
        paths,
      );
      const output = `selection=${JSON.stringify(selection)}\n`;
      if (process.env.GITHUB_OUTPUT)
        appendFileSync(process.env.GITHUB_OUTPUT, output);
      process.stdout.write(output);
    } else throw new Error("Expected classify or gate");
  } catch {
    console.error("CI selection/gate validation failed");
    process.exitCode = 1;
  }
}
