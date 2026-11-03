import { execFileSync } from "node:child_process";
import console from "node:console";
import process from "node:process";
import { setTimeout } from "node:timers";
import {
  appendFileSync,
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, URL } from "node:url";
import { readGitHubJson } from "../ci/github-json.mjs";

const tagPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const hashPattern = /^[a-f0-9]{40}$/;
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message);
};

export function promotionTag(policy, pr) {
  requireThat(
    policy.branches.slice(1).includes(pr.base.ref),
    "Invalid promotion target",
  );
  requireThat(
    pr.head.repo?.full_name === policy.repository,
    "Foreign promotion repository",
  );
  const prefix = `promote/${pr.base.ref}/`;
  const tag = pr.head.ref.slice(prefix.length);
  requireThat(
    pr.head.ref.startsWith(prefix) && tagPattern.test(tag),
    "A frozen release ref is required",
  );
  return tag;
}

export function assertCandidate(policy, candidate, tree) {
  requireThat(
    tagPattern.test(candidate.tag) &&
      hashPattern.test(candidate.sha) &&
      hashPattern.test(candidate.tree),
    "Invalid release identity",
  );
  requireThat(
    candidate.tree === tree,
    "Promotion tree differs from the released tree",
  );
  requireThat(
    candidate.version === candidate.tag.slice(1) &&
      candidate.manifestVersion === candidate.version,
    "Release version mismatch",
  );
  requireThat(
    candidate.release?.tag_name === candidate.tag &&
      candidate.release.draft === false,
    "Published source release required",
  );
  const pr = candidate.releasePr;
  requireThat(
    pr?.merged_at &&
      pr.merge_commit_sha === candidate.sha &&
      pr.base?.ref === "development" &&
      pr.base.repo?.full_name === policy.repository &&
      pr.head?.repo?.full_name === policy.repository &&
      pr.labels?.some((label) => /^autorelease:\s*tagged$/.test(label.name)),
    "Release Please provenance is missing or mismatched",
  );
}

export function assertCi(run, jobs, { repository, sha, required, exclude }) {
  return (
    run.path === ".github/workflows/ci.yml" &&
    Number.isSafeInteger(run.run_attempt) &&
    run.run_attempt > 0 &&
    run.id !== Number(exclude) &&
    run.head_sha === sha &&
    run.head_repository?.full_name === repository &&
    ["push", "workflow_dispatch"].includes(run.event) &&
    run.status === "completed" &&
    run.conclusion === "success" &&
    required.every((name) => {
      const matching = jobs.filter((job) => job.name === name);
      return (
        matching.length === 1 &&
        matching[0].run_id === run.id &&
        matching[0].run_attempt === run.run_attempt &&
        matching[0].head_sha === sha &&
        matching[0].status === "completed" &&
        matching[0].conclusion === "success"
      );
    })
  );
}

