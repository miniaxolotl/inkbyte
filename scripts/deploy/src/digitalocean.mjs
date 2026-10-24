import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import console from "node:console";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { setTimeout } from "node:timers/promises";
import { pathToFileURL, URL } from "node:url";
import { parseArgs } from "node:util";

const { AbortSignal, fetch, structuredClone } = globalThis;

const template = JSON.parse(
  await readFile(new URL("../../.do/app.json", import.meta.url), "utf8"),
);

function imageDigest(value) {
  assert.match(
    value ?? "",
    /^sha256:[a-f0-9]{64}$/,
    "A SHA-256 image digest is required",
  );
  return value;
}

function required(env, key) {
  assert(env[key]?.trim(), `Missing ${key}`);
  return env[key].trim();
}

function httpsOrigin(value) {
  const url = new URL(value);
  assert(
    url.protocol === "https:" && url.origin === value,
    "Use an exact HTTPS origin without a trailing slash",
  );
  return url;
}

/** Initial provisioning only. Migration-owner credentials are deliberately absent. */
export function createAppSpec(env) {
  const spec = structuredClone(template);
  const apiOrigin = required(env, "API_ORIGIN");
  const siteUrl = required(env, "SITE_URL");
  const issuer = required(env, "CLERK_ISSUER");
  spec.domains[0].domain = httpsOrigin(apiOrigin).hostname;
  httpsOrigin(siteUrl);
  httpsOrigin(issuer);

  const secrets = Object.fromEntries(
    ["CLERK_SECRET_KEY", "DATABASE_URL"].map((key) => [
      key,
      required(env, key),
    ]),
  );
  assert.match(
    secrets.CLERK_SECRET_KEY,
    /^sk_live_/,
    "Use a production Clerk secret key",
  );
  const publishableKey = required(env, "CLERK_PUBLISHABLE_KEY");
  assert.match(publishableKey, /^pk_live_/);
  const clerkHost = Buffer.from(publishableKey.slice(8), "base64")
    .toString("utf8")
    .replace(/\$$/, "");
  assert.equal(`https://${clerkHost}`, issuer, "Clerk key and issuer disagree");

  const database = new URL(secrets.DATABASE_URL);
  assert(["postgres:", "postgresql:"].includes(database.protocol));
  assert(database.password, "Database password is missing");
  assert(
    ["require", "verify-full"].includes(database.searchParams.get("sslmode")),
    "Neon requires sslmode=require or verify-full",
  );

  const general = {
    NODE_ENV: "production",
    DATABASE_SSL: "require",
    API_ORIGIN: apiOrigin,
    SITE_URL: siteUrl,
    CLERK_ISSUER: issuer,
    CLERK_PUBLISHABLE_KEY: publishableKey,
    DEFAULT_DOMAINS: env.DEFAULT_DOMAINS ?? "inkbyte.app,inkbyte.co",
  };

  const service = spec.services[0];
  service.envs = [
    ...Object.entries(general).map(([key, value]) => ({
      key,
      value,
      scope: "RUN_TIME",
      type: "GENERAL",
    })),
    ...Object.entries(secrets).map(([key, value]) => ({
      key,
      value,
      scope: "RUN_TIME",
      type: "SECRET",
    })),
  ];
  if (env.INKBYTE_IMAGE_DIGEST)
    service.image.digest = imageDigest(env.INKBYTE_IMAGE_DIGEST);
  return spec;
}

/** Rollouts preserve the provider's encrypted secrets, DNS and operator settings. */
export function updateImageSpec(current, digest) {
  imageDigest(digest);
  assert.equal(
    current.name,
    "inkbyte",
    "Refusing to update a different application",
  );
  const spec = structuredClone(current);
  const component = spec.services?.find((item) => item.name === "api");
  assert(component, "Missing InkByte api component");
  assert.equal(component.image?.registry_type, "GHCR");
  assert.equal(component.image.registry, "miniaxolotl");
  assert.equal(component.image.repository, "inkbyte-api");
  delete component.image.tag;
  delete component.image.deploy_on_push;
  component.image.digest = digest;
  return spec;
}

