import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import console from "node:console";
import process from "node:process";
import { pathToFileURL } from "node:url";

const executeGh = (args) => execFileSync("gh", args, { encoding: "utf8" });

/** Bot-created PR events do not trigger Actions; dispatch only verified release refs. */
export function dispatchReleaseCi(repository, created, execute = executeGh) {
  assert.equal(repository, "miniaxolotl/inkbyte");
  assert(Array.isArray(created), "Release PR output must be an array");
  const numbers = [
    ...new Set(
      created.map((pr) => {
        assert(
          Number.isSafeInteger(pr?.number) && pr.number > 0,
          "Invalid release PR number",
        );
        return pr.number;
      }),
    ),
  ];
  const branches = numbers.map((number) => {
    const pr = JSON.parse(
      execute(["api", `repos/${repository}/pulls/${number}`]),
    );
    assert.equal(pr.number, number);
    assert.equal(pr.state, "open");
    assert.equal(pr.draft, false);
    assert.equal(pr.user?.login, "github-actions[bot]");
    assert.equal(pr.base?.ref, "development");
    assert.equal(pr.base?.repo?.full_name, repository);
    assert.equal(pr.head?.repo?.full_name, repository);
    assert.match(
      pr.head.ref,
      /^release-please--branches--development--[a-z0-9-]+$/,
    );
    assert.match(pr.head.sha, /^[a-f0-9]{40}$/);
    return pr.head.ref;
  });
  // Validate the whole batch before granting any branch a workflow run.
  for (const branch of branches) {
    execute([
      "workflow",
      "run",
      "ci.yml",
      "--repo",
      repository,
      "--ref",
      branch,
    ]);
  }
  return numbers;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const numbers = dispatchReleaseCi(
    process.env.GITHUB_REPOSITORY,
    JSON.parse(process.env.RELEASE_PRS ?? "[]"),
  );
  for (const number of numbers)
    console.log(`Dispatched CI for release PR #${number}`);
}
