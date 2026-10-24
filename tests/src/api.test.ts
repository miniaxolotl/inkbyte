import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import type { Knex } from "knex";
import { createDatabase } from "@lib/database";
import { createApp } from "@miniaxolotl/inkbyte-server";
import type { Principal } from "@miniaxolotl/inkbyte-server";
import { InkbyteError } from "@lib/shared";

const DATABASE_URL = process.env.TEST_DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is required for the API test suite");
}
if (!/_test($|\?)/.test(DATABASE_URL)) {
  throw new Error("TEST_DATABASE_URL must point at a database ending in _test");
}

const env = {
  API_ORIGIN: "http://localhost:26090",
  SITE_URL: "https://inkbyte.app",
  DEFAULT_DOMAINS: ["inkbyte.app", "inkbyte.co"],
};

let db: Knex;
let app: ReturnType<typeof createApp>;

/** Stands in for Clerk: every token maps to a deterministic principal. */
const principals = new Map<string, Principal>();
let tokenCounter = 0;

const issueToken = (principal: Principal): string => {
  tokenCounter += 1;
  const token = `test-token-${tokenCounter}`;
  principals.set(token, principal);
  return token;
};

const auth = {
  async verify(token: string): Promise<Principal> {
    const principal = principals.get(token);
    if (!principal) {
      throw new InkbyteError("unauthorized", "Sign in to continue", 401);
    }
    return principal;
  },
};

const reset = async () => {
  principals.clear();
  tokenCounter = 0;
  await db.raw(
    "TRUNCATE link_events, links, domains, users RESTART IDENTITY CASCADE",
  );
  await db("domains").insert([
    { slug: "inkbyte.app", isDefault: true },
    { slug: "inkbyte.co", isDefault: false },
  ]);
};

