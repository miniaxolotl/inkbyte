import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-chrome";

export default function SignInPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Sign in to InkByte
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          Your links and their analytics live behind your account.
        </p>
        <div className="mt-8 ink-card p-6">
          {configured ? (
            <SignIn />
          ) : (
            <p className="text-sm text-ink-soft">
              Account sign-in is awaiting Clerk configuration for this
              deployment. Set{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
              and <code className="font-mono text-xs">CLERK_SECRET_KEY</code> to
              enable it.
            </p>
          )}
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          New here?{" "}
          <Link className="text-sky underline underline-offset-4" href="/sign-up">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
