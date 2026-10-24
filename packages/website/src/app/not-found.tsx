import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 text-center">
      <p className="ink-label">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
        That page does not exist.
      </h1>
      <p className="mt-4 text-ink-soft">
        The link may have been removed, or the address may be mistyped.
      </p>
      <Link href="/" className="ink-button mt-8">
        Back to InkByte
      </Link>
    </div>
  );
}
