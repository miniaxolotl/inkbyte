import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ShortenForm } from "@/components/shorten-form";
import { fetchBio, fetchDomains, fetchLinks, fetchOverview } from "@/lib/api";
import { DeleteLinkButton } from "@/components/delete-link-button";
import { QrButton } from "@/components/qr-button";

export const dynamic = "force-dynamic";

const number = new Intl.NumberFormat("en-CA");

export default async function DashboardPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
  if (!configured) redirect("/sign-in?redirect_url=/dashboard");

  const session = await auth();
  if (!session.userId) redirect("/sign-in?redirect_url=/dashboard");

  const token = await session.getToken();
  if (!token) redirect("/sign-in?redirect_url=/dashboard");

  const [domainResult, linkResult, overviewResult, bioResult] =
    await Promise.allSettled([
      fetchDomains(),
      fetchLinks(token),
      fetchOverview(token),
      fetchBio(token),
    ]);
  const domains = domainResult.status === "fulfilled" ? domainResult.value : [];
  const links = linkResult.status === "fulfilled" ? linkResult.value : [];
  const overview =
    overviewResult.status === "fulfilled" ? overviewResult.value : null;
  const bio = bioResult.status === "fulfilled" ? bioResult.value : null;
  const loadFailed =
    linkResult.status === "rejected" || overviewResult.status === "rejected";

  const stats = [
    { label: "Links Created", value: overview?.links ?? links.length },
    { label: "Total Clicks", value: overview?.totalViews ?? 0 },
    { label: "Unique Clicks", value: overview?.uniqueVisitors ?? 0 },
    { label: "Organic Clicks", value: overview?.organicViews ?? 0 },
  ];

  const topLinks = overview?.topLinks ?? [];
  const referrers = overview?.referrers ?? [];
  const countries = overview?.countries ?? [];
  const cities = overview?.cities ?? [];
  const devices = overview?.devices ?? [];

  const sidebar = [
    { label: "Overview", href: "/dashboard" },
    { label: "All links", href: "/dashboard#links" },
    { label: "Link in bio", href: "/dashboard/bio" },
    { label: "Help", href: "/help" },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8"
      >
        <h1 className="font-display text-4xl text-cerulean">Dashboard</h1>
        {loadFailed ? (
          <p role="alert" className="ink-card mt-4 p-4 text-rose-deep">
            Analytics could not be loaded. Refresh to retry; any counts below
            may be unavailable.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <nav
            aria-label="Workspace navigation"
            className="ink-card h-fit shrink-0 p-4 lg:sticky lg:top-6 lg:w-48"
          >
            <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold lg:flex-col">
              {sidebar.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-ink-soft hover:text-cerulean"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="ink-card p-4">
                  <p className="ink-label">{stat.label}</p>
                  <p className="mt-2 font-display text-2xl text-ink">
                    {loadFailed ? "—" : number.format(stat.value)}
                  </p>
                </div>
              ))}
            </section>

            <section
              id="links"
              className="ink-card overflow-hidden scroll-mt-24"
            >
              <div className="flex items-center justify-between border-b border-rule px-5 py-4">
                <h2 className="font-display text-lg text-cerulean">
                  All links
                </h2>
                <span className="text-sm text-ink-faint">
                  {links.length} total
                </span>
              </div>
              {links.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-soft">
                  No links yet. Create your first short link below.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-ink-faint">
                      <tr>
                        <th className="px-5 py-3 font-medium">Short link</th>
                        <th className="px-5 py-3 font-medium">Destination</th>
                        <th className="px-5 py-3 font-medium">Clicks</th>
                        <th className="px-5 py-3 font-medium">Visitors</th>
                        <th className="px-5 py-3 font-medium">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.map((link) => (
                        <tr key={link.id} className="border-t border-rule">
                          <td className="px-5 py-3">
                            <Link
                              prefetch={false}
                              href={link.shortUrl}
                              className="font-display font-semibold text-cerulean underline underline-offset-4"
                              rel="noreferrer"
                            >
                              {link.domain.slug}/{link.slug}
                            </Link>
                            <Link
                              href={`/dashboard/links/${link.id}`}
                              className="mt-1 block text-xs text-cerulean underline"
                            >
                              Edit &amp; analytics
                            </Link>
                            {link.cta ? (
                              <p className="mt-0.5 text-xs text-peach">
                                CTA · {link.cta.heading}
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
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <QrButton
                                slug={link.slug}
                                domain={link.domain.slug}
                              />
                              <DeleteLinkButton id={link.id} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="ink-card p-5">
                <h2 className="font-display text-lg text-rose-deep">
                  Top Links
                </h2>
                <ul className="mt-4 flex flex-col gap-2 text-sm">
                  {topLinks.length === 0 ? (
                    <li className="text-ink-soft">No clicks yet.</li>
                  ) : (
                    topLinks.map((entry, index) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 truncate text-ink-soft">
                          {index + 1}. {entry.slug}
                        </span>
                        <span className="tabular-nums">
                          {number.format(entry.views)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="ink-card p-5">
                <h2 className="font-display text-lg text-rose-deep">
                  Top Referrers
                </h2>
                <ul className="mt-4 flex flex-col gap-2 text-sm">
                  {referrers.length === 0 ? (
                    <li className="text-ink-soft">No referrers yet.</li>
                  ) : (
                    referrers.map((entry) => (
                      <li
                        key={entry.referrer ?? "direct"}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 truncate text-ink-soft">
                          {entry.referrer ?? "Direct visits"}
                        </span>
                        <span className="tabular-nums">
                          {number.format(entry.views)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="ink-card p-5">
                <h2 className="font-display text-lg text-rose-deep">
                  Top Countries
                </h2>
                <ul className="mt-4 flex flex-col gap-2 text-sm">
                  {countries.length === 0 ? (
                    <li className="text-ink-soft">No countries yet.</li>
                  ) : (
                    countries.map((entry) => (
                      <li
                        key={entry.country ?? "unknown"}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-ink-soft">
                          {entry.country ?? "Unknown"}
                        </span>
                        <span className="tabular-nums">
                          {number.format(entry.views)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="ink-card p-5">
                <h2 className="font-display text-lg text-rose-deep">
                  Top Cities
                </h2>
                <ul className="mt-4 flex flex-col gap-2 text-sm">
                  {cities.length === 0 ? (
                    <li className="text-ink-soft">No cities yet.</li>
                  ) : (
                    cities.map((entry) => (
                      <li
                        key={entry.city ?? "unknown"}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-ink-soft">
                          {entry.city ?? "Unknown"}
                        </span>
                        <span className="tabular-nums">
                          {number.format(entry.views)}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>

            {devices.length > 0 ? (
              <section className="ink-card p-5">
                <h2 className="font-display text-lg text-rose-deep">Devices</h2>
                <ul className="mt-4 flex flex-wrap gap-4 text-sm">
                  {devices.map((entry) => (
                    <li key={entry.device} className="text-ink-soft">
                      <span className="font-display text-ink">
                        {number.format(entry.views)}
                      </span>{" "}
                      {entry.device}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {bio ? (
              <section className="ink-card p-5">
                <h2 className="font-display text-lg text-cerulean">
                  Link in bio
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Your page is live at{" "}
                  <Link
                    href={`/b/${bio.handle}`}
                    className="font-display text-cerulean underline underline-offset-4"
                  >
                    /b/{bio.handle}
                  </Link>{" "}
                  with {bio.items.length} item
                  {bio.items.length === 1 ? "" : "s"}.
                </p>
                <Link href="/dashboard/bio" className="ink-button mt-4 text-sm">
                  Manage page
                </Link>
              </section>
            ) : null}

            <section>
              <h2 className="font-display text-lg text-cerulean">
                Create a link
              </h2>
              <div className="mt-4">
                <ShortenForm domains={domains} authenticated />
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
