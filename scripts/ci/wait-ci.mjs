import { execFileSync } from "node:child_process";
import process from "node:process";
import { setTimeout } from "node:timers/promises";

const sha = process.env.GITHUB_SHA;
if (!sha || !process.env.GH_TOKEN)
  throw new Error("GITHUB_SHA and GH_TOKEN are required");
const deadline = Date.now() + 20 * 60 * 1000;
let passed = false;
while (Date.now() < deadline) {
  const runs = JSON.parse(
    execFileSync(
      "gh",
      [
        "run",
        "list",
        "--workflow",
        "ci.yml",
        "--commit",
        sha,
        "--event",
        "push",
        "--json",
        "status,conclusion",
        "--limit",
        "10",
      ],
      { encoding: "utf8" },
    ),
  );
  const run = runs[0];
  if (run?.status === "completed") {
    if (run.conclusion !== "success")
      throw new Error("Exact-source CI did not pass; publication is blocked");
    passed = true;
    break;
  }
  await setTimeout(10000);
}
if (!passed)
  throw new Error("Timed out waiting for independent exact-source CI");
