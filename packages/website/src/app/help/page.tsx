import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { pageMetadata } from "@/lib/metadata";
import { HelpQuestions } from "@/components/help-questions";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Help",
  "Simple answers about making short links, QR codes, updating your links and sharing them with others.",
  "/help",
);

export default function HelpPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8"
      >
        <h1 className="font-display text-4xl leading-tight text-ink">
          A little help with your links.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          Quick answers to help you get back to sharing.
        </p>
        <div className="mt-10">
          <HelpQuestions />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