const signUp = async (email = "owner@example.com") => {
  const [firstName, lastName] = email.split("@")[0]!.split(".");
  const token = issueToken({
    subject: `user_${email.replace(/[^a-z0-9]/gi, "_")}`,
    email,
    firstName: firstName ?? "Test",
    lastName: lastName ?? "User",
  });
  const response = await app.request("/api/v1/auth/session", {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  return { token, auth: `Bearer ${token}` };
};

const createLink = async (
  authHeader: string,
  body: Record<string, unknown>,
) => {
  const response = await app.request("/api/v1/links", {
    method: "POST",
    headers: { authorization: authHeader, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return response;
};

before(async () => {
  db = createDatabase(DATABASE_URL, { applicationName: "inkbyte-tests" });
  await db.migrate.latest();
  app = createApp({
    db,
    auth,
    origin: env.API_ORIGIN,
    siteUrl: env.SITE_URL,
    defaultDomains: env.DEFAULT_DOMAINS,
    ready: async () => {},
  });
});

after(async () => {
  await db.destroy();
});

beforeEach(reset);

describe("health", () => {
  it("reports liveness", async () => {
    const response = await app.request("/health/live");
    assert.equal(response.status, 200);
    const body = (await response.json()) as { success: boolean };
    assert.equal(body.success, true);
  });

  it("reports readiness", async () => {
    const response = await app.request("/health/ready");
    assert.equal(response.status, 200);
  });
});

describe("sessions", () => {
  it("returns the signed-in user", async () => {
    const { auth: authHeader } = await signUp();
    const response = await app.request("/api/v1/auth/session", {
      headers: { authorization: authHeader },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: { user: { email: string } };
    };
    assert.equal(body.data.user.email, "owner@example.com");
  });

  it("rejects a request without a token", async () => {
    const response = await app.request("/api/v1/auth/session");
    assert.equal(response.status, 401);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "unauthorized");
  });

  it("rejects an unknown token", async () => {
    const response = await app.request("/api/v1/auth/session", {
      headers: { authorization: "Bearer nope" },
    });
    assert.equal(response.status, 401);
  });
});

describe("links", () => {
  it("reserves a custom alias atomically under concurrent creation", async () => {
    const { auth: authorization } = await signUp();
    const payload = {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
      customSlug: "concurrent",
    };
    const results = await Promise.all([
      createLink(authorization, payload),
      createLink(authorization, payload),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  });
  it("bounds JSON request bodies before parsing", async () => {
    const { auth: authorization } = await signUp();
    const response = await createLink(authorization, {
      longUrl: `https://example.com/${"x".repeat(70000)}`,
      domain: "inkbyte.app",
    });
    assert.equal(response.status, 413);
  });
  it("keeps deleted aliases reserved instead of failing with a database error", async () => {
    const { auth: authorization } = await signUp();
    const created = await createLink(authorization, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
      customSlug: "reserved-alias",
    });
    const payload = (await created.json()) as {
      data: { link: { id: string } };
    };
    await app.request(`/api/v1/links/${payload.data.link.id}`, {
      method: "DELETE",
      headers: { authorization },
    });
    const repeated = await createLink(authorization, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
      customSlug: "reserved-alias",
    });
    assert.equal(repeated.status, 409);
  });

  it("rejects aliases that collide with website routes", async () => {
    const { auth: authorization } = await signUp();
    const response = await createLink(authorization, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
      customSlug: "dashboard",
    });
    assert.equal(response.status, 400);
  });

  it("returns a validation error for a malformed link identifier", async () => {
    const { auth: authorization } = await signUp();
    const response = await app.request("/api/v1/links/not-a-uuid", {
      headers: { authorization },
    });
    assert.equal(response.status, 400);
  });
  it("creates a link owned by the current user", async () => {
    const { auth: authHeader } = await signUp();
    const response = await createLink(authHeader, {
      longUrl: "https://example.com/a/very/long/path",
      domain: "inkbyte.app",
    });

    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      data: { link: { slug: string; longUrl: string; shortUrl: string } };
    };
    assert.equal(
      body.data.link.longUrl,
      "https://example.com/a/very/long/path",
    );
    assert.match(body.data.link.slug, /^[a-z0-9]{7}$/);
    assert.equal(
      body.data.link.shortUrl,
      `https://inkbyte.app/${body.data.link.slug}`,
    );

    const links = await db("links");
    assert.equal(links.length, 1);
  });

  it("rejects a non-http destination", async () => {
    const { auth: authHeader } = await signUp();
    const response = await createLink(authHeader, {
      longUrl: "javascript:alert(1)",
      domain: "inkbyte.app",
    });

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "invalid_request");
  });

  it("rejects an unknown domain", async () => {
    const { auth: authHeader } = await signUp();
    const response = await createLink(authHeader, {
      longUrl: "https://example.com",
      domain: "evil.example",
    });

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "unknown_domain");
  });

  it("rejects a duplicate custom slug on the same domain", async () => {
    const { auth: authHeader } = await signUp();
    const first = await createLink(authHeader, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
      customSlug: "launch",
    });
    assert.equal(first.status, 201);

    const second = await createLink(authHeader, {
      longUrl: "https://example.org",
      domain: "inkbyte.app",
      customSlug: "launch",
    });
    assert.equal(second.status, 409);
    const payload = (await second.json()) as { error: { code: string } };
    assert.equal(payload.error.code, "slug_taken");
  });

  it("lists only the links owned by the current user", async () => {
    const first = await signUp("first@example.com");
    const second = await signUp("second@example.com");

    await createLink(first.auth, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
    });
    await createLink(second.auth, {
      longUrl: "https://example.org",
      domain: "inkbyte.app",
    });

    const response = await app.request("/api/v1/links", {
      headers: { authorization: first.auth },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: { links: Array<{ longUrl: string }> };
    };
    assert.equal(body.data.links.length, 1);
    assert.equal(body.data.links[0]?.longUrl, "https://example.com");
  });

  it("requires authentication", async () => {
    const response = await app.request("/api/v1/links");
    assert.equal(response.status, 401);
  });

  it("updates and deletes an owned link", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
    });
    const createdBody = (await created.json()) as {
      data: { link: { id: string } };
    };
    const id = createdBody.data.link.id;

    const patched = await app.request(`/api/v1/links/${id}`, {
      method: "PATCH",
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify({ title: "Launch page" }),
    });
    assert.equal(patched.status, 200);
    const patchedBody = (await patched.json()) as {
      data: { link: { title: string | null } };
    };
    assert.equal(patchedBody.data.link.title, "Launch page");

    const deleted = await app.request(`/api/v1/links/${id}`, {
      method: "DELETE",
      headers: { authorization: authHeader },
    });
    assert.equal(deleted.status, 204);

    const remaining = await db("links").where({ id });
    assert.equal(remaining.length, 1);
    assert.ok(remaining[0].deletedAt);
  });

  it("refuses to delete another user's link", async () => {
    const first = await signUp("first@example.com");
    const second = await signUp("second@example.com");
    const created = await createLink(first.auth, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
    });
    const createdBody = (await created.json()) as {
      data: { link: { id: string } };
    };

    const response = await app.request(
      `/api/v1/links/${createdBody.data.link.id}`,
      { method: "DELETE", headers: { authorization: second.auth } },
    );
    assert.equal(response.status, 404);
  });
});

