import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const dynamic = "force-dynamic";

const topics = [
  {
    question: "How do I shorten a link?",
    answer:
      "Create an account, paste the destination URL on the dashboard, pick a domain and an optional alias, and create the link. Every link you create is yours to edit, deactivate or delete.",
  },
  {
    question: "What is a call to action?",
    answer:
      "A call to action shows a short interstitial before the destination loads. You set the heading, the body and the button text; InkByte records both the view and the button click so you can measure conversion.",
  },
  {
    question: "How are clicks counted?",
    answer:
      "Every redirect records one event. Link previews, crawlers and uptime probes are filtered out so your numbers describe people. Unique visitors are counted with a first-party cookie set by InkByte, never by a header a client could forge.",
  },
  {
    question: "Do you store IP addresses?",
    answer:
      "No. A random, signed first-party cookie identifies a browser. InkByte does not fingerprint IP addresses. Referrers retain only the website origin, not private paths or searches. Clearing cookies creates a new visitor identity, so visitor counts are approximate.",
  },
  {
    question: "What is a link-in-bio page?",
    answer:
      "One public page, at a handle you choose, holding every link that matters. Each item on the page is a real InkByte link, so taps are tracked in your dashboard like any other click.",
  },
  {
    question: "Can I get a QR code?",
    answer:
      "Yes. Every short link has a QR code you can download as an SVG from the dashboard or the link history, in the size and colours you need.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8"
      >
        <p className="ink-label">Help</p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          Questions, answered
        </h1>
        <div className="mt-8 flex flex-col gap-4">
          {topics.map((topic) => (
            <details key={topic.question} className="ink-card p-5">
              <summary className="cursor-pointer list-none font-display text-lg text-cerulean [&::-webkit-details-marker]:hidden">
                {topic.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {topic.answer}
              </p>
            </details>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
