import { redirect } from "next/navigation";
import { fetchDomains } from "@/lib/api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Public short-link resolver. The website forwards the request to the API,
 * which records the click and returns the destination.
 */
export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const apiOrigin = process.env.INKBYTE_API_URL;
  if (!apiOrigin) {
    return new Response("InkByte is not configured.", { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? requestUrl.host;
  const domain = host.replace(/^www\./, "");

  const known = await fetchDomains().catch(() => []);
  const domains = known.map((entry) => entry.slug);
  const selected = domains.includes(domain) ? domain : domains[0];
  if (!selected) {
    return new Response("No short domains are configured.", { status: 503 });
  }

  const target = new URL(
    `/r/${encodeURIComponent(slug)}?domain=${encodeURIComponent(selected)}`,
    apiOrigin,
  );

  const upstream = await fetch(target, {
    headers: {
      "user-agent": request.headers.get("user-agent") ?? "",
      referer: request.headers.get("referer") ?? "",
      "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      "cf-ipcountry": request.headers.get("cf-ipcountry") ?? "",
      "x-visitor-id":
        request.headers.get("x-visitor-id") ??
        request.headers.get("x-real-ip") ??
        "",
    },
    redirect: "manual",
    cache: "no-store",
  });

  const location = upstream.headers.get("location");
  if (!location) {
    return new Response("That link does not exist.", { status: 404 });
  }

  redirect(location);
}
