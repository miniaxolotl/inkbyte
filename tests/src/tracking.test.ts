import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveVisitor,
  visitorCookieHeader,
} from "../../packages/api/src/tracking.ts";
import * as tracking from "../../packages/api/src/tracking.ts";

const secret = "test-tracking-secret-with-at-least-32-characters";

test("new visitors sharing a network do not share an identity", () => {
  const request = new Request("https://inkbyte.app/r/demo");
  assert.notEqual(
    resolveVisitor(request, secret).visitorId,
    resolveVisitor(request, secret).visitorId,
  );
});

test("only a signed visitor cookie is reused", () => {
  const first = resolveVisitor(
    new Request("https://inkbyte.app/r/demo"),
    secret,
  );
  const cookie = visitorCookieHeader(first.visitorId, true, secret).split(
    ";",
  )[0]!;
  const repeated = resolveVisitor(
    new Request("https://inkbyte.app/r/demo", { headers: { cookie } }),
    secret,
  );
  assert.equal(repeated.visitorId, first.visitorId);
  assert.match(cookie, /\./);
  const forged = resolveVisitor(
    new Request("https://inkbyte.app/r/demo", {
      headers: { cookie: "inkbyte_vid=attacker-chosen-visitor-value" },
    }),
    secret,
  );
  assert.notEqual(forged.visitorId, "attacker-chosen-visitor-value");
});

test("referrer tracking never stores private paths, credentials or query strings", () => {
  assert.equal(
    tracking.referrerOrigin(
      "https://person:secret@www.google.com/search?q=private",
    ),
    "https://www.google.com",
  );
  assert.equal(tracking.referrerOrigin("javascript:alert(1)"), null);
});
