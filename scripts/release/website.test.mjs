import assert from "node:assert/strict";
import { test } from "node:test";
import { deployWebsite } from "./website.mjs";

const env = {
  VERCEL_TOKEN: "fixture",
  VERCEL_ORG_ID: "team_fixture",
  VERCEL_PROJECT_ID: "prj_fixture",
  RELEASE_SOURCE_SHA: "a".repeat(40),
  GITHUB_SHA: "b".repeat(40),
};
const response = (body) => ({ ok: true, json: async () => body });
test("prebuilt website delivery verifies exact project, admitted source and live identity", async () => {
  let identity;
  const calls = [];
  const deployment = {
    projectId: env.VERCEL_PROJECT_ID,
    readyState: "READY",
    target: "production",
    meta: {
      releaseSourceSha: env.RELEASE_SOURCE_SHA,
      githubCommitSha: env.GITHUB_SHA,
    },
  };
  const dependencies = {
    version: "0.2.1",
    run: (args) => {
      calls.push(args[0]);
      if (args[0] === "deploy") return "https://fixture.vercel.app\n";
    },
    writeIdentity: (value) => {
      identity = value;
    },
    assertCurrent: () => calls.push("current"),
    fetch: async (url) =>
      response(url.includes("api.vercel.com") ? deployment : identity),
  };
  await deployWebsite(env, dependencies);
  assert.ok(
    identity,
    "delivery must write a public source identity before building",
  );
  assert.equal(identity.repository, "miniaxolotl/inkbyte");
  assert.equal(identity.sourceSha, env.RELEASE_SOURCE_SHA);
  assert.equal(identity.productionSha, env.GITHUB_SHA);
  assert.deepEqual(calls, [
    "current",
    "pull",
    "build",
    "current",
    "deploy",
    "current",
  ]);
  for (const change of [
    { projectId: "prj_other" },
    { readyState: "ERROR" },
    { target: "preview" },
    { meta: { ...deployment.meta, releaseSourceSha: "c".repeat(40) } },
  ])
    await assert.rejects(
      deployWebsite(env, {
        ...dependencies,
        fetch: async () => response({ ...deployment, ...change }),
      }),
    );
  await assert.rejects(
    deployWebsite(env, {
      ...dependencies,
      fetch: async (url) =>
        response(
          url.includes("api.vercel.com")
            ? deployment
            : { ...identity, productionSha: "c".repeat(40) },
        ),
    }),
    /identity/,
  );
  calls.length = 0;
  await assert.rejects(
    deployWebsite(env, {
      ...dependencies,
      run: (args) => {
        calls.push(args[0]);
        throw new Error("build failed");
      },
    }),
    /build failed/,
  );
  assert.ok(!calls.includes("deploy"));
  calls.length = 0;
  await assert.rejects(
    deployWebsite(env, {
      ...dependencies,
      assertCurrent: () => {
        throw new Error("superseded");
      },
    }),
    /superseded/,
  );
  assert.equal(calls.length, 0);
});
