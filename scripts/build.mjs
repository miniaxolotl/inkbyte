import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import process from "node:process";

process.chdir(fileURLToPath(new URL("..", import.meta.url)));

const targets = {
  api: {
    directory: "packages/api",
    entries: ["server", "migrate", "seed"],
  },
};

const selected = process.argv[2] ? [process.argv[2]] : Object.keys(targets);
for (const name of selected) {
  const target = targets[name];
  if (!target) throw new Error(`Unknown target ${name}`);
  const pkg = JSON.parse(
    await readFile(`${target.directory}/package.json`, "utf8"),
  );
  await build({
    entryPoints: target.entries.map(
      (entry) => `${target.directory}/src/${entry}.ts`,
    ),
    outdir: `${target.directory}/dist`,
    bundle: true,
    platform: "node",
    mainFields: ["module", "main"],
    target: "node24",
    format: "esm",
    sourcemap: true,
    banner: {
      js: 'import { createRequire as __inkbyteCreateRequire } from "node:module"; const require = __inkbyteCreateRequire(import.meta.url);',
    },
    // Runtime dependencies stay external; workspace packages are bundled in.
    external: Object.keys(pkg.dependencies ?? {}).filter(
      (name) => !name.startsWith("@lib/"),
    ),
    logLevel: "info",
  });
}
