import Link from "next/link";

export function AccountUnavailable() {
  return (
    <div className="rounded-lg border border-rule bg-paper p-4 text-sm leading-relaxed text-ink-soft">
      <p>
        Accounts aren’t available in this preview yet. You can still explore the
        public tools and help pages.
      </p>
      <Link
        href="/help"
        className="mt-3 inline-block font-semibold text-cerulean underline underline-offset-4"
      >
        How InkByte works
      </Link>
    </div>
  );
}
