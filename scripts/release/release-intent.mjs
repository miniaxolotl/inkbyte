import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import console from "node:console";
import { pathToFileURL } from "node:url";

const plainVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function assertReleaseIntent(messages, currentVersion) {
  assert.match(currentVersion, plainVersion);
  assert.ok(
    Array.isArray(messages) &&
      messages.every((message) => typeof message === "string"),
  );
  const text = messages.join("\n\n").replaceAll("\r\n", "\n");
  const versions = [...text.matchAll(/^Release-As:[ \t]*(.*)$/gim)].map(
    (match) => match[1].trim(),
  );
  for (const version of versions)
    assert.match(
      version,
      plainVersion,
      "Use one plain Release-As: X.Y.Z decision",
    );
  assert.ok(
    new Set(versions).size <= 1,
    "Conflicting Release-As decisions require reconciliation",
  );
  const selected = versions[0] ?? null;
  if (/^[a-z]+(?:\([^\n)]+\))?!:[ \t]+|^BREAKING[ -]CHANGE:[ \t]*/im.test(text))
    assert.ok(
      selected,
      "Breaking changes require an explicit Release-As version decision",
    );
  if (selected) {
    const before = currentVersion.split(".").map(BigInt);
    const after = selected.split(".").map(BigInt);
    const index = after.findIndex((value, i) => value !== before[i]);
    assert.ok(
      index >= 0 && after[index] > before[index],
      "Release-As must advance the released version",
    );
  }
  return selected;
}

export function assertManifestVersion(released, manifest, selected) {
  assert.match(released, plainVersion);
  assert.match(manifest, plainVersion);
  if (manifest === released) return;
  if (selected) {
    assert.equal(
      manifest,
      selected,
      "Merged version differs from explicit Release-As decision",
    );
    return;
  }
  const before = released.split(".").map(BigInt);
  const after = manifest.split(".").map(BigInt);
  assert.ok(
    after[0] === before[0] &&
      after[1] === before[1] &&
      after[2] === before[2] + 1n,
    "Merged release version requires an explicit Release-As decision",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const git = (...args) =>
      execFileSync("git", args, {
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 16 * 1024 * 1024,
      });
    const tag = git(
      "tag",
      "--merged",
      "HEAD",
      "--list",
      "v*",
      "--sort=-version:refname",
    )
      .trim()
      .split("\n")
      .find((value) => plainVersion.test(value.slice(1)));
    const config = JSON.parse(
      readFileSync("release-please-config.json", "utf8"),
    );
    const base = tag ?? config["bootstrap-sha"];
    assert.ok(
      base && (tag || /^[a-f0-9]{40}$/.test(base)),
      "Release history or an explicit bootstrap boundary is required",
    );
    const messages = git(
      "log",
      "--first-parent",
      "--format=%B%x00",
      `${base}..HEAD`,
    )
      .split("\0")
      .filter(Boolean);
    const selected = assertReleaseIntent(
      messages,
      tag ? tag.slice(1) : "0.0.0",
    );
    if (tag) {
      const manifest = JSON.parse(
        readFileSync(".release-please-manifest.json", "utf8"),
      )["."];
      assert.equal(
        manifest,
        JSON.parse(readFileSync("package.json", "utf8")).version,
        "Root version ledger mismatch",
      );
      assertManifestVersion(tag.slice(1), manifest, selected);
    }
    console.log(
      "Patch-first release intent verified; explicit version decisions are consistent.",
    );
  } catch {
    console.error(
      "Release intent blocked: review breaking changes and supply one higher plain Release-As version; verify full tag history.",
    );
    process.exitCode = 1;
  }
}
