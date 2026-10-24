import { randomBytes, randomUUID } from "node:crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError } from "zod";
import type { Knex } from "@lib/database";
import {
  InkbyteError,
  errorResponse,
  linkCreateSchema,
  linkUpdateSchema,
  type AnalyticsOverview,
  type LinkAnalytics,
  type LinkSummary,
  type Principal,
  type PublicDomain,
  type PublicLink,
} from "@lib/shared";
import { bearerToken, type TokenVerifier } from "./auth.ts";

const SLUG_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";
const SHORT_SLUG_LENGTH = 7;

export type AppEnvironment = {
  Variables: {
    requestId: string;
    principal: Principal | null;
  };
};

/** Directory used to resolve display details for a signed-in user. */
export type UserDirectory = {
  getUser(subject: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
  }>;
};

export type AppDependencies = {
  db: Knex;
  auth: Pick<TokenVerifier, "verify">;
  directory?: UserDirectory;
  origin: string;
  siteUrl: string;
  defaultDomains: string[];
  ready: () => Promise<void>;
};

export function generateSlug(length = SHORT_SLUG_LENGTH): string {
  const bytes = randomBytes(length);
  let slug = "";
  for (const byte of bytes) {
    slug += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
  }
  return slug;
}

type LinkRow = {
  id: string;
  slug: string;
  longUrl: string;
  title: string | null;
  isTracking: boolean;
  isActive: boolean;
  createdAt: Date;
  domainId: string;
  domainSlug: string;
  domainIsDefault: boolean;
};

type CountRow = {
  linkId: string;
  views: string | number;
  total: string | number;
};

type AggregateRow = {
  views?: string | number;
  total?: string | number;
  unique?: string | number;
  count?: string | number;
};

type TopLinkRow = {
  id: string;
  slug: string;
  title: string | null;
  longUrl: string;
  views?: string | number;
  unique?: string | number;
};

type BreakdownRow = {
  referrer?: string | null;
  country?: string | null;
  views?: string | number;
};

type DailyRow = {
  day: string;
  views?: string | number;
};

const toPublicDomain = (row: {
  id: string;
  slug: string;
  isDefault: boolean;
}): PublicDomain => ({
  id: row.id,
  slug: row.slug,
  isDefault: row.isDefault,
});

const toPublicLink = (
  row: LinkRow,
  protocol: "http" | "https",
): PublicLink => ({
  id: row.id,
  slug: row.slug,
  longUrl: row.longUrl,
  title: row.title,
  isTracking: row.isTracking,
  isActive: row.isActive,
  createdAt: new Date(row.createdAt).toISOString(),
  domain: {
    id: row.domainId,
    slug: row.domainSlug,
    isDefault: row.domainIsDefault,
  },
  shortUrl: `${protocol}://${row.domainSlug}/${row.slug}`,
});

