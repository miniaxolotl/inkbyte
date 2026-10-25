import Image from "next/image";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AccountUnavailable } from "@/components/account-unavailable";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Create an account",
  "Create your InkByte account to keep your short links, QR codes, bio page and click reports together.",
);

export default function SignUpPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12"
      >
        <Image
          src="/assets/logo/default.svg"
          alt=""
          width={96}
          height={96}
          className="h-20 w-20"
        />
        <h1 className="mt-6 font-display text-3xl text-cerulean">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          One account for every short link, QR code and analytics report.
        </p>
        <div className="ink-card mt-8 w-full p-6">
          {configured ? <SignUp /> : <AccountUnavailable />}
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Already have an account?{" "}
          <Link
            className="text-cerulean underline underline-offset-4"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
