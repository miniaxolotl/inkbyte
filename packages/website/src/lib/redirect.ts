import "server-only";
import { fetchDomains } from "./api";
import {
  shortLinkNotFoundHtml,
  shortLinkUnavailableHtml,
} from "./short-link-error";

type Context = { params: Promise<{ slug: string }> };

/** Keep the browser on its short domain so its first-party cookie survives. */
export async function resolveShortLink(request: Request, context: Context) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  };
  const unavailable = () =>
    new Response(shortLinkUnavailableHtml, {
      status: 503,
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "30",
      },
    });
  const missing = () =>
    new Response(shortLinkNotFoundHtml, {
      status: 404,
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  // Link prefetches must never become clicks.
  if (
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch")
  ) {
    return new Response(null, { status: 204, headers });
  }
  const { slug } = await context.params;
  const apiOrigin = process.env.INKBYTE_API_URL;
  if (!apiOrigin) return unavailable();
  const url = new URL(request.url);
  try {
    const domains = await fetchDomains();
    const host = url.hostname.replace(/^www\./, "");
    const requested = url.searchParams.get("domain") ?? host;
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(host);
    const domain =
      domains.find((entry) => entry.slug === requested)?.slug ??
      (loopback ? domains[0]?.slug : undefined);
    if (!domain) return missing();

    const metadataOnly = request.method === "HEAD";
    const target = new URL(
      metadataOnly
        ? `/api/v1/public/links/${encodeURIComponent(slug)}`
        : `/r/${encodeURIComponent(slug)}`,
      apiOrigin,
    );
    target.searchParams.set("domain", domain);
    target.searchParams.set("format", "json");
    const conversion = url.searchParams.get("e") === "cta_click";
    if (conversion) target.searchParams.set("e", "cta_click");
    const forwarded = new Headers();
    for (const key of [
      "user-agent",
      "referer",
      "x-forwarded-for",
      "cf-ipcountry",
      "cf-ipcity",
      "cf-ipregion",
      "x-vercel-ip-country",
      "x-vercel-ip-city",
      "x-vercel-ip-country-region",
    ]) {
      const value = request.headers.get(key);
      if (value) forwarded.set(key, value);
    }
    const cookie = request.headers
      .get("cookie")
      ?.split(";")
      .find((part) => part.trim().startsWith("inkbyte_vid="));
    if (cookie) forwarded.set("cookie", cookie.trim());
    forwarded.set(
      "x-forwarded-proto",
      url.protocol === "https:" ? "https" : "http",
    );
    const upstream = await fetch(target, {
      headers: forwarded,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
    });
    if (upstream.status === 404) return missing();
    if (!upstream.ok) return unavailable();
    const payload = (await upstream.json()) as {
      data: { link: { longUrl: string; cta: unknown } };
    };
    const destination = new URL(payload.data.link.longUrl);
    if (!["https:", "http:"].includes(destination.protocol)) return missing();
    const outgoing = new Headers(headers);
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) outgoing.set("set-cookie", setCookie);
    const interstitial = new URL(
      `/visit/${encodeURIComponent(slug)}`,
      url.origin,
    );
    interstitial.searchParams.set("domain", domain);
    outgoing.set(
      "location",
      payload.data.link.cta && !conversion
        ? interstitial.toString()
        : destination.toString(),
    );
    return new Response(null, {
      status: payload.data.link.cta && !conversion ? 303 : 302,
      headers: outgoing,
    });
  } catch {
    return unavailable();
  }
}
