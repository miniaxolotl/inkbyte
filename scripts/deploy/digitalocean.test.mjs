import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { URL } from "node:url";
import { test } from "node:test";
import {
  createAppSpec,
  updateImageSpec,
  findDeployment,
} from "./src/digitalocean.mjs";

const digest = `sha256:${"a".repeat(64)}`;
// Never points to a real provider. An ephemeral password exercises validation
// without committing credential-shaped remote URLs for secret scanners.
const database = new URL(
  "postgresql://inkbyte_api@database.invalid/inkbyte?sslmode=verify-full",
);
database.password = randomBytes(24).toString("hex");
const env = {
  API_ORIGIN: "https://api.inkbyte.ca",
  SITE_URL: "https://inkbyte.ca",
  CLERK_ISSUER: "https://clerk.inkbyte.ca",
  CLERK_PUBLISHABLE_KEY: `pk_live_${Buffer.from("clerk.inkbyte.ca$").toString("base64")}`,
  CLERK_SECRET_KEY: "sk_live_fixture_only",
  TRACKING_SECRET: "fixture-tracking-secret-with-32-characters",
  DATABASE_URL: database.toString(),
  INKBYTE_IMAGE_DIGEST: digest,
};

test("the app spec is loaded and includes validated runtime configuration", () => {
  const spec = createAppSpec(env);
  assert.equal(spec.domains[0].domain, "api.inkbyte.ca");
  assert.equal(spec.services[0].image.digest, digest);
  assert.equal(
    spec.services[0].envs.find((v) => v.key === "TRACKING_SECRET").type,
    "SECRET",
  );
  assert.equal(
    spec.services[0].envs.some((v) => v.key === "MIGRATION_DATABASE_URL"),
    false,
  );
});
test("a rollout preserves encrypted secrets and rejects the wrong application", () => {
  const spec = createAppSpec(env);
  spec.services[0].envs.push({
    key: "PRIVATE",
    type: "SECRET",
    value: "EV[encrypted]",
  });
  assert.deepEqual(
    updateImageSpec(spec, digest).services[0].envs,
    spec.services[0].envs,
  );
  assert.throws(() =>
    updateImageSpec({ ...spec, name: "another-product" }, digest),
  );
});
test("a previously active deployment is not accepted as a new rollout", () => {
  const spec = createAppSpec(env);
  assert.equal(
    findDeployment([{ id: "old", spec }], digest, ["old"]),
    undefined,
  );
});
