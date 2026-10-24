import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-chrome";

export default function SignUpPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Create your InkByte account
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          One account for every short link, alias and analytics report.
        </p>
        <div className="mt-8 ink-card p-6">
          {configured ? (
            <SignUp />
          ) : (
            <p className="text-sm text-ink-soft">
              Account creation is awaiting Clerk configuration for this
              deployment.
            </p>
          )}
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Already have an account?{" "}
          <Link className="text-sky underline underline-offset-4" href="/sign-in">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
