import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { fetchLinkAnalytics } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { LinkEditor } from "@/components/link-editor";
import { QrButton } from "@/components/qr-button";

export const dynamic = "force-dynamic";

export default async function LinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  )
    redirect("/sign-in");
  const token = await (await auth()).getToken();
  if (!token) redirect("/sign-in");
  const { id } = await params;
  const analytics = await fetchLinkAnalytics(token, id);
  if (!analytics) notFound();
  const { link } = analytics;
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8"
      >
        <Link className="text-cerulean underline" href="/dashboard">
          Back to dashboard
        </Link>
        <h1 className="mt-5 break-all font-display text-3xl text-cerulean">
          {link.domain.slug}/{link.slug}
        </h1>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Clicks", analytics.views],
            ["Unique visitors", analytics.uniqueVisitors],
            ["Organic clicks", analytics.organicViews],
            ["CTA clicks", analytics.ctaClicks],
          ].map(([label, value]) => (
            <div className="ink-card p-4" key={label}>
              <p className="text-xs text-ink-soft">{label}</p>
              <p className="font-display text-2xl">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          {analytics.ctaViews} CTA impressions.{" "}
          <QrButton slug={link.slug} domain={link.domain.slug} />
        </p>
        <LinkEditor link={link} />
        <section className="ink-card mt-6 p-5">
          <h2 className="font-display text-lg text-cerulean">
            Daily clicks (UTC)
          </h2>
          {analytics.dailyViews.length ? (
            <ul className="mt-3 space-y-2">
              {analytics.dailyViews.map((day) => (
                <li className="flex justify-between" key={day.day}>
                  <span>{day.day}</span>
                  <span>{day.views}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              No clicks recorded yet.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
