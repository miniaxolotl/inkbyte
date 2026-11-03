import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertReleaseIntent,
  assertManifestVersion,
} from "./release-intent.mjs";

test("routine changes stay patch-first and higher versions require an explicit merged decision", () => {
  assert.equal(
    assertReleaseIntent(["feat(api): capability", "fix(api): repair"], "0.2.0"),
    null,
  );
  assert.equal(
    assertReleaseIntent(
      ["feat(api)!: incompatible\n\nRelease-As: 1.0.0"],
      "0.2.0",
    ),
    "1.0.0",
  );
  for (const message of [
    "feat(api)!: incompatible",
    "fix: change\n\nBREAKING CHANGE: incompatible",
    "fix: change\n\nBREAKING-CHANGE: incompatible",
  ])
    assert.throws(() => assertReleaseIntent([message], "0.2.0"), /explicit/);
  for (const value of ["0.2.0", "0.1.9", "v1.0.0", "1.0.0-beta.1", "invalid"])
    assert.throws(() =>
      assertReleaseIntent([`chore: decision\n\nRelease-As: ${value}`], "0.2.0"),
    );
  assert.throws(() =>
    assertReleaseIntent(
      ["chore: one\n\nRelease-As: 0.3.0", "chore: two\n\nRelease-As: 1.0.0"],
      "0.2.0",
    ),
  );
  assert.doesNotThrow(() => assertManifestVersion("0.2.0", "0.2.0", null));
  assert.doesNotThrow(() => assertManifestVersion("0.2.0", "0.2.1", null));
  assert.doesNotThrow(() => assertManifestVersion("0.2.0", "1.0.0", "1.0.0"));
  for (const version of ["0.3.0", "1.0.0", "0.2.2", "0.1.9"])
    assert.throws(() => assertManifestVersion("0.2.0", version, null));
});
