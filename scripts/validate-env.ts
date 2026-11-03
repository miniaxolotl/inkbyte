import {
  readServerEnvironment,
  readWebsiteEnvironment,
} from "../lib/config/src/index.ts";

const target = process.argv[2] ?? "all";
if (!["all", "api", "website"].includes(target))
  throw new Error("Choose api, website or all");
let failed = false;
for (const [name, validate] of Object.entries({
  api: readServerEnvironment,
  website: readWebsiteEnvironment,
})) {
  if (target !== "all" && target !== name) continue;
  try {
    validate(process.env);
    console.log(`${name}: environment is valid`);
  } catch (error) {
    failed = true;
    // Never print a ZodError or input values: connection URLs contain passwords.
    const issues =
      (error as { issues?: { path: PropertyKey[]; message: string }[] })
        .issues ?? [];
    console.error(`${name}: environment is incomplete or invalid`);
    for (const issue of issues)
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
}
if (failed) process.exitCode = 1;
