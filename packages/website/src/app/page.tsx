import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { ShortenForm } from "@/components/shorten-form";
import { FeatureList } from "@/components/feature-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fetchDomains } from "@/lib/api";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(site.title, site.description, "/");

export default async function HomePage() {
  const domains = await fetchDomains().catch(() => []);
  const authenticated = Boolean(
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    (await auth()).userId,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-5 pb-8 pt-8 sm:px-8 sm:pt-12"
      >
        <Image
          src="/assets/logo/default.svg"
          alt="InkByte"
          width={224}
          height={224}
          priority
          className="h-32 w-32 sm:h-44 sm:w-44"
        />

        <div className="flex w-full flex-col gap-3">
          <div className="mb-4 text-center">
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
              Short links. Clear insights.
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
              Make your next link easier to share. Keep its QR code, destination
              and click reports in one place.
            </p>
          </div>
          <ShortenForm domains={domains} authenticated={authenticated} />

          <details className="ink-card group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-ink-soft [&::-webkit-details-marker]:hidden">
              <span className="italic">
                InkByte is a URL shortener with real click analytics, on your
                own domain.
              </span>
              <span className="ink-button shrink-0 px-3 py-1 text-xs group-open:hidden">
                Learn more
              </span>
              <span className="ink-button ink-button-quiet hidden shrink-0 px-3 py-1 text-xs group-open:inline-flex">
                Close details
              </span>
            </summary>
            <section id="features" className="mt-6 w-full scroll-mt-24">
              <FeatureList />
            </section>
          </details>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