function git(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function api(endpoint, body) {
  if (!body) return readGitHubJson(endpoint);
  const args = ["api", endpoint];
  if (body) args.push("--method", "POST", "--input", "-");
  return JSON.parse(
    execFileSync("gh", args, {
      encoding: "utf8",
      input: body ? JSON.stringify(body) : undefined,
      stdio: ["pipe", "pipe", "pipe"],
    }),
  );
}

export function assertSelection(policy, pr, candidate, run, record) {
  requireThat(
    run.event === "workflow_dispatch" &&
      run.head_branch === "development" &&
      run.head_repository?.full_name === policy.repository &&
      run.path === ".github/workflows/promote.yml" &&
      run.actor?.login === policy.operator &&
      run.triggering_actor?.login === policy.operator,
    "Unauthorized selection workflow",
  );
  requireThat(
    record.repository === policy.repository &&
      record.run === run.id &&
      record.tooling === run.head_sha &&
      record.pr === pr.number &&
      record.head === pr.head.sha &&
      record.target === pr.base.ref &&
      record.tag === candidate.tag &&
      record.sha === candidate.sha &&
      record.tree === candidate.tree,
    "Frozen selection evidence mismatch",
  );
}

function authorizePromotion(policy, pr, candidate) {
  if (pr.user.login === policy.operator) return;
  requireThat(
    pr.user.login === "github-actions[bot]" && pr.user.type === "Bot",
    "Unauthorized promotion author",
  );
  const match = pr.body?.match(/<!-- release-selection:(\d+) -->/);
  requireThat(match, "Selection workflow evidence required");
  const run = api(`repos/${policy.repository}/actions/runs/${match[1]}`);
  const artifacts = pages(
    `repos/${policy.repository}/actions/runs/${run.id}/artifacts`,
    "artifacts",
  ).filter(
    (artifact) =>
      /^selected-candidate-\d+$/.test(artifact.name) && !artifact.expired,
  );
  requireThat(
    artifacts.length > 0,
    "Selection evidence is missing or expired; rerun the original selection workflow",
  );
  const temporary = mkdtempSync(join(tmpdir(), "release-selection-"));
  try {
    const artifact = artifacts.sort((a, b) => b.id - a.id)[0];
    execFileSync(
      "gh",
      [
        "run",
        "download",
        String(run.id),
        "--repo",
        policy.repository,
        "--name",
        artifact.name,
        "--dir",
        temporary,
      ],
      { stdio: "pipe" },
    );
    const record = JSON.parse(
      readFileSync(join(temporary, "selection.json"), "utf8"),
    );
    assertSelection(policy, pr, candidate, run, record);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function recordSelection(policy, candidate, pr) {
  writeFileSync(
    "selection.json",
    JSON.stringify(
      {
        repository: policy.repository,
        run: Number(process.env.GITHUB_RUN_ID),
        tooling: git("rev-parse", "HEAD"),
        pr: pr.number,
        head: pr.head.sha,
        target: pr.base.ref,
        tag: candidate.tag,
        sha: candidate.sha,
        tree: candidate.tree,
        sourceCiRun: candidate.ciRun,
      },
      null,
      2,
    ) + "\n",
  );
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `pr=${pr.number}\nbranch=${pr.head.ref}\n`,
    );
}

function pages(endpoint, key) {
  const result = [];
  for (let page = 1; ; page++) {
    const response = api(
      `${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
    );
    const items = key ? response[key] : response;
    requireThat(Array.isArray(items), "Invalid GitHub collection");
    result.push(...items);
    if (items.length < 100) return result;
  }
}

export function verifyCi(policy, sha) {
  if (policy.ciVerifier) {
    execFileSync(
      "bash",
      [
        policy.ciVerifier,
        "--repository",
        policy.repository,
        "--sha",
        sha,
        ...(process.env.GITHUB_RUN_ID
          ? ["--exclude-run-id", process.env.GITHUB_RUN_ID]
          : []),
      ],
      { stdio: "inherit" },
    );
    return;
  }
  const runs = pages(
    `repos/${policy.repository}/actions/workflows/ci.yml/runs?head_sha=${sha}`,
    "workflow_runs",
  );
  for (const run of runs) {
    if (
      !["push", "workflow_dispatch"].includes(run.event) ||
      run.conclusion !== "success"
    )
      continue;
    const jobs = pages(
      `repos/${policy.repository}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs`,
      "jobs",
    );
    if (
      assertCi(run, jobs, {
        repository: policy.repository,
        sha,
        required: policy.ciJobs,
        exclude: process.env.GITHUB_RUN_ID,
      })
    )
      return run.id;
  }
  throw new Error(`Complete independent CI is required for ${sha}`);
}

export function resolveCandidate(policy, tag, tree) {
  requireThat(tagPattern.test(tag), "Select a plain immutable vX.Y.Z tag");
  const sha = git("rev-parse", `refs/tags/${tag}^{commit}`);
  const sourceTree = git("rev-parse", `${sha}^{tree}`);
  const release = api(`repos/${policy.repository}/releases/tags/${tag}`);
  const prs = pages(`repos/${policy.repository}/commits/${sha}/pulls`);
  const candidate = {
    tag,
    sha,
    tree: sourceTree,
    release,
    version: JSON.parse(git("show", `${sha}:package.json`)).version,
    manifestVersion: JSON.parse(
      git("show", `${sha}:.release-please-manifest.json`),
    )["."],
    releasePr: prs.find(
      (pr) =>
        pr.merge_commit_sha === sha &&
        pr.labels.some((label) => /^autorelease:\s*tagged$/.test(label.name)),
    ),
  };
  assertCandidate(policy, candidate, tree ?? sourceTree);
  git("merge-base", "--is-ancestor", sha, "origin/development");
  candidate.ciRun = verifyCi(policy, sha);
  return candidate;
}

function assertUpstream(policy, candidate, target) {
  const upstream = policy.branches[policy.branches.indexOf(target) - 1];
  requireThat(upstream, "Invalid target branch");
  git("merge-base", "--is-ancestor", candidate.sha, `origin/${upstream}`);
  if (upstream !== "development") {
    const prs = pages(
      `repos/${policy.repository}/pulls?state=closed&base=${upstream}&head=${policy.repository.split("/")[0]}:promote/${upstream}/${candidate.tag}`,
    );
    const accepted = prs.find((pr) => pr.merged_at);
    requireThat(
      accepted &&
        git("rev-parse", `${accepted.merge_commit_sha}^{tree}`) ===
          candidate.tree,
      "The exact candidate must first be merged through the upstream promotion PR",
    );
    authorizePromotion(policy, accepted, candidate);
  }
}

export function admitPromotion(policy, pr, mergeSha) {
  const tag = promotionTag(policy, pr);
  const candidate = resolveCandidate(
    policy,
    tag,
    git("rev-parse", `${mergeSha}^{tree}`),
  );
  authorizePromotion(policy, pr, candidate);
  requireThat(
    git("rev-parse", `${pr.head.sha}^{tree}`) === candidate.tree,
    "Frozen head tree mismatch",
  );
  git("merge-base", "--is-ancestor", candidate.sha, pr.head.sha);
  assertUpstream(policy, candidate, pr.base.ref);
  return candidate;
}

export function productionCandidate(policy, sha) {
  requireThat(hashPattern.test(sha), "Expected a full production commit SHA");
  const tip = api(`repos/${policy.repository}/git/ref/heads/production`).object
    .sha;
  requireThat(
    tip === sha,
    "Refusing stale production deployment; select the current production commit",
  );
  const prs = pages(`repos/${policy.repository}/commits/${sha}/pulls`);
  const pr = prs.find(
    (item) =>
      item.merged_at &&
      item.base.ref === "production" &&
      item.merge_commit_sha === sha,
  );
  requireThat(pr, "A merged protected production promotion is required");
  const candidate = admitPromotion(policy, pr, sha);
  verifyCi(policy, sha);
  return candidate;
}

function output(candidate) {
  const values = Object.fromEntries(
    ["tag", "sha", "tree", "version"].map((key) => [key, candidate[key]]),
  );
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      Object.entries(values)
        .map(([k, v]) => `${k}=${v}\n`)
        .join(""),
    );
  console.log(JSON.stringify(values));
}

function openPromotion(policy, tag, target) {
  requireThat(
    process.env.GITHUB_ACTIONS === "true"
      ? process.env.GITHUB_REF === "refs/heads/development" &&
          process.env.GITHUB_ACTOR === policy.operator &&
          process.env.GITHUB_TRIGGERING_ACTOR === policy.operator
      : api("user").login === policy.operator,
    "Only the release operator can select a candidate",
  );
  requireThat(
    policy.branches.slice(1).includes(target),
    "Invalid target branch",
  );
  const candidate = resolveCandidate(policy, tag);
  assertUpstream(policy, candidate, target);
  const base = api(`repos/${policy.repository}/git/ref/heads/${target}`).object
    .sha;
  const upstream = policy.branches[policy.branches.indexOf(target) - 1];
  const parent =
    upstream === "development"
      ? candidate.sha
      : api(`repos/${policy.repository}/git/ref/heads/${upstream}`).object.sha;
  requireThat(
    git("rev-parse", `${parent}^{tree}`) === candidate.tree,
    "Upstream has advanced; explicitly select its new candidate",
  );
  requireThat(
    git("merge-tree", "--write-tree", base, parent) === candidate.tree,
    "Target contains divergent changes; reconcile them into a new release",
  );
  const branch = `promote/${target}/${tag}`;
  const existing = pages(
    `repos/${policy.repository}/pulls?state=all&base=${target}&head=${policy.repository.split("/")[0]}:${branch}`,
  );
  if (existing.length) {
    requireThat(
      existing.length === 1 &&
        (existing[0].state === "open" || existing[0].merged_at),
      "Candidate was rejected; select a new release",
    );
    requireThat(
      git("rev-parse", `${existing[0].head.sha}^{tree}`) === candidate.tree,
      "Frozen ref drift",
    );
    console.log(existing[0].html_url);
    recordSelection(policy, candidate, existing[0]);
    return;
  }
  const commit = api(`repos/${policy.repository}/git/commits`, {
    message: `chore(release): freeze ${tag} for ${target}\n\nSource: ${candidate.sha}\nTree: ${candidate.tree}`,
    tree: candidate.tree,
    parents: [...new Set([base, parent])],
  });
  // A concurrent or interrupted creation never rewrites the frozen ref. If a
  // ref already exists, inspect it and reuse it only when both parents agree.
  const refs = api(
    `repos/${policy.repository}/git/matching-refs/heads/${branch}`,
  );
  if (refs.some((ref) => ref.ref === `refs/heads/${branch}`)) {
    const ref = refs.find((item) => item.ref === `refs/heads/${branch}`);
    const retained = api(
      `repos/${policy.repository}/git/commits/${ref.object.sha}`,
    );
    requireThat(
      retained.tree.sha === candidate.tree &&
        JSON.stringify(retained.parents.map((p) => p.sha)) ===
          JSON.stringify([...new Set([base, parent])]),
      "Interrupted candidate conflicts with current selection",
    );
  } else
    api(`repos/${policy.repository}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: commit.sha,
    });
  requireThat(
    api(`repos/${policy.repository}/git/ref/heads/${target}`).object.sha ===
      base,
    "Target advanced during selection; revalidate explicitly",
  );
  const pr = api(`repos/${policy.repository}/pulls`, {
    title: `chore(release): promote ${tag} to ${target}`,
    base: target,
    head: branch,
    body: `## Frozen release\n\n- Tag: \`${tag}\`\n- Source: \`${candidate.sha}\`\n- Tree: \`${candidate.tree}\`\n- Upstream: \`${upstream}\` at \`${parent}\`\n- Tooling: \`${git("rev-parse", "HEAD")}\`\n\nIndependent source CI and protected promotion admission are required. Merge with a merge commit to preserve source ancestry.\n\n<!-- release-selection:${process.env.GITHUB_RUN_ID ?? "local"} -->`,
  });
  api(`repos/${policy.repository}/issues/${pr.number}/assignees`, {
    assignees: [policy.operator],
  });
  api(`repos/${policy.repository}/issues/${pr.number}/labels`, {
    labels: [policy.label],
  });
  console.log(pr.html_url);
  recordSelection(policy, candidate, pr);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const policy = JSON.parse(
      readFileSync(new URL("./policy.json", import.meta.url), "utf8"),
    );
    const [command, first, second] = process.argv.slice(2);
    requireThat(
      !process.env.GITHUB_REPOSITORY ||
        process.env.GITHUB_REPOSITORY === policy.repository,
      "Unexpected workflow repository",
    );
    if (command === "admit") {
      const event = JSON.parse(
        readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"),
      );
      let pr = event.pull_request;
      if (event.inputs?.promotion_pr) {
        requireThat(
          /^\d+$/.test(event.inputs.promotion_pr),
          "Invalid promotion PR number",
        );
        pr = api(
          `repos/${policy.repository}/pulls/${event.inputs.promotion_pr}`,
        );
        requireThat(
          policy.branches.slice(1).includes(pr.base.ref) &&
            pr.head.ref === process.env.GITHUB_REF_NAME &&
            pr.head.sha === git("rev-parse", "HEAD"),
          "Dispatched candidate drift",
        );
      }
      if (!pr && process.env.GITHUB_REF_NAME?.startsWith("promote/"))
        throw new Error("Promotion CI requires its PR number");
      if (pr && pr.base.ref !== "development")
        output(admitPromotion(policy, pr, git("rev-parse", "HEAD")));
    } else if (command === "production")
      output(productionCandidate(policy, first));
    else if (command === "wait-ci") {
      requireThat(hashPattern.test(first), "Expected a full CI commit SHA");
      const deadline = Date.now() + 45 * 60_000;
      for (;;) {
        try {
          verifyCi(policy, first);
          break;
        } catch (error) {
          if (Date.now() >= deadline) throw error;
          await new Promise((resolve) => setTimeout(resolve, 20_000));
        }
      }
    } else if (command === "resolve")
      output(resolveCandidate(policy, first, second));
    else if (command === "open") openPromotion(policy, first, second);
    else
      throw new Error(
        "Usage: promotion.mjs admit | production <SHA> | resolve <tag> [tree] | open <tag> <target>",
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
