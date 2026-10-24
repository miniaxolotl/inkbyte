import { randomBytes, randomUUID } from "node:crypto";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { z, ZodError } from "zod";
import { UserModel } from "@lib/database";
import type { Knex } from "@lib/database";
import {
  InkbyteError,
  bioItemCreateSchema,
  bioItemUpdateSchema,
  bioUpsertSchema,
  errorResponse,
  linkCreateSchema,
  linkCta,
  linkUpdateSchema,
  type AnalyticsOverview,
  type LinkAnalytics,
  type LinkSummary,
  type Principal,
  type PublicBioItem,
  type PublicBioPage,
  type PublicDomain,
  type PublicLink,
} from "@lib/shared";
import { bearerToken, type TokenVerifier } from "./auth.ts";
import { qrOptions, renderQr } from "./qr.ts";
import { RateLimiter, clientKey } from "./rate-limit.ts";
import {
  isBot,
  parseDevice,
  resolveGeo,
  resolveVisitor,
  visitorCookieHeader,
  referrerOrigin,
  organicReferrerPattern,
} from "./tracking.ts";

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
  trackingSecret?: string;
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
  ctaHeading: string | null;
  ctaBody: string | null;
  ctaAction: string | null;
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
  organic?: string | number;
  ctaClicks?: string | number;
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
  city?: string | null;
  device?: string | null;
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
  cta: linkCta(row),
});