export function findDeployment(deployments, digest, previousIds = []) {
  return deployments.find(
    (item) =>
      item &&
      !previousIds.includes(item.id) &&
      item.spec?.services?.find((part) => part.name === "api")?.image
        ?.digest === digest,
  );
}

async function main() {
  const { values } = parseArgs({
    options: {
      create: { type: "boolean" },
      propose: { type: "boolean" },
      wait: { type: "boolean" },
      "app-id": { type: "string" },
      digest: { type: "string" },
    },
  });
  const token = required(process.env, "DIGITALOCEAN_ACCESS_TOKEN");
  const appId = values["app-id"] ?? process.env.DIGITALOCEAN_APP_ID;
  assert(
    !(values.create && appId),
    "Creation does not accept an existing app ID",
  );
  assert(!(values.create && values.propose), "Choose either create or propose");

  async function request(path, body, method = body ? "POST" : "GET") {
    const response = await fetch(`https://api.digitalocean.com/v2${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(60000),
    });
    const data = await response.json();
    // Provider errors can echo submitted settings; never log request/response bodies.
    assert(
      response.ok,
      `DigitalOcean ${method} ${path} failed (HTTP ${response.status}, ${data.id ?? "unknown"})`,
    );
    return data;
  }

  let spec;
  let previousIds = [];
  if (appId) {
    assert.match(appId, /^[0-9a-f-]{36}$/, "Invalid DigitalOcean app ID");
    const { app } = await request(`/apps/${appId}`);
    previousIds = [
      app.active_deployment?.id,
      app.in_progress_deployment?.id,
    ].filter(Boolean);
    spec = updateImageSpec(
      app.spec,
      values.digest ?? process.env.INKBYTE_IMAGE_DIGEST,
    );
  } else {
    assert(
      values.create || values.propose,
      "Use --create, --propose, or --app-id",
    );
    spec = createAppSpec({
      ...process.env,
      ...(values.digest ? { INKBYTE_IMAGE_DIGEST: values.digest } : {}),
    });
  }
  const proposal = await request("/apps/propose", {
    spec,
    ...(appId ? { app_id: appId } : {}),
  });
  console.log(
    JSON.stringify({
      action: "validated",
      app: spec.name,
      region: spec.region,
      digest: spec.services.find((item) => item.name === "api").image.digest,
      cost: proposal.app_cost,
    }),
  );
  if (values.propose) return;

  const { app } = appId
    ? await request(`/apps/${appId}`, { spec }, "PUT")
    : await request("/apps", { spec });
  const digest = spec.services.find((item) => item.name === "api").image.digest;
  let deployment = findDeployment(
    [app.in_progress_deployment],
    digest,
    previousIds,
  );
  console.log(
    JSON.stringify({
      action: appId ? "updated" : "created",
      appId: app.id,
      deploymentId: deployment?.id,
      defaultIngress: app.default_ingress,
      liveUrl: app.live_url,
    }),
  );
  if (!values.wait) return;
  const deadline = Date.now() + 30 * 60 * 1000;
  let previousPhase;
  while (Date.now() < deadline) {
    // Creation can return before the deployment exists. Never mistake an older
    // active deployment for the new image's successful rollout.
    if (!deployment) {
      const { deployments } = await request(
        `/apps/${app.id}/deployments?per_page=5`,
      );
      deployment = findDeployment(deployments, digest, previousIds);
      if (!deployment) {
        await setTimeout(10000);
        continue;
      }
    }
    ({ deployment } = await request(
      `/apps/${app.id}/deployments/${deployment.id}`,
    ));
    if (deployment.phase !== previousPhase) {
      console.log(
        JSON.stringify({
          deploymentId: deployment.id,
          phase: deployment.phase,
        }),
      );
      previousPhase = deployment.phase;
    }
    if (deployment.phase === "ACTIVE") return;
    assert(
      !["ERROR", "CANCELED", "SUPERSEDED"].includes(deployment.phase),
      `Deployment ended with ${deployment.phase}`,
    );
    await setTimeout(10000);
  }
  throw new Error("Deployment did not become active within 30 minutes");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
