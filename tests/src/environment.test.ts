import assert from "node:assert/strict";
import { test } from "node:test";
import { readServerEnvironment, readWebsiteEnvironment } from "@lib/config";

const valid = {
  DATABASE_URL: "postgresql://inkbyte:fixture@localhost:5432/inkbyte_test",
  CLERK_SECRET_KEY: "sk_test_fixture",
  CLERK_PUBLISHABLE_KEY: "pk_test_fixture",
  CLERK_ISSUER: "https://clerk.example.com",
  TRACKING_SECRET: "test-only-tracking-secret-with-32-characters",
};
test("database URLs are PostgreSQL connections, not arbitrary strings", () => {
  assert.throws(() =>
    readServerEnvironment({ ...valid, DATABASE_URL: "mysql://localhost/old" }),
  );
});
test("a remote database cannot disable TLS", () => {
  assert.throws(() =>
    readServerEnvironment({
      ...valid,
      DATABASE_URL: "postgresql://inkbyte:fixture@host.neon.tech/db",
      DATABASE_SSL: "disable",
    }),
  );
});
test("short domains cannot contain ports, paths or protocols", () => {
  assert.throws(() =>
    readServerEnvironment({
      ...valid,
      DEFAULT_DOMAINS: "https://inkb.ca/redirect",
    }),
  );
});
test("Clerk publishable keys must agree across website and API", () => {
  assert.throws(() =>
    readServerEnvironment({
      ...valid,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_another_app",
    }),
  );
});
test("partial website authentication configuration fails clearly", () => {
  assert.throws(() =>
    readWebsiteEnvironment({
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture",
    }),
  );
});
test("local runtime defaults use the purchased short domains", () => {
  assert.deepEqual(readServerEnvironment(valid).DEFAULT_DOMAINS, [
    "inkb.ca",
    "inkbyte.ca",
  ]);
});
