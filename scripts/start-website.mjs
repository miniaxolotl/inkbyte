import { cp, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import process from "node:process";

export function serverEnvironment(args, env) {
  let port = env.PORT ?? "3000";
  let hostname = "0.0.0.0";
  for (let index = 0; index < args.length; index += 2) {
    if (args[index] === "--port") port = args[index + 1];
    else if (args[index] === "--hostname") hostname = args[index + 1];
    else throw new Error("Use --port or --hostname");
  }
  if (!/^\d+$/.test(port ?? "") || Number(port) < 1 || Number(port) > 65535)
    throw new Error("PORT must be 1–65535");
  if (!hostname) throw new Error("A hostname is required");
  return { ...env, PORT: port, HOSTNAME: hostname };
}

async function main() {
  const website = new URL("../packages/website/", import.meta.url);
  const standalone = new URL(".next/standalone/packages/website/", website);
  // Next's standalone output deliberately omits public/static assets.
  await mkdir(new URL(".next/", standalone), { recursive: true });
  await cp(
    new URL(".next/static/", website),
    new URL(".next/static/", standalone),
    { recursive: true },
  );
  await cp(new URL("public/", website), new URL("public/", standalone), {
    recursive: true,
  });
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("server.js", standalone))],
    {
      env: serverEnvironment(process.argv.slice(2), process.env),
      stdio: "inherit",
    },
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.once(signal, () => child.kill(signal));
  child.once("exit", (code) => {
    process.exitCode = code ?? 0;
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
