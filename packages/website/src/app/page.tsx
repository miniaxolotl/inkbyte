import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ShortenForm } from "@/components/shorten-form";
import { fetchDomains } from "@/lib/api";

export const dynamic = "force-dynamic";

const features = [
  {
    title: "Links that stay yours",
    body: "Every short link lives on a domain you control, with aliases that are easy to read and easy to remember.",
  },
  {
    title: "Analytics you can trust",
    body: "Views, unique visitors, referrers and countries come from real click records in Postgres, not placeholder numbers.",
  },
  {
    title: "Privacy first",
    body: "InkByte stores a hashed visitor identifier instead of raw IP addresses, and it runs entirely on infrastructure you own.",
  },
];

export default async function HomePage() {
  const domains = await fetchDomains().catch(() => []);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="ink-label">URL shortener</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Short links that carry the whole story.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              InkByte turns long, unwieldy URLs into short links on your own
              domain and records every click so you can see what actually
              works.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/dashboard" className="ink-button">
                Open the dashboard
              </Link>
              <a href="#features" className="ink-button ink-button-quiet">
                See what it does
              </a>
            </div>
          </div>

          <ShortenForm domains={domains} token={null} />
        </div>

        <section id="features" className="mt-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Built for links you actually keep
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="ink-card p-6">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
