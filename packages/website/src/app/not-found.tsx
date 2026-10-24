import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 py-12 text-center"
    >
      <Image
        src="/assets/logo/default.svg"
        alt="InkByte"
        width={96}
        height={96}
        className="mb-6"
      />
      <p className="ink-label">Page not found</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
        That page does not exist.
      </h1>
      <p className="mt-4 text-ink-soft">
        The link may have been removed, or the address may be mistyped.
      </p>
      <Link href="/" className="ink-button mt-8">
        Back to InkByte
      </Link>
    </main>
  );
}
