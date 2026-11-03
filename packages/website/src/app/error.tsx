"use client";

import Link from "next/link";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center gap-4 px-6"
    >
      <h1 className="font-display text-3xl text-cerulean">
        We couldn’t load this page
      </h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        Your links haven’t changed. This may be a temporary connection problem.
      </p>
      <button onClick={retry} className="ink-button">
        Try again
      </button>
      <Link className="text-center text-sm text-cerulean underline" href="/">
        Back to InkByte
      </Link>
    </main>
  );
}
