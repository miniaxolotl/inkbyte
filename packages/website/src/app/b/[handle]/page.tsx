import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ handle: string }> };

type BioPage = {
  handle: string;
  heading: string;
  bio: string;
  items: Array<{ id: string; label: string; slug: string; domain: string }>;
};

const getBioPage = cache(async (handle: string): Promise<BioPage | null> => {
  const apiOrigin = process.env.INKBYTE_API_URL;
  if (!apiOrigin) return null;
  try {
    const response = await fetch(
      `${apiOrigin}/api/v1/public/bio/${encodeURIComponent(handle)}`,
      { cache: "no-store", signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { data: { bio: BioPage } };
    return payload.data.bio;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: PageProps) {
  const page = await getBioPage((await params).handle);
  return page
    ? pageMetadata(
        "Link in bio",
        "Explore the links shared on this InkByte bio page. Choose a link to visit its destination.",
      )
    : pageMetadata(
        "Page not found",
        "This bio page could not be found. Check the address or ask its owner for an updated InkByte link.",
      );
}

export default async function BioPage({ params }: PageProps) {
  const { handle } = await params;
  const page = await getBioPage(handle);
  if (!page) notFound();

  const domain = process.env.SITE_URL
    ? new URL(process.env.SITE_URL).hostname
    : "inkbyte.ca";

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center px-6 py-16"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        <p className="ink-label">Link in bio</p>
        <h1 className="font-display text-3xl text-ink">
          {page.heading || `@${page.handle}`}
        </h1>
        {page.bio ? (
          <p className="text-sm leading-relaxed text-ink-soft">{page.bio}</p>
        ) : null}
      </div>
      <nav className="mt-10 flex w-full max-w-md flex-col gap-3">
        {page.items.length === 0 ? (
          <p className="text-center text-sm text-ink-faint">
            Nothing here yet.
          </p>
        ) : (
          page.items.map((item) => (
            <a
              key={item.id}
              href={`/r/${encodeURIComponent(item.slug)}?domain=${encodeURIComponent(item.domain)}`}
              className="ink-card px-5 py-4 text-center font-display text-base text-cerulean transition-transform hover:-translate-y-0.5"
            >
              {item.label}
            </a>
          ))
        )}
      </nav>
      <p className="mt-16 text-xs text-ink-faint">
        Built with{" "}
        <Link href="/" className="text-cerulean underline underline-offset-4">
          InkByte
        </Link>
        {" · "}
        {domain}/{page.handle}
      </p>
    </main>
  );
}
