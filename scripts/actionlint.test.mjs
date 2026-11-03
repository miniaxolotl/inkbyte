import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import process from "node:process";

test("workflow lint refuses to silently skip missing ShellCheck", () => {
  const directory = mkdtempSync(join(tmpdir(), "inkbyte-actionlint-test-"));
  try {
    for (const name of ["uname", "dirname"]) {
      const executable = execFileSync("/bin/sh", ["-c", `command -v ${name}`], {
        encoding: "utf8",
      }).trim();
      symlinkSync(executable, join(directory, name));
    }
    const result = spawnSync(
      "/bin/bash",
      ["scripts/ci/run-actionlint.sh", "--version"],
      {
        env: { ...process.env, PATH: directory },
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ShellCheck is required/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
