import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { WebsitePrivacySettings } from "./website-insights";

export const SiteHeader = async () => {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
  const userId = configured ? (await auth()).userId : null;
  return (
    <header>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-xl text-ink"
        >
          <Image src="/assets/logo/default.svg" alt="" width={36} height={36} />
          <span>
            Ink<span className="text-rose">Byte</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-soft sm:gap-5 sm:text-sm"
        >
          <Link className="hover:text-cerulean" href="/help">
            Help
          </Link>
          {userId ? (
            <>
              <Link className="hover:text-cerulean" href="/dashboard">
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link className="hover:text-cerulean" href="/sign-in">
                Login
              </Link>
              <Link
                className="ink-button px-3 py-1 text-xs sm:text-sm"
                href="/sign-up"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export const SiteFooter = () => {
  return (
    <div className="mt-16">
      {/* Original artwork, kept static to respect reduced-motion preferences. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/display/wave-static.svg"
        alt=""
        aria-hidden
        className="ink-wave"
      />
      <footer className="bg-navy">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <p>
            Made with{" "}
            <span aria-hidden className="text-rose">
              ♥
            </span>{" "}
            by{" "}
            <a
              href="https://mawa.dev"
              className="font-semibold text-white underline underline-offset-4"
            >
              Elias Mawa
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© InkByte {new Date().getFullYear()}</span>
            <Link className="underline underline-offset-4" href="/help">
              help
            </Link>
            <Link className="underline underline-offset-4" href="/privacy">
              privacy
            </Link>
            <WebsitePrivacySettings />
          </div>
        </div>
      </footer>
    </div>
  );
};
