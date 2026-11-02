import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { test } from "node:test";

const workflow = readFileSync(".github/workflows/deploy.yml", "utf8");
const command = workflow
  .split("id: existing\n")[1]
  .split("      - id: api\n")[0]
  .split("run: |\n")[1]
  .split("\n")
  .map((line) => line.slice(10))
  .join("\n");
const sha = "a".repeat(40);
const digest = `sha256:${"b".repeat(64)}`;

function inspect(registry) {
  const directory = mkdtempSync(join(tmpdir(), "inkbyte-images-"));
  try {
    writeFileSync(
      join(directory, "docker"),
      `#!/usr/bin/env node
const args = process.argv.slice(2);
const registry = JSON.parse(process.env.REGISTRY);
if (args[0] === 'inspect') { console.log(registry.revision ?? process.env.RELEASE_SOURCE_SHA); process.exit(0); }
if (args[0] === 'pull') process.exit(0);
if (args.slice(0, 3).join(' ') !== 'buildx imagetools inspect') process.exit(91);
const ref = args[3];
const component = ref.includes('-api:') ? 'api' : 'website';
const kind = ref.includes(':sha-') ? 'source' : 'tag';
const result = registry[component]?.[kind];
if (result) { console.log(result); process.exit(0); }
console.error(registry.error ?? ('ERROR: ' + ref + ': not found')); process.exit(1);
`,
      { mode: 0o700 },
    );
    const output = join(directory, "output");
    writeFileSync(output, "");
    const result = spawnSync("bash", ["-e", "-o", "pipefail", "-c", command], {
      cwd: directory,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        REGISTRY: JSON.stringify(registry),
        RELEASE_SOURCE_SHA: sha,
        RELEASE_TAG: "v0.2.1",
        GITHUB_REPOSITORY: "miniaxolotl/inkbyte",
        GITHUB_OUTPUT: output,
      },
    });
    return { status: result.status, output: readFileSync(output, "utf8") };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("image retries reuse published source digests and allow only missing components to build", () => {
  assert.deepEqual(inspect({}), { status: 0, output: "api=\nwebsite=\n" });
  assert.deepEqual(inspect({ api: { source: digest, tag: digest } }), {
    status: 0,
    output: `api=${digest}\nwebsite=\n`,
  });
  assert.deepEqual(
    inspect({ api: { source: digest }, website: { source: digest } }),
    { status: 0, output: `api=${digest}\nwebsite=${digest}\n` },
  );
});

test("conflicting tags, invalid identity and registry failures stop publication", () => {
  for (const registry of [
    { api: { source: digest, tag: `sha256:${"c".repeat(64)}` } },
    { website: { tag: digest } },
    { api: { source: digest }, revision: "c".repeat(40) },
    { api: { source: "invalid" } },
    { error: "ERROR: unauthorized" },
    { error: "ERROR: credential helper not found" },
    { error: "ERROR: registry host not found" },
  ])
    assert.notEqual(inspect(registry).status, 0, JSON.stringify(registry));
});