describe("redirects", () => {
  it("redirects to the destination and records a click", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "go",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };

    const response = await app.request(
      `/r/${createdBody.data.link.slug}?domain=inkbyte.app`,
      { headers: { "user-agent": "test-agent" } },
    );

    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "https://example.com/destination",
    );

    const events = await db("link_events");
    assert.equal(events.length, 1);
    assert.equal(events[0].userAgent, "test-agent");
  });

  it("records three visits and settles on a single cookie identity", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "repeat",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };
    const userAgent = "Mozilla/5.0 (Windows NT 10.0)";

    let cookie: string | null = null;
    for (let index = 0; index < 3; index += 1) {
      const response = await app.request(
        `/r/${createdBody.data.link.slug}?domain=inkbyte.app`,
        { headers: { "user-agent": userAgent, ...(cookie ? { cookie } : {}) } },
      );
      assert.equal(response.status, 302);
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";")[0] ?? cookie;
    }

    const events = await db("link_events");
    assert.equal(events.length, 3);
    assert.equal(new Set(events.map((row) => row.visitorId)).size, 1);
  });

  it("does not record clicks for untracked links", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "quiet",
      isTracking: false,
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };

    const response = await app.request(
      `/r/${createdBody.data.link.slug}?domain=inkbyte.app`,
    );
    assert.equal(response.status, 302);
    const events = await db("link_events");
    assert.equal(events.length, 0);
  });

  it("returns not found for an unknown slug", async () => {
    const response = await app.request("/r/missing?domain=inkbyte.app");
    assert.equal(response.status, 404);
  });

  it("does not resolve a slug on a different domain", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "scoped",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };

    const response = await app.request(
      `/r/${createdBody.data.link.slug}?domain=inkbyte.co`,
    );
    assert.equal(response.status, 404);
  });

  it("collapses repeat visits behind one server-issued visitor cookie", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "cookie",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };
    const slug = createdBody.data.link.slug;

    const first = await app.request(`/r/${slug}?domain=inkbyte.app`, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0)" },
    });
    assert.equal(first.status, 302);
    const setCookie = first.headers.get("set-cookie");
    assert.match(setCookie ?? "", /inkbyte_vid=/);
    assert.match(setCookie ?? "", /HttpOnly/i);
    const cookie = setCookie?.split(";")[0] ?? "";

    for (let index = 0; index < 2; index += 1) {
      const repeat = await app.request(`/r/${slug}?domain=inkbyte.app`, {
        headers: {
          cookie,
          "user-agent": "Mozilla/5.0 (Windows NT 10.0)",
        },
      });
      assert.equal(repeat.status, 302);
    }

    const events = await db("link_events");
    assert.equal(events.length, 3);
    assert.equal(new Set(events.map((row) => row.visitorId)).size, 1);
  });

  it("ignores client-supplied visitor headers", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "spoof",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };

    await app.request(`/r/${createdBody.data.link.slug}?domain=inkbyte.app`, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0)",
        "x-visitor-id": "attacker-chosen-id",
        "x-forwarded-for": "203.0.113.10",
      },
    });

    const events = await db("link_events");
    assert.equal(events.length, 1);
    assert.notEqual(events[0].visitorId, "attacker-chosen-id");
  });

  it("redirects bots without recording them", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "bots",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };

    const response = await app.request(
      `/r/${createdBody.data.link.slug}?domain=inkbyte.app`,
      { headers: { "user-agent": "facebookexternalhit/1.1" } },
    );
    assert.equal(response.status, 302);
    const events = await db("link_events");
    assert.equal(events.length, 0);
  });

  it("captures device and edge geo headers", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "geo",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };

    await app.request(`/r/${createdBody.data.link.slug}?domain=inkbyte.app`, {
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "cf-ipcountry": "CA",
        "cf-ipcity": "Calgary",
        "cf-ipregion": "Alberta",
      },
    });

    const [event] = await db("link_events");
    assert.equal(event.device, "mobile");
    assert.equal(event.country, "CA");
    assert.equal(event.city, "Calgary");
    assert.equal(event.region, "Alberta");
  });
});

