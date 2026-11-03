import Image from "next/image";
import Link from "next/link";
import { ArrowDown, Check, Link2 } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { ShortenForm } from "@/components/shorten-form";
import { FeatureList } from "@/components/feature-list";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fetchDomains } from "@/lib/api";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import { HelpQuestions } from "@/components/help-questions";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(site.title, site.description, "/");

export default async function HomePage() {
  const configured = Boolean(
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  const [domains, session] = await Promise.all([
    fetchDomains().catch(() => []),
    configured ? auth() : null,
  ]);
  const authenticated = Boolean(session?.userId);
  const accountHref = authenticated ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main-content" className="ink-home flex-1">
        <section
          className="ink-home-wrap ink-home-hero"
          aria-labelledby="hero-title"
        >
          <div className="ink-home-copy">
            <h1 id="hero-title" className="ink-home-title">
              A little link.
              <br />A lot to share.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              InkByte makes long links easy to share. Add a QR code, see how
              often a link is opened, or put your favourite links on one page.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={accountHref}
                className="ink-button min-h-12 px-6 text-base"
              >
                {authenticated ? "Go to your dashboard" : "Get started"}
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-cerulean underline underline-offset-4"
              >
                How it works <ArrowDown aria-hidden size={16} />
              </a>
            </div>
            <p className="mt-4 text-xs text-ink-faint">
              Your links, saved in your account. Ready when you are.
            </p>
          </div>

          <section
            id="create-link"
            aria-labelledby="create-link-title"
            className="ink-home-composer scroll-mt-8"
          >
            <div className="flex items-start gap-3 border-b border-rule px-5 py-5 sm:px-6">
              <span className="mt-1 text-cerulean">
                <Link2 aria-hidden size={24} />
              </span>
              <div>
                <h2
                  id="create-link-title"
                  className="font-display text-xl text-ink"
                >
                  Make a short link
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Paste the web address you want to share.
                </p>
              </div>
            </div>
            <ShortenForm
              domains={domains}
              authenticated={authenticated}
              compact
            />
          </section>

          <figure className="ink-home-example">
            <Image
              src="/assets/logo/default.svg"
              alt="InkByte"
              width={112}
              height={112}
              priority
              className="h-24 w-24 sm:h-28 sm:w-28"
            />
            <div className="min-w-0">
              <p className="truncate text-xs text-ink-faint">
                example.com/a-very-long-link-to-something-good
              </p>
              <p className="mt-2 break-all font-display text-2xl text-cerulean sm:text-3xl">
                inkb.ca/hello
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                Less link. More room for your message.
              </p>
            </div>
            <figcaption className="col-span-2 text-xs text-ink-faint">
              An example of a short link. Yours can have its own name.
            </figcaption>
          </figure>
        </section>

        <div className="ink-home-wrap">
          <ul className="ink-home-reasons" aria-label="Ways to share">
            {[
              "Less clutter in your messages",
              "One link in your profile",
              "A quick scan in the real world",
            ].map((reason) => (
              <li key={reason}>
                <Check
                  aria-hidden
                  size={18}
                  className="shrink-0 text-cerulean"
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <section
          id="how-it-works"
          className="ink-home-wrap ink-home-section scroll-mt-8"
          aria-labelledby="how-title"
        >
          <div className="ink-home-section-heading">
            <h2 id="how-title">
              From copy to share,
              <br />
              in a few taps.
            </h2>
            <p>
              No complicated setup. Just a web address and something you want to
              share.
            </p>
          </div>
          <ol className="ink-home-steps">
            {[
              {
                title: "Paste a link",
                text: "A favourite read, a new project, an event invitation. Start with its web address.",
              },
              {
                title: "Make it yours",
                text: "Choose a short name that’s easy to remember, or let InkByte pick one for you.",
              },
              {
                title: "Send it on",
                text: "Copy your link into a message or profile. Download its QR code when a scan makes more sense.",
              },
            ].map((step, index) => (
              <li key={step.title}>
                <span className="ink-home-step-number" aria-hidden>
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-xl text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="ink-home-wrap ink-home-section border-t border-rule"
          aria-labelledby="features-title"
        >
          <div className="ink-home-section-heading">
            <h2 id="features-title">
              Not just shorter.
              <br />
              More useful.
            </h2>
            <p>
              A link can do more than take someone somewhere. Make it easier to
              find, easier to share and easier to keep up to date.
            </p>
          </div>
          <div id="features" className="mt-10">
            <FeatureList />
          </div>
        </section>

        <section
          className="ink-home-wrap ink-home-callout"
          aria-labelledby="sharing-title"
        >
          <div>
            <h2
              id="sharing-title"
              className="font-display text-3xl leading-tight sm:text-4xl"
            >
              Got something worth sharing?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85">
              Give it a little link. Keep the link, its QR code and its click
              reports together in your account.
            </p>
          </div>
          <Link
            href={accountHref}
            className="ink-button min-h-12 shrink-0 bg-white px-6 text-navy hover:bg-paper hover:text-navy"
          >
            {authenticated ? "Open your dashboard" : "Create your account"}
          </Link>
        </section>

        <section
          className="ink-home-wrap ink-home-section"
          aria-labelledby="questions-title"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="questions-title"
              className="font-display text-3xl leading-tight text-ink sm:text-4xl"
            >
              A little help, if you need it.
            </h2>
            <p className="mt-4 text-base text-ink-soft">
              A few answers before you make your first link.
            </p>
            <div className="mt-8">
              <HelpQuestions limit={4} />
            </div>
            <Link
              href="/help"
              className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-cerulean underline underline-offset-4"
            >
              More help with your links
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
