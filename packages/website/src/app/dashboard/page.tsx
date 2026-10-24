import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ShortenForm } from "@/components/shorten-form";
import { fetchDomains, fetchLinks, fetchOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("en-CA");

export default async function DashboardPage() {
  const session = await auth();
  if (!session.userId) redirect("/sign-in?redirect_url=/dashboard");

  const token = await session.getToken();
  if (!token) redirect("/sign-in?redirect_url=/dashboard");

  const [domains, links, overview] = await Promise.all([
    fetchDomains().catch(() => []),
    fetchLinks(token).catch(() => []),
    fetchOverview(token).catch(() => null),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ink-label">Dashboard</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
              Your links
            </h1>
          </div>
          <Link href="/" className="ink-button ink-button-quiet">
            New link
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="ink-card p-5">
            <p className="ink-label">Links</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {number.format(overview?.links ?? links.length)}
            </p>
          </div>
          <div className="ink-card p-5">
            <p className="ink-label">Total clicks</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {number.format(overview?.totalViews ?? 0)}
            </p>
          </div>
          <div className="ink-card p-5">
            <p className="ink-label">Unique visitors</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {number.format(overview?.uniqueVisitors ?? 0)}
            </p>
          </div>
          <div className="ink-card p-5">
            <p className="ink-label">Clicks this week</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {number.format(overview?.viewsLast7Days ?? 0)}
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="ink-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                All links
              </h2>
              <span className="text-sm text-ink-faint">
                {links.length} total
              </span>
            </div>
            {links.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-soft">
                No links yet. Create your first short link to start tracking
                clicks.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-ink-faint">
                  <tr>
                    <th className="px-5 py-3 font-medium">Short link</th>
                    <th className="px-5 py-3 font-medium">Destination</th>
                    <th className="px-5 py-3 font-medium">Clicks</th>
                    <th className="px-5 py-3 font-medium">Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-t border-rule">
                      <td className="px-5 py-3">
                        <a
                          href={link.shortUrl}
                          className="font-display font-semibold text-sky underline underline-offset-4"
                          rel="noreferrer"
                        >
                          {link.domain.slug}/{link.slug}
                        </a>
                        {link.title ? (
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {link.title}
                          </p>
                        ) : null}
                      </td>
                      <td className="max-w-xs truncate px-5 py-3 text-ink-soft">
                        {link.longUrl}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {number.format(link.views)}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {number.format(link.uniqueVisitors)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="ink-card p-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                Create a link
              </h2>
              <div className="mt-4">
                <ShortenForm domains={domains} token={token} />
              </div>
            </div>

            <div className="ink-card p-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                Top referrers
              </h2>
              {overview && overview.referrers.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {overview.referrers.map((entry) => (
                    <li
                      key={entry.referrer ?? "direct"}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-ink-soft">
                        {entry.referrer ?? "Direct visits"}
                      </span>
                      <span className="tabular-nums text-ink">
                        {number.format(entry.views)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ink-soft">
                  Referrer data appears once your links start receiving clicks.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
