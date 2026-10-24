import { createHash, randomBytes } from "node:crypto";

export const VISITOR_COOKIE = "inkbyte_vid";
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 365;

/**
 * Resolves the visitor identity for a redirect.
 *
 * The cookie is authoritative when present: it is HttpOnly, set only by the
 * API, and stable across visits. When it is absent a per-day digest of the
 * client address and user agent is used, so repeat visitors from the same
 * network still collapse to one identity without storing a raw address.
 * Client-supplied visitor headers are never trusted; they are trivially
 * spoofable and would inflate unique-visitor counts.
 */
export function resolveVisitor(request: Request): {
  visitorId: string;
  existingCookie: string | null;
} {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([A-Za-z0-9_-]{16,64})`),
  );
  if (match?.[1]) {
    return { visitorId: match[1], existingCookie: match[1] };
  }

  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const digest = createHash("sha256")
    .update(`${day}|${address}|${userAgent}`)
    .digest("base64url")
    .slice(0, 32);
  return { visitorId: digest, existingCookie: null };
}

/** Builds the Set-Cookie header that carries the visitor identity. */
export function visitorCookieHeader(
  visitorId: string,
  isHttps: boolean,
): string {
  const parts = [
    `${VISITOR_COOKIE}=${visitorId}`,
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
  if (/Windows|Macintosh|Mac OS X|Linux|X11/i.test(userAgent))
    return "desktop";
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
