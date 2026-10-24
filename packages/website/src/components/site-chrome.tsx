import Link from "next/link";

export const SiteHeader = () => {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-ink"
        >
          Ink<span className="text-rose">Byte</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-soft">
          <Link className="hover:text-ink" href="/#features">
            Features
          </Link>
          <Link className="hover:text-ink" href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
};

export const SiteFooter = () => {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>InkByte by Bramble Labs Inc.</p>
        <p>Short links, real analytics, your own domain.</p>
      </div>
    </footer>
  );
};
