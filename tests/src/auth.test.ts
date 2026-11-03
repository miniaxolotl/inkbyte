import assert from "node:assert/strict";
import { test } from "node:test";
import { validateSessionClaims } from "../../packages/api/src/auth.ts";

const claims = {
  sub: "user_fixture",
  sid: "sess_fixture",
  azp: "https://inkbyte.ca",
  iat: Math.floor(Date.now() / 1000),
};
test("session tokens are bound to this website", () => {
  assert.throws(() =>
    validateSessionClaims(
      { ...claims, azp: "https://another.example" },
      "https://inkbyte.ca",
    ),
  );
});
test("pending and non-session identities cannot access links", () => {
  assert.throws(() =>
    validateSessionClaims({ ...claims, sts: "pending" }, "https://inkbyte.ca"),
  );
  assert.throws(() =>
    validateSessionClaims({ ...claims, sid: undefined }, "https://inkbyte.ca"),
  );
});