describe("interstitials and QR codes", () => {
  it("exposes public link metadata without recording a click", async () => {
    const { auth: authHeader } = await signUp();
    await createLink(authHeader, {
      longUrl: "https://example.com/cta",
      domain: "inkbyte.app",
      customSlug: "meta",
      ctaHeading: "Heads up",
      ctaBody: "You are about to leave InkByte.",
      ctaAction: "Take me there",
    });

    const response = await app.request(
      "/api/v1/public/links/meta?domain=inkbyte.app",
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: {
        link: {
          longUrl: string;
          cta: { heading: string; action: string } | null;
        };
      };
    };
    assert.equal(body.data.link.longUrl, "https://example.com/cta");
    assert.equal(body.data.link.cta?.heading, "Heads up");
    assert.equal(body.data.link.cta?.action, "Take me there");

    const events = await db("link_events");
    assert.equal(events.length, 0);
  });

  it("records a cta_click when the interstitial continue link is used", async () => {
    const { auth: authHeader } = await signUp();
    await createLink(authHeader, {
      longUrl: "https://example.com/cta",
      domain: "inkbyte.app",
      customSlug: "interstitial",
      ctaHeading: "Heads up",
    });

    await app.request("/r/interstitial?domain=inkbyte.app", {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0)" },
    });
    await app.request("/r/interstitial?domain=inkbyte.app&e=cta_click", {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0)" },
    });

    const events = await db("link_events").orderBy("eventType");
    assert.equal(events.length, 2);
    assert.equal(events[0].eventType, "cta_click");
    assert.equal(events[1].eventType, "view");
  });

  it("renders a QR code for an existing link", async () => {
    const { auth: authHeader } = await signUp();
    await createLink(authHeader, {
      longUrl: "https://example.com/qr",
      domain: "inkbyte.app",
      customSlug: "coded",
    });

    const response = await app.request(
      "/api/v1/qr?slug=coded&domain=inkbyte.app&size=256",
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /image\/svg\+xml/);
    const svg = await response.text();
    assert.match(svg, /<svg/);
  });

  it("refuses a QR code for an unknown link", async () => {
    const response = await app.request(
      "/api/v1/qr?slug=missing&domain=inkbyte.app",
    );
    assert.equal(response.status, 404);
  });
});

describe("link-in-bio pages", () => {
  it("creates a page, adds items and publishes it publicly", async () => {
    const { auth: authHeader } = await signUp();

    const created = await app.request("/api/v1/bio", {
      method: "PUT",
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        handle: "ada",
        heading: "Ada Lovelace",
        bio: "Analyst & metaphysician.",
      }),
    });
    assert.equal(created.status, 200);

    const item = await app.request("/api/v1/bio/items", {
      method: "POST",
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        label: "Website",
        url: "https://example.com/ada",
      }),
    });
    assert.equal(item.status, 201);
    const itemBody = (await item.json()) as {
      data: {
        items: Array<{ id: string; url: string; slug: string; domain: string }>;
      };
    };
    assert.equal(itemBody.data.items.length, 1);
    assert.equal(itemBody.data.items[0]?.url, "https://example.com/ada");
    assert.equal(itemBody.data.items[0]?.domain, "inkbyte.app");

    const publicPage = await app.request("/api/v1/public/bio/ada");
    assert.equal(publicPage.status, 200);
    const pageBody = (await publicPage.json()) as {
      data: { bio: { heading: string; items: unknown[] } };
    };
    assert.equal(pageBody.data.bio.heading, "Ada Lovelace");
    assert.equal(pageBody.data.bio.items.length, 1);

    // Bio item clicks flow through the standard redirect and are tracked.
    const redirect = await app.request(
      `/r/${itemBody.data.items[0]?.slug}?domain=inkbyte.app`,
      { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0)" } },
    );
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get("location"), "https://example.com/ada");
  });

  it("rejects a handle owned by another account", async () => {
    const first = await signUp("first@example.com");
    const second = await signUp("second@example.com");

    const created = await app.request("/api/v1/bio", {
      method: "PUT",
      headers: {
        authorization: first.auth,
        "content-type": "application/json",
      },
      body: JSON.stringify({ handle: "taken" }),
    });
    assert.equal(created.status, 200);

    const conflict = await app.request("/api/v1/bio", {
      method: "PUT",
      headers: {
        authorization: second.auth,
        "content-type": "application/json",
      },
      body: JSON.stringify({ handle: "taken" }),
    });
    assert.equal(conflict.status, 409);
    const body = (await conflict.json()) as { error: { code: string } };
    assert.equal(body.error.code, "handle_taken");
  });

  it("removes an item and its underlying link", async () => {
    const { auth: authHeader } = await signUp();
    await app.request("/api/v1/bio", {
      method: "PUT",
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify({ handle: "remover" }),
    });
    const item = await app.request("/api/v1/bio/items", {
      method: "POST",
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify({ label: "Go", url: "https://example.com" }),
    });
    const itemBody = (await item.json()) as {
      data: { items: Array<{ id: string; slug: string }> };
    };
    const itemId = itemBody.data.items[0]?.id;
    const slug = itemBody.data.items[0]?.slug;

    const deleted = await app.request(`/api/v1/bio/items/${itemId}`, {
      method: "DELETE",
      headers: { authorization: authHeader },
    });
    assert.equal(deleted.status, 204);

    const redirect = await app.request(`/r/${slug}?domain=inkbyte.app`);
    assert.equal(redirect.status, 404);
  });
});

