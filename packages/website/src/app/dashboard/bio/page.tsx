import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BioManager } from "@/components/bio-manager";
import { fetchBio } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function BioDashboardPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
  if (!configured) redirect("/sign-in?redirect_url=/dashboard/bio");

  const session = await auth();
  if (!session.userId) redirect("/sign-in?redirect_url=/dashboard/bio");

  const token = await session.getToken();
  if (!token) redirect("/sign-in?redirect_url=/dashboard/bio");

  const bio = await fetchBio(token).catch(() => null);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ink-label">Link in bio</p>
            <h1 className="mt-2 font-display text-4xl text-cerulean">
              Your page
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="ink-button ink-button-quiet text-sm"
          >
            Back to dashboard
          </Link>
        </div>
        <div className="mt-8">
          <BioManager initial={bio} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
