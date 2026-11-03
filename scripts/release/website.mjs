import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import console from "node:console";
import { pathToFileURL, URL } from "node:url";
import { readGitHubJson } from "../ci/github-json.mjs";

// Same prebuilt/source-identity handoff as Grove's coordinated website delivery.
export async function deployWebsite(
  env,
  { run, fetch = globalThis.fetch, assertCurrent, writeIdentity, version },
) {
  for (const key of ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"])
    assert(env[key]?.trim(), `${key} is required`);
  assert.match(env.VERCEL_ORG_ID, /^team_[\w]+$/);
  assert.match(env.VERCEL_PROJECT_ID, /^prj_[\w]+$/);
  assert.match(
    env.RELEASE_SOURCE_SHA ?? "",
    /^[a-f0-9]{40}$/,
    "Invalid source SHA",
  );
  assert.match(
    env.GITHUB_SHA ?? "",
    /^[a-f0-9]{40}$/,
    "Invalid production SHA",
  );
  assert.match(version, /^\d+\.\d+\.\d+$/);
  const identity = {
    repository: "miniaxolotl/inkbyte",
    version,
    sourceSha: env.RELEASE_SOURCE_SHA,
    productionSha: env.GITHUB_SHA,
  };
  const auth = ["--token", env.VERCEL_TOKEN, "--scope", env.VERCEL_ORG_ID];
  assertCurrent();
  run(["pull", "--yes", "--environment=production", ...auth]);
  writeIdentity(identity);
  run(["build", "--prod", ...auth]);
  assertCurrent();
  const url = new URL(
    run([
      "deploy",
      "--prebuilt",
      "--yes",
      "--prod",
      "--meta",
      `releaseSourceSha=${env.RELEASE_SOURCE_SHA}`,
      "--meta",
      `githubCommitSha=${env.GITHUB_SHA}`,
      ...auth,
    ]).trim(),
  );
  assert(
    url.protocol === "https:" &&
      url.hostname.endsWith(".vercel.app") &&
      !url.username &&
      !url.password,
    "Unexpected Vercel deployment URL",
  );
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${url.hostname}?teamId=${env.VERCEL_ORG_ID}`,
    {
      headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` },
      redirect: "error",
      signal: globalThis.AbortSignal.timeout(30_000),
    },
  );
  assert(response.ok, "Vercel deployment inspection failed");
  const deployment = await response.json();
  assert.equal(
    deployment.projectId,
    env.VERCEL_PROJECT_ID,
    "Deployment project mismatch",
  );
  assert.equal(
    deployment.readyState,
    "READY",
    "Website deployment is not ready",
  );
  assert.equal(deployment.target, "production");
  assert.equal(
    deployment.meta?.releaseSourceSha,
    env.RELEASE_SOURCE_SHA,
    "Deployment source mismatch",
  );
  assert.equal(
    deployment.meta?.githubCommitSha,
    env.GITHUB_SHA,
    "Deployment production mismatch",
  );
  const live = await fetch(
    `https://inkbyte.ca/release.json?sha=${env.GITHUB_SHA}`,
    {
      cache: "no-store",
      redirect: "error",
      signal: globalThis.AbortSignal.timeout(30_000),
    },
  );
  assert(live.ok, "Website release identity is unavailable");
  assert.deepEqual(
    await live.json(),
    identity,
    "Live website identity mismatch",
  );
  const home = await fetch("https://inkbyte.ca", {
    redirect: "error",
    signal: globalThis.AbortSignal.timeout(30_000),
  });
  assert(home.ok, "Website homepage is not healthy");
  assertCurrent();
  return { ...identity, deploymentUrl: url.origin };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const evidence = await deployWebsite(process.env, {
      version: JSON.parse(readFileSync("package.json", "utf8")).version,
      assertCurrent: () => {
        assert.equal(process.env.GITHUB_REPOSITORY, "miniaxolotl/inkbyte");
        assert.equal(process.env.GITHUB_REF, "refs/heads/production");
        assert.equal(process.env.GITHUB_REF_PROTECTED, "true");
        assert.equal(
          readGitHubJson("repos/miniaxolotl/inkbyte/git/ref/heads/production")
            .object.sha,
          process.env.GITHUB_SHA,
          "Superseded production operation",
        );
      },
      writeIdentity: (identity) =>
        writeFileSync(
          "packages/website/public/release.json",
          `${JSON.stringify(identity)}\n`,
        ),
      run: (args) =>
        execFileSync("npx", ["--yes", "vercel@65.2.0", ...args], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "inherit"],
          timeout: 20 * 60_000,
          env: {
            ...process.env,
            VERCEL_GIT_COMMIT_SHA: process.env.RELEASE_SOURCE_SHA,
          },
        }),
    });
    writeFileSync(
      "website-deployment.json",
      `${JSON.stringify(evidence, null, 2)}\n`,
    );
  } catch {
    console.error(
      "Website delivery failed: check production configuration, current ref, build and exact deployment identity.",
    );
    process.exitCode = 1;
  }
}
