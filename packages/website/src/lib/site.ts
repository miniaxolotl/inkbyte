import "server-only";

const origin =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.RAILWAY_PUBLIC_DOMAIN &&
    `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`) ||
  "http://localhost:3000";

const url = new URL(origin);
if (url.protocol !== "http:" && url.protocol !== "https:") {
  throw new Error(`SITE_URL must use http or https, received ${url.protocol}`);
}

const indexable =
  process.env.SITE_NOINDEX !== "true" &&
  process.env.VERCEL_ENV !== "preview" &&
  !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

export const site = {
  name: "InkByte",
  title: "InkByte — short links with real analytics",
  description:
    "Shorten links, keep your brand, and see exactly who clicks. InkByte is a fast, self-hostable link shortener with privacy-friendly analytics.",
  url: url.origin,
  creator: "Bramble Labs Inc.",
  indexable,
} as const;

export type Site = typeof site;
