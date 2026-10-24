import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { fetchDomains } from "@/lib/api";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Public short-link resolver. The page asks the API to resolve the link,
 * which records the click, and then forwards the visitor to the destination.
 */
export default async function RedirectPage({ params }: PageProps) {
  const { slug } = await params;
  const apiOrigin = process.env.INKBYTE_API_URL;
  if (!apiOrigin) notFound();

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const domain = host.replace(/^www\./, "");

  let domains: string[] = [];
  try {
    domains = (await fetchDomains()).map((entry) => entry.slug);
  } catch {
    domains = [];
  }
  const selected = domains.includes(domain) ? domain : domains[0];
  if (!selected) notFound();

  const target = new URL(`/r/${encodeURIComponent(slug)}`, apiOrigin);
  target.searchParams.set("domain", selected);

  let location: string | null = null;
  try {
    const upstream = await fetch(target, {
      headers: {
        "user-agent": headerList.get("user-agent") ?? "",
        referer: headerList.get("referer") ?? "",
        "x-forwarded-for": headerList.get("x-forwarded-for") ?? "",
        "cf-ipcountry": headerList.get("cf-ipcountry") ?? "",
        "x-visitor-id": headerList.get("x-visitor-id") ?? "",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    location = upstream.headers.get("location");
  } catch {
    notFound();
  }

  if (!location) notFound();
  redirect(location);
}