describe("analytics", () => {
  it("distinguishes organic search traffic from direct visits", async () => {
    const { auth: authorization } = await signUp();
    await createLink(authorization, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
      customSlug: "search-traffic",
    });
    for (const referer of [
      "https://www.google.com/search?q=private",
      "https://www.bing.com/search?q=private",
    ]) {
      await app.request("/r/search-traffic?domain=inkbyte.app", {
        headers: { referer, "user-agent": "Mozilla/5.0" },
      });
    }
    await app.request("/r/search-traffic?domain=inkbyte.app", {
      headers: { "user-agent": "Mozilla/5.0" },
    });
    const response = await app.request("/api/v1/analytics/overview", {
      headers: { authorization },
    });
    const result = (await response.json()) as {
      data: { overview: { organicViews: number } };
    };
    assert.equal(result.data.overview.organicViews, 2);
  });
  it("counts organic views, devices and cities", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "enriched",
    });
    const createdBody = (await created.json()) as {
      data: { link: { id: string; slug: string } };
    };

    await app.request(`/r/${createdBody.data.link.slug}?domain=inkbyte.app`, {
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
        referer: "https://news.example.com",
        "cf-ipcountry": "CA",
        "cf-ipcity": "Calgary",
      },
    });
    await app.request(`/r/${createdBody.data.link.slug}?domain=inkbyte.app`, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0)" },
    });

    const overview = await app.request("/api/v1/analytics/overview", {
      headers: { authorization: authHeader },
    });
    assert.equal(overview.status, 200);
    const overviewBody = (await overview.json()) as {
      data: {
        overview: {
          totalViews: number;
          organicViews: number;
          countries: Array<{ country: string | null }>;
          cities: Array<{ city: string | null; views: number }>;
          devices: Array<{ device: string; views: number }>;
        };
      };
    };
    assert.equal(overviewBody.data.overview.totalViews, 2);
    assert.equal(overviewBody.data.overview.organicViews, 0);
    assert.equal(overviewBody.data.overview.countries[0]?.country, "CA");
    assert.equal(overviewBody.data.overview.cities[0]?.city, "Calgary");
    assert.equal(overviewBody.data.overview.cities[0]?.views, 1);
    const mobile = overviewBody.data.overview.devices.find(
      (entry) => entry.device === "mobile",
    );
    const desktop = overviewBody.data.overview.devices.find(
      (entry) => entry.device === "desktop",
    );
    assert.equal(mobile?.views, 1);
    assert.equal(desktop?.views, 1);

    const detail = await app.request(
      `/api/v1/analytics/links/${createdBody.data.link.id}`,
      { headers: { authorization: authHeader } },
    );
    assert.equal(detail.status, 200);
    const detailBody = (await detail.json()) as {
      data: { analytics: { organicViews: number; devices: unknown[] } };
    };
    assert.equal(detailBody.data.analytics.organicViews, 0);
    assert.equal(detailBody.data.analytics.devices.length, 2);
  });

  it("does not leak another user's analytics", async () => {
    const first = await signUp("first@example.com");
    const second = await signUp("second@example.com");
    const created = await createLink(first.auth, {
      longUrl: "https://example.com",
      domain: "inkbyte.app",
    });
    const createdBody = (await created.json()) as {
      data: { link: { id: string } };
    };

    const response = await app.request(
      `/api/v1/analytics/links/${createdBody.data.link.id}`,
      { headers: { authorization: second.auth } },
    );
    assert.equal(response.status, 404);
  });

  it("requires authentication", async () => {
    const response = await app.request("/api/v1/analytics/overview");
    assert.equal(response.status, 401);
  });
});

describe("domains", () => {
  it("lists the configured domains", async () => {
    const response = await app.request("/api/v1/domains");
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: { domains: Array<{ slug: string; isDefault: boolean }> };
    };
    assert.equal(body.data.domains.length, 2);
    assert.equal(body.data.domains[0]?.slug, "inkbyte.app");
    assert.equal(body.data.domains[0]?.isDefault, true);
  });
});