export function createApp(deps: AppDependencies) {
  const app = new Hono<AppEnvironment>();
  const { db } = deps;
  const trackingSecret = deps.trackingSecret ?? randomBytes(32).toString("hex");

  const linkSelect = [
    "links.id",
    "links.slug",
    "links.long_url",
    "links.title",
    "links.is_tracking",
    "links.is_active",
    "links.cta_heading",
    "links.cta_body",
    "links.cta_action",
    "links.created_at",
    "links.domain_id",
    "domains.slug as domain_slug",
    "domains.is_default as domain_is_default",
  ];

  const protocol: "http" | "https" = deps.siteUrl.startsWith("https://")
    ? "https"
    : "http";

  const createLimiter = new RateLimiter(30, 60_000);
  const redirectLimiter = new RateLimiter(120, 60_000);

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
    const existing = await UserModel.query(db)
      .findOne({ clerkSubject: principal.subject })
      .select("id");
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
      .onConflict("clerkSubject")
      .merge({
        email: email || "",
        firstName: firstName || "",
        lastName: lastName || "",
      })
      .returning("id")) as Array<{ id: string }>;
    return created!.id;
  };

  const requireRateLimit = (limiter: RateLimiter, request: Request) => {
    const result = limiter.consume(clientKey(request));
    if (!result.allowed) {
      return {
        error: new InkbyteError(
          "rate_limited",
          "Too many requests. Try again shortly.",
          429,
          result.retryAfterSeconds || 60,
        ),
        retryAfter: result.retryAfterSeconds,
      };
    }
    return { error: null as InkbyteError | null, retryAfter: 0 };
  };

  const fetchLinkRow = (slug: string, domainSlug: string) =>
    db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where("links.slug", slug)
      .where("domains.slug", domainSlug)
      .whereNull("links.deletedAt")
      .select(linkSelect)
      .first() as Promise<LinkRow | undefined>;

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
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Authorization", "Content-Type", "X-Visitor-Id"],
      exposeHeaders: ["WWW-Authenticate", "X-Request-ID"],
      credentials: true,
    }),
  );
  app.use(
    "/api/*",
    bodyLimit({
      maxSize: 64 * 1024,
      onError: (c) =>
        c.json(
          errorResponse(
            new InkbyteError(
              "body_too_large",
              "Request body is too large",
              413,
            ),
            c.get("requestId"),
          ),
          413,
        ),
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
      if (error.status === 429)
        c.header("Retry-After", String(error.details ?? 60));
      return c.json(
        errorResponse(error, requestId),
        error.status as ContentfulStatusCode,
      );
    }
    // Never leak SQL, parameters or credentials to clients.
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
      .where({ eventType: "view" })
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

  app.use("/api/v1/links/:id", async (c, next) => {
    z.uuid().parse(c.req.param("id"));
    await next();
  });
  app.use("/api/v1/analytics/links/:id", async (c, next) => {
    z.uuid().parse(c.req.param("id"));
    await next();
  });

  app.post("/api/v1/links", async (c) => {
    const principal = await requirePrincipal(c);
    const limited = requireRateLimit(createLimiter, c.req.raw);
    if (limited.error) throw limited.error;
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

    let slug = payload.customSlug ?? generateSlug();
    let inserted = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const created = await db("links")
        .insert({
          slug,
          domainId: domain.id,
          userId,
          longUrl: payload.longUrl,
          title: payload.title ?? null,
          isTracking: payload.isTracking,
          ctaHeading: payload.ctaHeading ?? null,
          ctaBody: payload.ctaBody ?? null,
          ctaAction: payload.ctaAction ?? null,
        })
        .onConflict(["domainId", "slug"])
        .ignore()
        .returning("id");
      if (created.length) {
        inserted = true;
        break;
      }
      if (payload.customSlug) {
        throw new InkbyteError(
          "slug_taken",
          "That alias is already in use",
          409,
        );
      }
      slug = generateSlug();
    }

    if (!inserted)
      throw new InkbyteError(
        "unavailable",
        "Could not allocate an alias. Retry shortly.",
        503,
      );

    const row = await fetchLinkRow(slug, payload.domain);
    return c.json(
      { success: true, data: { link: toPublicLink(row!, protocol) } },
      201,
    );
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
    return c.json({
      success: true,
      data: { link: toPublicLink(row, protocol) },
    });
  });

  app.patch("/api/v1/links/:id", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const payload = linkUpdateSchema.parse(await c.req.json());

    const owned = (await db("links")
      .where({ id: c.req.param("id"), userId })
      .whereNull("deletedAt")
      .first("id", "domainId")) as { id: string; domainId: string } | undefined;
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
        ...(payload.isActive !== undefined
          ? { isActive: payload.isActive }
          : {}),
        ...(payload.ctaHeading !== undefined
          ? { ctaHeading: payload.ctaHeading }
          : {}),
        ...(payload.ctaBody !== undefined ? { ctaBody: payload.ctaBody } : {}),
        ...(payload.ctaAction !== undefined
          ? { ctaAction: payload.ctaAction }
          : {}),
        updatedAt: new Date(),
      });

    const row = (await db("links")
      .join("domains", "domains.id", "links.domain_id")
      .where("links.id", owned.id)
      .select(linkSelect)
      .first()) as LinkRow | undefined;
    return c.json({
      success: true,
      data: { link: toPublicLink(row!, protocol) },
    });
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

  /**
   * Public link metadata for interstitials and previews. Does not record a
   * click; the redirect endpoint is the only place a view is counted.
   */
  app.get("/api/v1/public/links/:slug", async (c) => {
    const domainSlug =
      c.req.query("domain") ?? deps.defaultDomains[0] ?? "inkbyte.app";
    const row = await fetchLinkRow(c.req.param("slug"), domainSlug);
    if (!row || !row.isActive) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }
    return c.json({
      success: true,
      data: {
        link: {
          slug: row.slug,
          longUrl: row.longUrl,
          domain: domainSlug,
          cta: linkCta(row),
        },
      },
    });
  });

  app.get("/r/:slug", async (c) => {
    const limited = requireRateLimit(redirectLimiter, c.req.raw);
    if (limited.error) throw limited.error;
    const domainSlug = c.req.query("domain") ?? deps.defaultDomains[0] ?? "";
    const row = await fetchLinkRow(c.req.param("slug"), domainSlug);
    if (!row || !row.isActive) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }

    const isHttps = c.req.header("x-forwarded-proto") === "https";
    const userAgent = c.req.header("user-agent") ?? null;

    if (row.isTracking && !isBot(userAgent)) {
      const { visitorId, existingCookie } = resolveVisitor(
        c.req.raw,
        trackingSecret,
      );
      const geo = resolveGeo(c.req.raw);
      const eventType =
        c.req.query("e") === "cta_click" && row.ctaHeading
          ? "cta_click"
          : "view";
      await db("link_events").insert({
        linkId: row.id,
        visitorId: visitorId.slice(0, 256),
        referrer: referrerOrigin(c.req.header("referer") ?? null),
        userAgent: userAgent?.slice(0, 512) ?? null,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        device: parseDevice(userAgent),
        eventType,
      });
      if (!existingCookie) {
        c.header(
          "Set-Cookie",
          visitorCookieHeader(visitorId, isHttps, trackingSecret),
        );
      }
    }

    c.header("Cache-Control", "no-store");
    if (c.req.query("format") === "json") {
      return c.json({
        success: true,
        data: {
          link: {
            slug: row.slug,
            domain: domainSlug,
            longUrl: row.longUrl,
            cta: linkCta(row),
          },
        },
      });
    }
    return c.redirect(row.longUrl, 302);
  });

  /** QR code for a short link, rendered on demand as an SVG. */
  app.get("/api/v1/qr", async (c) => {
    const options = qrOptions(new URL(c.req.url).searchParams);
    const domainSlug = c.req.query("domain") ?? deps.defaultDomains[0] ?? "";
    const row = await fetchLinkRow(c.req.query("slug") ?? "", domainSlug);
    if (!row || !row.isActive) {
      throw new InkbyteError("not_found", "Link not found", 404);
    }
    const svg = await renderQr(
      `${protocol}://${domainSlug}/${row.slug}`,
      options,
    );
    c.header("Content-Type", "image/svg+xml");
    c.header("Cache-Control", "public, max-age=3600");
    return c.body(svg, 200);
  });

  const bioScope = (userId: string) =>
    db("bio_pages").where({ userId }).whereNull("deletedAt");

  const bioItemsFor = async (pageId: string): Promise<PublicBioItem[]> => {
    const rows = (await db("bio_items")
      .join("links", "links.id", "bio_items.linkId")
      .join("domains", "domains.id", "links.domain_id")
      .where({ "bio_items.bioPageId": pageId })
      .whereNull("bio_items.deletedAt")
      .where("bio_items.isActive", true)
      .whereNull("links.deletedAt")
      .where("links.isActive", true)
      .orderBy("bio_items.position", "asc")
      .select(
        "bio_items.id",
        "bio_items.label",
        "bio_items.position",
        "links.longUrl",
        "links.slug",
        "domains.slug as domain_slug",
      )) as Array<{
      id: string;
      label: string;
      position: number;
      longUrl: string;
      slug: string;
      domainSlug: string;
    }>;
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      url: row.longUrl,
      slug: row.slug,
      domain: row.domainSlug,
      position: row.position,
    }));
  };

  app.get("/api/v1/bio", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const page = (await bioScope(userId).first()) as
      | {
          id: string;
          handle: string;
          heading: string;
          bio: string;
          isPublished: boolean;
        }
      | undefined;
    const items = page ? await bioItemsFor(page.id) : [];
    const body: PublicBioPage | null = page
      ? {
          handle: page.handle,
          heading: page.heading,
          bio: page.bio,
          isPublished: page.isPublished,
          items,
        }
      : null;
    return c.json({ success: true, data: { bio: body } });
  });

  app.put("/api/v1/bio", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const payload = bioUpsertSchema.parse(await c.req.json());

    const handleTaken = (await db("bio_pages")
      .where({ handle: payload.handle })
      .whereNot({ userId })
      .whereNull("deletedAt")
      .first("id")) as { id: string } | undefined;
    if (handleTaken) {
      throw new InkbyteError("handle_taken", "That handle is in use", 409);
    }

    const existing = (await bioScope(userId).first("id")) as
      { id: string } | undefined;
    if (existing) {
      await db("bio_pages").where({ id: existing.id }).update({
        handle: payload.handle,
        heading: payload.heading,
        bio: payload.bio,
        isPublished: payload.isPublished,
        updatedAt: new Date(),
      });
    } else {
      await db("bio_pages").insert({
        userId,
        handle: payload.handle,
        heading: payload.heading,
        bio: payload.bio,
        isPublished: payload.isPublished,
      });
    }

    const page = (await bioScope(userId).first()) as {
      id: string;
      handle: string;
      heading: string;
      bio: string;
      isPublished: boolean;
    };
    const items = await bioItemsFor(page.id);
    return c.json({
      success: true,
      data: {
        bio: {
          handle: page.handle,
          heading: page.heading,
          bio: page.bio,
          isPublished: page.isPublished,
          items,
        },
      },
    });
  });

  app.post("/api/v1/bio/items", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const payload = bioItemCreateSchema.parse(await c.req.json());

    const page = (await bioScope(userId).first()) as { id: string } | undefined;
    if (!page) {
      throw new InkbyteError(
        "bio_missing",
        "Create your link-in-bio page first",
        400,
      );
    }

    const domain = (await db("domains")
      .where({ isDefault: true })
      .first("id")) as { id: string } | undefined;
    if (!domain) {
      throw new InkbyteError("unknown_domain", "No default domain", 500);
    }

    let slug = generateSlug();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const conflict = (await db("links")
        .where({ domainId: domain.id, slug })
        .whereNull("deletedAt")
        .first("id")) as { id: string } | undefined;
      if (!conflict) break;
      slug = generateSlug();
    }

    const [link] = (await db("links")
      .insert({
        slug,
        domainId: domain.id,
        userId,
        longUrl: payload.url,
        title: payload.label,
      })
      .returning("id")) as Array<{ id: string }>;

    const position = (await db("bio_items")
      .where({ bioPageId: page.id })
      .whereNull("deletedAt")
      .count({ next: "*" })) as unknown as Array<{ next?: string | number }>;

    await db("bio_items").insert({
      bioPageId: page.id,
      linkId: link!.id,
      label: payload.label,
      position: Number(position[0]?.next ?? 0),
    });

    const items = await bioItemsFor(page.id);
    return c.json({ success: true, data: { items } }, 201);
  });

  app.patch("/api/v1/bio/items/:id", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const payload = bioItemUpdateSchema.parse(await c.req.json());

    const item = (await db("bio_items")
      .join("bio_pages", "bio_pages.id", "bio_items.bioPageId")
      .where({ "bio_items.id": c.req.param("id") })
      .where({ "bio_pages.userId": userId })
      .whereNull("bio_items.deletedAt")
      .first("bio_items.id", "bio_items.linkId")) as
      { id: string; linkId: string } | undefined;
    if (!item) {
      throw new InkbyteError("not_found", "Item not found", 404);
    }

    await db("bio_items")
      .where({ id: item.id })
      .update({
        ...(payload.label !== undefined ? { label: payload.label } : {}),
        ...(payload.position !== undefined
          ? { position: payload.position }
          : {}),
        ...(payload.isActive !== undefined
          ? { isActive: payload.isActive }
          : {}),
        updatedAt: new Date(),
      });
    if (payload.url) {
      await db("links").where({ id: item.linkId }).update({
        longUrl: payload.url,
        updatedAt: new Date(),
      });
    }

    const page = (await bioScope(userId).first("id")) as { id: string };
    const items = await bioItemsFor(page.id);
    return c.json({ success: true, data: { items } });
  });

  app.delete("/api/v1/bio/items/:id", async (c) => {
    const principal = await requirePrincipal(c);
    const userId = await resolveUser(principal);
    const item = (await db("bio_items")
      .join("bio_pages", "bio_pages.id", "bio_items.bioPageId")
      .where({ "bio_items.id": c.req.param("id") })
      .where({ "bio_pages.userId": userId })
      .whereNull("bio_items.deletedAt")
      .first("bio_items.id", "bio_items.linkId")) as
      { id: string; linkId: string } | undefined;
    if (!item) {
      throw new InkbyteError("not_found", "Item not found", 404);
    }
    await db("bio_items").where({ id: item.id }).update({
      deletedAt: new Date(),
    });
    await db("links").where({ id: item.linkId }).update({
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
    return c.body(null, 204);
  });

  /** Public link-in-bio page used by the website renderer. */
  app.get("/api/v1/public/bio/:handle", async (c) => {
    const page = (await db("bio_pages")
      .where({ handle: c.req.param("handle") })
      .whereNull("deletedAt")
      .first()) as
      | {
          id: string;
          heading: string;
          bio: string;
          isPublished: boolean;
        }
      | undefined;
    if (!page || !page.isPublished) {
      throw new InkbyteError("not_found", "Page not found", 404);
    }
    const items = await bioItemsFor(page.id);
    return c.json({
      success: true,
      data: {
        bio: {
          handle: c.req.param("handle"),
          heading: page.heading,
          bio: page.bio,
          isPublished: page.isPublished,
          items,
        },
      },
    });
  });

  const analyticsBreakdown = async (
    scope: Knex.QueryBuilder,
    column: "referrer" | "country" | "city" | "device",
  ) =>
    (await scope
      .clone()
      .where({ eventType: "view" })
      .groupBy(`link_events.${column}`)
      .select(`link_events.${column}`, db.raw("count(*) as views"))
      .orderBy("views", "desc")
      .limit(10)) as unknown as BreakdownRow[];

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
      .where({ eventType: "view" })
      .countDistinct({ unique: "link_events.visitorId" })
      .count({ total: "*" })
      .first()) as AggregateRow;

    const organic = (await scope
      .clone()
      .where({ eventType: "view" })
      .whereRaw("link_events.referrer ~ ?", [organicReferrerPattern])
      .count({ organic: "*" })
      .first()) as AggregateRow;

    const ctaViews = (await scope
      .clone()
      .where({ eventType: "view" })
      .whereNotNull("links.ctaHeading")
      .count({ total: "*" })
      .first()) as AggregateRow;

    const ctaClicks = (await scope
      .clone()
      .where({ eventType: "cta_click" })
      .count({ ctaClicks: "*" })
      .first()) as AggregateRow;

    const since = (days: number) =>
      new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const last7 = (await scope
      .clone()
      .where({ eventType: "view" })
      .where("link_events.createdAt", ">=", since(7))
      .count({ count: "*" })
      .first()) as AggregateRow;
    const last30 = (await scope
      .clone()
      .where({ eventType: "view" })
      .where("link_events.createdAt", ">=", since(30))
      .count({ count: "*" })
      .first()) as AggregateRow;

    const topLinks = (await scope
      .clone()
      .where({ eventType: "view" })
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

    const referrers = await analyticsBreakdown(scope, "referrer");
    const countries = await analyticsBreakdown(scope, "country");
    const cities = await analyticsBreakdown(scope, "city");
    const devices = await analyticsBreakdown(scope, "device");

    const dailyViews = (await scope
      .clone()
      .where({ eventType: "view" })
      .groupByRaw("date_trunc('day', link_events.created_at)")
      .select(db.raw("date_trunc('day', link_events.created_at) as day"), {
        views: db.raw("count(*)"),
      })
      .orderBy("day", "asc")) as unknown as DailyRow[];

    const overview: AnalyticsOverview = {
      links: Number(linkCount?.count ?? 0),
      totalViews: Number(totals?.total ?? 0),
      uniqueVisitors: Number(totals?.unique ?? 0),
      organicViews: Number(organic?.organic ?? 0),
      viewsLast7Days: Number(last7?.count ?? 0),
      viewsLast30Days: Number(last30?.count ?? 0),
      ctaViews: Number(ctaViews?.total ?? 0),
      ctaClicks: Number(ctaClicks?.ctaClicks ?? 0),
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
      cities: cities.map((row) => ({
        city: row.city ?? null,
        views: Number(row.views ?? 0),
      })),
      devices: devices.map((row) => ({
        device: row.device ?? "other",
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
      .where({ eventType: "view" })
      .countDistinct({ unique: "link_events.visitorId" })
      .count({ total: "*" })
      .first()) as AggregateRow;
    const organic = (await scope
      .clone()
      .where({ eventType: "view" })
      .whereRaw("link_events.referrer ~ ?", [organicReferrerPattern])
      .count({ organic: "*" })
      .first()) as AggregateRow;
    const ctaClicks = (await scope
      .clone()
      .where({ eventType: "cta_click" })
      .count({ ctaClicks: "*" })
      .first()) as AggregateRow;
    // The link row is already resolved; a view counts toward CTA impressions
    // only when this link actually renders an interstitial.
    const ctaViews = row.ctaHeading
      ? ((await scope
          .clone()
          .where({ eventType: "view" })
          .count({ total: "*" })
          .first()) as AggregateRow)
      : null;

    const referrers = await analyticsBreakdown(scope, "referrer");
    const countries = await analyticsBreakdown(scope, "country");
    const cities = await analyticsBreakdown(scope, "city");
    const devices = await analyticsBreakdown(scope, "device");

    const dailyViews = (await scope
      .clone()
      .where({ eventType: "view" })
      .groupByRaw("date_trunc('day', link_events.created_at)")
      .select(db.raw("date_trunc('day', link_events.created_at) as day"), {
        views: db.raw("count(*)"),
      })
      .orderBy("day", "asc")) as unknown as DailyRow[];

    const analytics: LinkAnalytics = {
      link: toPublicLink(row, protocol),
      views: Number(totals?.total ?? 0),
      uniqueVisitors: Number(totals?.unique ?? 0),
      organicViews: Number(organic?.organic ?? 0),
      ctaViews: Number(ctaViews?.total ?? 0),
      ctaClicks: Number(ctaClicks?.ctaClicks ?? 0),
      referrers: referrers.map((entry) => ({
        referrer: entry.referrer ?? null,
        views: Number(entry.views ?? 0),
      })),
      countries: countries.map((entry) => ({
        country: entry.country ?? null,
        views: Number(entry.views ?? 0),
      })),
      cities: cities.map((entry) => ({
        city: entry.city ?? null,
        views: Number(entry.views ?? 0),
      })),
      devices: devices.map((entry) => ({
        device: entry.device ?? "other",
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
