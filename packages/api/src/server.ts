import { serve } from "@hono/node-server";
import type { Server } from "node:http";
import { pathToFileURL } from "node:url";
import { closeDatabase, createDatabase, probeDatabase } from "@lib/database";
import { readServerEnvironment } from "@lib/config";
import { createApp } from "./app.ts";
import { clerkVerifier } from "./auth.ts";

export async function startServer() {
  const env = readServerEnvironment();
  const db = createDatabase(env.DATABASE_URL, {
    ssl: env.DATABASE_SSL === "require",
    max: env.DATABASE_POOL_MAX,
    acquireTimeoutMs: env.DATABASE_ACQUIRE_TIMEOUT_MS,
    statementTimeoutMs: env.DATABASE_STATEMENT_TIMEOUT_MS,
  });

  const app = createApp({
    db,
    auth: clerkVerifier(env),
    origin: env.API_ORIGIN,
    siteUrl: env.SITE_URL,
    defaultDomains: env.DEFAULT_DOMAINS,
    ready: async () => {
      await probeDatabase(db);
    },
  });

  const server = serve({
    fetch: app.fetch,
    port: env.PORT,
    hostname: "0.0.0.0",
  }) as Server;
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  console.error(JSON.stringify({ status: "listening", port: env.PORT }));

  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeIdleConnections();
    });
    await closeDatabase(db);
  };

  process.once("SIGTERM", () => void close());
  process.once("SIGINT", () => void close());

  return { server, close };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await startServer();
}
