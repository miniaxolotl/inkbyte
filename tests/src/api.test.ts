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
    assert.equal(body.data.link.longUrl, "https://example.com/a/very/long/path");
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

  it("counts repeat visits from the same visitor as one unique visitor", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "repeat",
    });
    const createdBody = (await created.json()) as {
      data: { link: { slug: string } };
    };

    for (let index = 0; index < 3; index += 1) {
      const response = await app.request(
        `/r/${createdBody.data.link.slug}?domain=inkbyte.app`,
        { headers: { "x-visitor-id": "visitor-1" } },
      );
      assert.equal(response.status, 302);
    }

    const events = await db("link_events");
    assert.equal(events.length, 3);
    assert.equal(
      new Set(events.map((row: { visitorId: string }) => row.visitorId)).size,
      1,
    );
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
});

describe("analytics", () => {
  it("summarises the owner's links and clicks", async () => {
    const { auth: authHeader } = await signUp();
    const created = await createLink(authHeader, {
      longUrl: "https://example.com/destination",
      domain: "inkbyte.app",
      customSlug: "tracked",
    });
    const createdBody = (await created.json()) as {
      data: { link: { id: string; slug: string } };
    };

    for (const visitor of ["visitor-1", "visitor-2"]) {
      await app.request(`/r/${createdBody.data.link.slug}?domain=inkbyte.app`, {
        headers: {
          "x-visitor-id": visitor,
          referer: "https://news.example.com",
          "cf-ipcountry": "CA",
        },
      });
    }

    const overview = await app.request("/api/v1/analytics/overview", {
      headers: { authorization: authHeader },
    });
    assert.equal(overview.status, 200);
    const overviewBody = (await overview.json()) as {
      data: {
        overview: {
          links: number;
          totalViews: number;
          uniqueVisitors: number;
          topLinks: Array<{ slug: string; views: number }>;
          referrers: Array<{ referrer: string | null; views: number }>;
          countries: Array<{ country: string | null; views: number }>;
        };
      };
    };
    assert.equal(overviewBody.data.overview.links, 1);
    assert.equal(overviewBody.data.overview.totalViews, 2);
    assert.equal(overviewBody.data.overview.uniqueVisitors, 2);
    assert.equal(overviewBody.data.overview.topLinks[0]?.slug, "tracked");
    assert.equal(
      overviewBody.data.overview.referrers[0]?.referrer,
      "https://news.example.com",
    );
    assert.equal(overviewBody.data.overview.countries[0]?.country, "CA");

    const detail = await app.request(
      `/api/v1/analytics/links/${createdBody.data.link.id}`,
      { headers: { authorization: authHeader } },
    );
    assert.equal(detail.status, 200);
    const detailBody = (await detail.json()) as {
      data: { analytics: { views: number; uniqueVisitors: number } };
    };
    assert.equal(detailBody.data.analytics.views, 2);
    assert.equal(detailBody.data.analytics.uniqueVisitors, 2);
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
