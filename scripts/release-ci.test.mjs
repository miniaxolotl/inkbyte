import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const repository = "miniaxolotl/inkbyte";
const branch = "release-please--branches--development--components--inkbyte";
const pullRequest = () => ({
  number: 2,
  state: "open",
  draft: false,
  user: { login: "github-actions[bot]" },
  base: { ref: "development", repo: { full_name: repository } },
  head: {
    ref: branch,
    sha: "a".repeat(40),
    repo: { full_name: repository },
  },
});

test("source release explicitly dispatches CI for created or updated bot PRs", () => {
  const workflow = readFileSync(".github/workflows/release.yml", "utf8");
  assert.match(workflow, /run: node scripts\/ci\/dispatch-release-ci\.mjs/);
  assert.match(
    workflow,
    /RELEASE_PRS: \$\{\{ steps\.release\.outputs\.prs \}\}/,
  );
  assert.match(workflow, /steps\.release\.outputs\.prs_created == 'true'/);
});

test("release CI dispatch targets the verified same-repository bot branch", async () => {
  const { dispatchReleaseCi } = await import("./ci/dispatch-release-ci.mjs");
  const calls = [];
  const execute = (args) => {
    calls.push(args);
    return args[0] === "api" ? JSON.stringify(pullRequest()) : "";
  };
  assert.deepEqual(
    dispatchReleaseCi(repository, [{ number: 2 }], execute),
    [2],
  );
  assert.deepEqual(calls, [
    ["api", `repos/${repository}/pulls/2`],
    ["workflow", "run", "ci.yml", "--repo", repository, "--ref", branch],
  ]);
});

test("release CI validates every PR before dispatching any workflow", async () => {
  const { dispatchReleaseCi } = await import("./ci/dispatch-release-ci.mjs");
  const calls = [];
  const execute = (args) => {
    calls.push(args);
    const pr = pullRequest();
    if (args.at(-1).endsWith("/3")) {
      pr.number = 3;
      pr.head.repo.full_name = "someone/inkbyte";
    }
    return JSON.stringify(pr);
  };
  assert.throws(() =>
    dispatchReleaseCi(repository, [{ number: 2 }, { number: 3 }], execute),
  );
  assert.ok(calls.every((args) => args[0] === "api"));
});

test("release CI rejects human, draft, closed and non-release PRs", async () => {
  const { dispatchReleaseCi } = await import("./ci/dispatch-release-ci.mjs");
  const mutations = [
    (pr) => {
      pr.user.login = "miniaxolotl";
    },
    (pr) => {
      pr.draft = true;
    },
    (pr) => {
      pr.state = "closed";
    },
    (pr) => {
      pr.base.ref = "production";
    },
    (pr) => {
      pr.head.ref = "feature/change";
    },
    (pr) => {
      pr.head.sha = "invalid";
    },
    (pr) => {
      pr.number = 3;
    },
  ];
  for (const mutate of mutations) {
    const pr = pullRequest();
    mutate(pr);
    const calls = [];
    assert.throws(() =>
      dispatchReleaseCi(repository, [{ number: 2 }], (args) => {
        calls.push(args);
        return JSON.stringify(pr);
      }),
    );
    assert.ok(calls.every((args) => args[0] === "api"));
  }
});

test("release CI rejects malformed output before contacting GitHub", async () => {
  const { dispatchReleaseCi } = await import("./ci/dispatch-release-ci.mjs");
  for (const prs of [null, {}, [{ number: -1 }], [{ number: "2" }]]) {
    let contacted = false;
    assert.throws(() =>
      dispatchReleaseCi(repository, prs, () => {
        contacted = true;
      }),
    );
    assert.equal(contacted, false);
  }
});

test("release CI deduplicates output and refuses another repository", async () => {
  const { dispatchReleaseCi } = await import("./ci/dispatch-release-ci.mjs");
  const calls = [];
  const execute = (args) => {
    calls.push(args);
    return args[0] === "api" ? JSON.stringify(pullRequest()) : "";
  };
  assert.deepEqual(
    dispatchReleaseCi(repository, [{ number: 2 }, { number: 2 }], execute),
    [2],
  );
  assert.equal(calls.length, 2);
  assert.throws(() => dispatchReleaseCi("another/project", [], execute));
  assert.deepEqual(dispatchReleaseCi(repository, [], execute), []);
});
