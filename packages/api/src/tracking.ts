import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const VISITOR_COOKIE = "inkbyte_vid";
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 365;

export function referrerOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

/** Match search origins only, not arbitrary hosts containing a provider name. */
export const organicReferrerPattern =
  "^https?://(www\\.)?(google\\.[a-z.]+|bing\\.com|duckduckgo\\.com|search\\.yahoo\\.com|search\\.brave\\.com)$";

/**
 * Resolves the visitor identity for a redirect.
 *
 * The cookie is authoritative when present: it is HttpOnly, set only by the
 * API, signed with a server-only key, and stable across visits. A missing or
 * forged cookie gets a random identity rather than a fingerprint of an IP.
 * Client-supplied visitor headers are never trusted. Visitors who clear their
 * cookies appear as new visitors; these are approximate browser counts.
 */
export function resolveVisitor(
  request: Request,
  secret: string,
): {
  visitorId: string;
  existingCookie: string | null;
} {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(
      `(?:^|;\\s*)${VISITOR_COOKIE}=([A-Za-z0-9_-]{32})\\.([A-Za-z0-9_-]{43})(?:;|$)`,
    ),
  );
  const signature = match?.[1] ? sign(match[1], secret) : null;
  if (
    match?.[1] &&
    match[2] &&
    signature &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(match[2]))
  ) {
    return { visitorId: match[1], existingCookie: match[1] };
  }

  return {
    visitorId: randomBytes(24).toString("base64url"),
    existingCookie: null,
  };
}

const sign = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");

/** Builds the Set-Cookie header that carries the visitor identity. */
export function visitorCookieHeader(
  visitorId: string,
  isHttps: boolean,
  secret: string,
): string {
  const parts = [
    `${VISITOR_COOKIE}=${visitorId}.${sign(visitorId, secret)}`,
    "Path=/",
    `Max-Age=${VISITOR_TTL_SECONDS}`,
    "SameSite=Lax",
    "HttpOnly",
  ];
  if (isHttps) parts.push("Secure");
  return parts.join("; ");
}

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawl/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /slackbot/i,
  /whatsapp/i,
  /discordapp/i,
  /telegrambot/i,
  /preview/i,
  /fetcher/i,
  /pingdom/i,
  /uptimerobot/i,
  /headlesschrome/i,
  /lighthouse/i,
];

/**
 * Link previews and uptime probes are not people. They are still redirected,
 * but excluded from analytics so they cannot inflate click counts.
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length === 0) return true;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export type Device = "mobile" | "tablet" | "desktop" | "other";

export function parseDevice(userAgent: string | null): Device {
  if (!userAgent) return "other";
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|Android.*Mobile|Windows Phone/i.test(userAgent))
    return "mobile";
  if (/Android/i.test(userAgent)) return "tablet";
  if (/Windows|Macintosh|Mac OS X|Linux|X11/i.test(userAgent)) return "desktop";
  return "other";
}

/**
 * Edge geo headers. Cloudflare supplies cf-ipcountry/cf-ipcity/cf-ipregion;
 * Vercel supplies x-vercel-ip-country/city/region. Either is accepted.
 */
export function resolveGeo(request: Request): {
  country: string | null;
  city: string | null;
  region: string | null;
} {
  const header = (...names: string[]) => {
    for (const name of names) {
      const value = request.headers.get(name);
      if (value) return value.slice(0, 128);
    }
    return null;
  };
  return {
    country: header("cf-ipcountry", "x-vercel-ip-country"),
    city: header("cf-ipcity", "x-vercel-ip-city"),
    region: header("cf-ipregion", "x-vercel-ip-region"),
  };
}
