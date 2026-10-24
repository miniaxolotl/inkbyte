import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function VisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ domain?: string }>;
}) {
  const { slug } = await params;
  const { domain } = await searchParams;
  const result = await api<{
    link: {
      longUrl: string;
      domain: string;
      cta: { heading: string; body: string; action: string } | null;
    };
  }>(
    `/api/v1/public/links/${encodeURIComponent(slug)}?domain=${encodeURIComponent(domain ?? "")}`,
  ).catch(() => null);
  if (!result) notFound();
  const { link } = result;
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-6 py-12"
    >
      <Image
        src="/assets/logo/default.svg"
        alt="InkByte"
        width={96}
        height={96}
      />
      <div className="ink-card mt-6 w-full max-w-md p-6 text-center">
        <h1 className="font-display text-2xl">
          {link.cta?.heading ?? "Your destination"}
        </h1>
        {link.cta?.body ? (
          <p className="mt-3 text-sm text-ink-soft">{link.cta.body}</p>
        ) : null}
        <a
          href={`/r/${encodeURIComponent(slug)}?domain=${encodeURIComponent(link.domain)}&e=cta_click`}
          className="ink-button mt-6 w-full"
        >
          {link.cta?.action ?? "Continue"}
        </a>
        <p className="mt-4 truncate text-xs text-ink-faint">
          {new URL(link.longUrl).hostname}
        </p>
      </div>
    </main>
  );
}