export function createApp(deps: AppDependencies) {
  const app = new Hono<AppEnvironment>();
  const { db } = deps;

  const linkSelect = [
    "links.id",
    "links.slug",
    "links.long_url",
    "links.title",
    "links.is_tracking",
    "links.is_active",
    "links.created_at",
    "links.domain_id",
    "domains.slug as domain_slug",
    "domains.is_default as domain_is_default",
  ];

  const protocol: "http" | "https" = deps.siteUrl.startsWith("https://")
    ? "https"
    : "http";

  const requirePrincipal = async (c: {
    req: { raw: Request };
    set: (key: "principal", value: Principal | null) => void;
  }): Promise<Principal> => {
    const token = bearerToken(c.req.raw);
    if (!token) {
      throw new InkbyteError("unauthorized", "Sign in to continue", 401);
    }
    let principal: Principal;
    try {
      principal = await deps.auth.verify(token);
    } catch (error) {
      if (error instanceof InkbyteError) throw error;
      throw new InkbyteError("unauthorized", "Sign in to continue", 401);
    }
    c.set("principal", principal);
    return principal;
  };

  /**
   * Resolves the local user row for a Clerk subject, creating it on first
   * sight. Display details come from the token claims when present and from
   * the Clerk directory otherwise.
   */
  const resolveUser = async (principal: Principal): Promise<string> => {
    const existing = (await db("users")
      .where({ clerkSubject: principal.subject })
      .first("id")) as { id: string } | undefined;
    if (existing) return existing.id;

    let email = principal.email;
    let firstName = principal.firstName;
    let lastName = principal.lastName;
    if (!email && deps.directory) {
      const details = await deps.directory.getUser(principal.subject);
      email = details.email;
      firstName = details.firstName;
      lastName = details.lastName;
    }

    const [created] = (await db("users")
      .insert({
        clerkSubject: principal.subject,
        email: email || "",
        firstName: firstName || "",
        lastName: lastName || "",
      })
      .returning("id")) as Array<{ id: string }>;
    return created!.id;
  };

  app.use("*", async (c, next) => {
    c.set("requestId", randomUUID());
    c.header("X-Request-ID", c.get("requestId"));
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "no-referrer");
    c.header("Cache-Control", "private, no-store");
    await next();
  });

  app.use(
    "*",
    cors({
      origin: deps.siteUrl,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Authorization", "Content-Type", "X-Visitor-Id"],
      exposeHeaders: ["WWW-Authenticate", "X-Request-ID"],
      credentials: true,
    }),
  );

  app.onError((error, c) => {
    const requestId = c.get("requestId");
    if (error instanceof ZodError || error instanceof SyntaxError) {
      const invalid = new InkbyteError(
        "invalid_request",
        "Check the request fields",
        400,
        error instanceof ZodError ? error.issues : undefined,
      );
      return c.json(errorResponse(invalid, requestId), 400);
    }
    if (error instanceof InkbyteError) {
      if (error.status === 401) c.header("WWW-Authenticate", "Bearer");
      return c.json(errorResponse(error, requestId), error.status);
    }
    // Never leak SQL, parameters or credentials to clients.
    console.error(
      JSON.stringify({ status: "error", requestId, code: "unavailable" }),
    );
    const unavailable = new InkbyteError(
      "unavailable",
      "InkByte is temporarily unavailable",
      503,
    );
    return c.json(errorResponse(unavailable, requestId), 503);
  });

  app.notFound((c) => {
    const notFound = new InkbyteError("not_found", "Not found", 404);
    return c.json(errorResponse(notFound, c.get("requestId")), 404);
  });

  app.get("/health/live", (c) =>
    c.json({ success: true, data: { status: "live" } }),
  );

  app.get("/health/ready", async (c) => {
    await deps.ready();
    return c.json({ success: true, data: { status: "ready" } });
  });

  app.get("/api/v1/domains", async (c) => {
    const rows = (await db("domains").orderBy("slug")) as Array<{
      id: string;
      slug: string;
      isDefault: boolean;
    }>;
    return c.json({
      success: true,
      data: { domains: rows.map(toPublicDomain) },
    });
  });

  app.get("/api/v1/auth/session", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const user = (await db("users").where({ id: userId }).first()) as
      | {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          createdAt: Date;
        }
      | undefined;
    return c.json({
      success: true,
      data: {
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              createdAt: new Date(user.createdAt).toISOString(),
            }
          : null,
      },
    });
  });

  app.get("/api/v1/links", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const rows = (await db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where({ "links.userId": userId })
      .whereNull("links.deletedAt")
      .select(linkSelect)
      .orderBy("links.createdAt", "desc")) as unknown as LinkRow[];

    const counts = (await db("link_events")
      .join("links", "links.id", "link_events.linkId")
      .where({ "links.userId": userId })
      .whereNull("links.deletedAt")
      .groupBy("link_events.linkId")
      .select("link_events.linkId")
      .countDistinct({ views: "link_events.visitorId" })
      .count({ total: "*" })) as unknown as CountRow[];

    const countByLink = new Map(
      counts.map((row) => [
        row.linkId,
        {
          views: Number(row.total ?? 0),
          uniqueVisitors: Number(row.views ?? 0),
        },
      ]),
    );

    const links: LinkSummary[] = rows.map((row) => ({
      ...toPublicLink(row, protocol),
      ...(countByLink.get(row.id) ?? { views: 0, uniqueVisitors: 0 }),
    }));

    return c.json({ success: true, data: { links } });
  });

  app.post("/api/v1/links", async (c) => {
    const principal = await requirePrincipal(c);
    const payload = linkCreateSchema.parse(await c.req.json());
    const userId = await resolveUser(principal);

    const domain = (await db("domains")
      .where({ slug: payload.domain })
      .first("id")) as { id: string } | undefined;
    if (!domain) {
      throw new InkbyteError(
        "unknown_domain",
        "That domain is not available",
        400,
      );
    }

    const slug = payload.customSlug ?? generateSlug();
    const conflict = (await db("links")
      .where({ domainId: domain.id, slug })
      .whereNull("deletedAt")
      .first("id")) as { id: string } | undefined;
    if (conflict) {
      throw new InkbyteError(
        "slug_taken",
        "That alias is already in use",
        409,
      );
    }

    await db("links").insert({
      slug,
      domainId: domain.id,
      userId,
      longUrl: payload.longUrl,
      title: payload.title ?? null,
      isTracking: payload.isTracking,
    });

    const row = (await db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where("links.slug", slug)
      .where({ "links.domainId": domain.id })
      .whereNull("links.deletedAt")
      .select(linkSelect)
      .first()) as unknown as LinkRow;

    return c.json({ success: true, data: { link: toPublicLink(row, protocol) } }, 201);
  });

  app.get("/api/v1/links/:id", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const row = (await db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where("links.id", c.req.param("id"))
      .where({ "links.userId": userId })
      .whereNull("links.deletedAt")
      .select(linkSelect)
      .first()) as unknown as LinkRow | undefined;
    if (!row) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }
    return c.json({ success: true, data: { link: toPublicLink(row, protocol) } });
  });

  app.patch("/api/v1/links/:id", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const payload = linkUpdateSchema.parse(await c.req.json());

    const owned = (await db("links")
      .where({ id: c.req.param("id"), userId })
      .whereNull("deletedAt")
      .first("id")) as { id: string } | undefined;
    if (!owned) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }

    await db("links")
      .where({ id: owned.id })
      .update({
        ...(payload.longUrl ? { longUrl: payload.longUrl } : {}),
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.isTracking !== undefined
          ? { isTracking: payload.isTracking }
          : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        updatedAt: new Date(),
      });

    const row = (await db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where("links.id", owned.id)
      .select(linkSelect)
      .first()) as unknown as LinkRow;
    return c.json({ success: true, data: { link: toPublicLink(row, protocol) } });
  });

  app.delete("/api/v1/links/:id", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const deleted = await db("links")
      .where({ id: c.req.param("id"), userId })
      .whereNull("deletedAt")
      .update({ deletedAt: new Date(), updatedAt: new Date() });
    if (!deleted) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }
    return c.body(null, 204);
  });

  app.get("/r/:slug", async (c) => {
    const domainSlug = c.req.query("domain") ?? deps.defaultDomains[0];
    const row = (await db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where("links.slug", c.req.param("slug"))
      .where("domains.slug", domainSlug)
      .whereNull("links.deletedAt")
      .where("links.isActive", true)
      .select("links.id", "links.longUrl", "links.isTracking")
      .first()) as
      | { id: string; longUrl: string; isTracking: boolean }
      | undefined;

    if (!row) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }

    if (row.isTracking) {
      const visitorId =
        c.req.header("x-visitor-id") ??
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";
      await db("link_events").insert({
        linkId: row.id,
        visitorId: visitorId.slice(0, 256),
        referrer: c.req.header("referer")?.slice(0, 1024) ?? null,
        userAgent: c.req.header("user-agent")?.slice(0, 512) ?? null,
        country: c.req.header("cf-ipcountry")?.slice(0, 8) ?? null,
      });
    }

    return c.redirect(row.longUrl, 302);
  });

  app.get("/api/v1/analytics/overview", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);

    const linkCount = (await db("links")
      .where({ userId })
      .whereNull("deletedAt")
      .count({ count: "*" })
      .first()) as AggregateRow;

    const scope = db("link_events")
      .join("links", "links.id", "link_events.linkId")
      .where({ "links.userId": userId })
      .whereNull("links.deletedAt");

    const totals = (await scope
      .clone()
      .countDistinct({ unique: "link_events.visitorId" })
      .count({ total: "*" })
      .first()) as AggregateRow;

    const since = (days: number) =>
      new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const last7 = (await scope
      .clone()
      .where("link_events.createdAt", ">=", since(7))
      .count({ count: "*" })
      .first()) as AggregateRow;
    const last30 = (await scope
      .clone()
      .where("link_events.createdAt", ">=", since(30))
      .count({ count: "*" })
      .first()) as AggregateRow;

    const topLinks = (await scope
      .clone()
      .groupBy("links.id", "links.slug", "links.title", "links.longUrl")
      .select(
        "links.id",
        "links.slug",
        "links.title",
        "links.longUrl",
        db.raw("count(distinct link_events.visitor_id) as unique"),
        db.raw("count(*) as views"),
      )
      .orderBy("views", "desc")
      .limit(10)) as unknown as TopLinkRow[];

    const referrers = (await scope
      .clone()
      .groupBy("link_events.referrer")
      .select(
        "link_events.referrer",
        db.raw("count(*) as views"),
      )
      .orderBy("views", "desc")
      .limit(10)) as unknown as BreakdownRow[];

    const countries = (await scope
      .clone()
      .groupBy("link_events.country")
      .select(
        "link_events.country",
        db.raw("count(*) as views"),
      )
      .orderBy("views", "desc")
      .limit(10)) as unknown as BreakdownRow[];

    const dailyViews = (await scope
      .clone()
      .groupByRaw("date_trunc('day', link_events.created_at)")
      .select(
        db.raw("date_trunc('day', link_events.created_at) as day"),
        { views: db.raw("count(*)") },
      )
      .orderBy("day", "asc")) as unknown as DailyRow[];

    const overview: AnalyticsOverview = {
      links: Number(linkCount?.count ?? 0),
      totalViews: Number(totals?.total ?? 0),
      uniqueVisitors: Number(totals?.unique ?? 0),
      viewsLast7Days: Number(last7?.count ?? 0),
      viewsLast30Days: Number(last30?.count ?? 0),
      topLinks: topLinks.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title ?? null,
        longUrl: row.longUrl,
        views: Number(row.views ?? 0),
        uniqueVisitors: Number(row.unique ?? 0),
      })),
      referrers: referrers.map((row) => ({
        referrer: row.referrer ?? null,
        views: Number(row.views ?? 0),
      })),
      countries: countries.map((row) => ({
        country: row.country ?? null,
        views: Number(row.views ?? 0),
      })),
      dailyViews: dailyViews.map((row) => ({
        day: new Date(row.day).toISOString().slice(0, 10),
        views: Number(row.views ?? 0),
      })),
    };

    return c.json({ success: true, data: { overview } });
  });

  app.get("/api/v1/analytics/links/:id", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);

    const row = (await db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where("links.id", c.req.param("id"))
      .where({ "links.userId": userId })
      .whereNull("links.deletedAt")
      .select(linkSelect)
      .first()) as unknown as LinkRow | undefined;
    if (!row) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }

    const scope = db("link_events").where("link_events.linkId", row.id);
    const totals = (await scope
      .clone()
      .countDistinct({ unique: "link_events.visitorId" })
      .count({ total: "*" })
      .first()) as AggregateRow;
    const referrers = (await scope
      .clone()
      .groupBy("link_events.referrer")
      .select(
        "link_events.referrer",
        db.raw("count(*) as views"),
      )
      .orderBy("views", "desc")
      .limit(10)) as unknown as BreakdownRow[];
    const countries = (await scope
      .clone()
      .groupBy("link_events.country")
      .select(
        "link_events.country",
        db.raw("count(*) as views"),
      )
      .orderBy("views", "desc")
      .limit(10)) as unknown as BreakdownRow[];
    const dailyViews = (await scope
      .clone()
      .groupByRaw("date_trunc('day', link_events.created_at)")
      .select(
        db.raw("date_trunc('day', link_events.created_at) as day"),
        { views: db.raw("count(*)") },
      )
      .orderBy("day", "asc")) as unknown as DailyRow[];

    const analytics: LinkAnalytics = {
      link: toPublicLink(row, protocol),
      views: Number(totals?.total ?? 0),
      uniqueVisitors: Number(totals?.unique ?? 0),
      referrers: referrers.map((entry) => ({
        referrer: entry.referrer ?? null,
        views: Number(entry.views ?? 0),
      })),
      countries: countries.map((entry) => ({
        country: entry.country ?? null,
        views: Number(entry.views ?? 0),
      })),
      dailyViews: dailyViews.map((entry) => ({
        day: new Date(entry.day).toISOString().slice(0, 10),
        views: Number(entry.views ?? 0),
      })),
    };

    return c.json({ success: true, data: { analytics } });
  });

  return app;
}
