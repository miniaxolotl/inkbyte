import { SiteHeader, SiteFooter } from "@/components/site-chrome";
export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy | InkByte" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-6 py-12"
      >
        <h1 className="font-display text-4xl text-cerulean">
          Privacy at InkByte
        </h1>
        <div className="ink-card mt-8 space-y-6 p-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-xl text-ink">
              Your account and links
            </h2>
            <p className="mt-2">
              Clerk manages account sign-in and recovery. InkByte stores your
              verified account identifier, link destinations, bio-page content
              and link settings in PostgreSQL on Neon. The API is designed to
              restrict account data to its owner.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-ink">
              Link click reports
            </h2>
            <p className="mt-2">
              When tracking is enabled on a link, InkByte records a navigation
              or CTA continuation, an approximate browser identity, a referrer
              origin, device information inferred from the user agent, and
              location hints when the hosting edge provides them. A signed
              first-party cookie recognises repeat browsers. IP addresses and
              private referrer paths or search strings are not stored. Bot
              filtering is heuristic; counts are not a measure of individual
              people.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-ink">
              Optional website analytics
            </h2>
            <p className="mt-2">
              Vercel Web Analytics and Speed Insights are disabled until you opt
              in using “Privacy & analytics” in the footer. They are restricted
              to public informational pages; account routes, bio handles and
              short-link paths are excluded. URLs are stripped of query strings
              and fragments. Do Not Track and Global Privacy Control disable
              these integrations.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-ink">This browser</h2>
            <p className="mt-2">
              Recent-link history and your analytics preference are stored
              locally in your browser. Removing a history entry does not delete
              the underlying short link. You can withdraw optional analytics
              consent at any time using the footer controls.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
