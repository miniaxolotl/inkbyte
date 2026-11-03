import "server-only";

const origin =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
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
    "Create short links, download QR codes, share a link-in-bio page and understand your traffic with privacy-conscious click analytics.",
  url: url.origin,
  creator: "Bramble Labs Inc.",
  indexable,
} as const;

export type Site = typeof site;
