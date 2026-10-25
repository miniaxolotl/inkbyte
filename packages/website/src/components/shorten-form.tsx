"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, QrCode, Trash2 } from "lucide-react";
import Link from "next/link";
import { formError } from "@/lib/form-feedback";

type Props = {
  domains: Array<{ slug: string }>;
  authenticated: boolean;
  defaultDomain?: string;
  compact?: boolean;
};

type CreatedLink = {
  shortUrl: string;
  slug: string;
  domain: string;
  longUrl: string;
};

const HISTORY_KEY = "inkbyte:link-history";

function readHistory(): CreatedLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is CreatedLink => {
        if (!value || typeof value !== "object") return false;
        if (
          ![value.shortUrl, value.longUrl, value.domain, value.slug].every(
            (field) => typeof field === "string",
          )
        )
          return false;
        try {
          const short = new URL(value.shortUrl);
          const long = new URL(value.longUrl);
          return (
            [short, long].every(
              (url) =>
                ["https:", "http:"].includes(url.protocol) &&
                !url.username &&
                !url.password,
            ) &&
            short.hostname === value.domain &&
            /^[a-zA-Z0-9_-]{1,64}$/.test(value.slug)
          );
        } catch {
          return false;
        }
      })
      .slice(0, 10);
  } catch {
    return [];
  }
}

const copyToClipboard = async (value: string) => {
  await navigator.clipboard.writeText(value);
};

export const ShortenForm = ({
  domains,
  authenticated,
  defaultDomain,
  compact = false,
}: Props) => {
  const router = useRouter();
  const [longUrl, setLongUrl] = useState("");
  const [domain, setDomain] = useState(defaultDomain ?? domains[0]?.slug ?? "");
  const [customSlug, setCustomSlug] = useState("");
  const [isTracking, setIsTracking] = useState(true);
  const [ctaHeading, setCtaHeading] = useState("");
  const [ctaBody, setCtaBody] = useState("");
  const [ctaAction, setCtaAction] = useState("Continue");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CreatedLink[]>(() => readHistory());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedLink | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const remember = (link: CreatedLink) => {
    const next = [link, ...history].slice(0, 10);
    setHistory(next);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* history is best-effort */
    }
  };

  const forget = (link: CreatedLink) => {
    const next = history.filter(
      (item) => item.slug !== link.slug || item.domain !== link.domain,
    );
    setHistory(next);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* best-effort */
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setCopied(null);

    if (!authenticated) {
      setError("Sign in to create a tracked link.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/inkbyte/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          longUrl,
          domain,
          customSlug: customSlug.trim() || undefined,
          isTracking,
          ...(ctaHeading.trim()
            ? { ctaHeading: ctaHeading.trim(), ctaBody, ctaAction }
            : {}),
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { link: { shortUrl: string; slug: string; longUrl: string } };
        error?: { message: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        setError(formError(payload, "Could not create the link."));
        return;
      }
      const link = payload.data.link;
      const created = {
        shortUrl: link.shortUrl,
        slug: link.slug,
        domain,
        longUrl: link.longUrl,
      };
      setResult(created);
      remember(created);
      setLongUrl("");
      setCustomSlug("");
      setCtaHeading("");
      setCtaBody("");
      setCtaAction("Continue");
      router.refresh();
    } catch {
      setError("Could not reach InkByte. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  const qrHref = (link: CreatedLink) =>
    `/api/inkbyte/qr?slug=${encodeURIComponent(link.slug)}&domain=${encodeURIComponent(link.domain)}&size=512`;

  const createdCard = (link: CreatedLink) => (
    <div className="rounded border border-rule bg-paper p-3">
      <p className="max-w-full truncate text-xs text-ink-faint">
        {link.longUrl}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <a
          href={link.shortUrl}
          className="min-w-0 flex-1 truncate font-display text-base text-cerulean underline underline-offset-4"
          rel="noreferrer"
        >
          {link.shortUrl}
        </a>
        <button
          type="button"
          className="ink-button ink-button-quiet px-2 py-1 text-xs"
          onClick={async () => {
            try {
              await copyToClipboard(link.shortUrl);
              setCopied(link.shortUrl);
            } catch {
              setError(
                "Clipboard access is unavailable. Select and copy the short URL instead.",
              );
            }
          }}
        >
          {copied === link.shortUrl ? "Copied" : "Copy"}
        </button>
        <a
          href={qrHref(link)}
          download={`inkbyte-${link.slug}.svg`}
          className="ink-button ink-button-quiet px-2 py-1 text-xs"
          title="Download QR code"
        >
          <QrCode aria-hidden size={14} />
          QR
        </a>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="ink-card p-5 sm:p-6" aria-busy={pending}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="ink-label" htmlFor="long-url">
            Shorten a URL
          </label>
          <input
            id="long-url"
            name="longUrl"
            type="url"
            required
            autoComplete="url"
            placeholder="https://example.com/a/very/long/link"
            className="ink-input mt-2"
            value={longUrl}
            onChange={(event) => setLongUrl(event.target.value)}
          />
        </div>

        <details open={!compact} className="ink-link-options">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-ink-soft">
            Link options{" "}
            <span className="font-normal text-ink-faint">(optional)</span>
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="ink-label" htmlFor="domain">
                Domain
              </label>
              <select
                id="domain"
                name="domain"
                className="ink-input mt-2"
                disabled={!domains.length}
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
              >
                {!domains.length ? <option value="">Unavailable</option> : null}
                {domains.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.slug}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ink-label" htmlFor="custom-slug">
                Custom alias
              </label>
              <input
                id="custom-slug"
                name="customSlug"
                type="text"
                placeholder="Optional"
                maxLength={64}
                className="ink-input mt-2"
                value={customSlug}
                onChange={(event) => setCustomSlug(event.target.value)}
              />
            </div>
          </div>
          <details className="rounded-lg border border-rule p-3">
            <summary className="text-sm font-semibold text-ink-soft">
              Call to action{" "}
              <span className="font-normal text-ink-faint">(optional)</span>
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <label className="ink-label" htmlFor="cta-heading">
                  Call to action
                </label>
                <input
                  id="cta-heading"
                  name="ctaHeading"
                  type="text"
                  placeholder="Optional"
                  maxLength={120}
                  className="ink-input mt-2"
                  value={ctaHeading}
                  onChange={(event) => setCtaHeading(event.target.value)}
                />
              </div>
              <p className="text-xs leading-relaxed text-ink-faint">
                Show a short message before the link opens. Choose what it says
                and the button people use to continue.
              </p>
              <label className="text-sm text-ink-soft">
                Message
                <textarea
                  className="ink-input mt-1"
                  value={ctaBody}
                  onChange={(event) => setCtaBody(event.target.value)}
                  maxLength={600}
                />
              </label>
              <label className="text-sm text-ink-soft">
                Button text
                <input
                  className="ink-input mt-1"
                  value={ctaAction}
                  onChange={(event) => setCtaAction(event.target.value)}
                  maxLength={48}
                />
              </label>
            </div>
          </details>
        </details>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={isTracking}
            onChange={(event) => setIsTracking(event.target.checked)}
            className="h-4 w-4 accent-cerulean"
          />
          Track clicks for this link
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending || !domain}
            className="ink-button flex-1"
          >
            {pending ? "Creating link…" : "Create link"}
          </button>
          <button
            type="button"
            className="ink-button ink-button-quiet px-3"
            aria-label={showHistory ? "Hide history" : "Show history"}
            aria-expanded={showHistory}
            title={showHistory ? "Hide history" : "Show history"}
            onClick={() => setShowHistory((value) => !value)}
          >
            <Clock aria-hidden size={16} />
          </button>
        </div>

        {!authenticated ? (
          <p className="text-center text-xs text-ink-soft">
            <Link
              className="font-semibold text-cerulean underline underline-offset-2"
              href="/sign-in"
            >
              Sign in
            </Link>{" "}
            to create links and keep their analytics in one place.
          </p>
        ) : null}
        {!domains.length ? (
          <p role="alert" className="ink-error">
            Short domains could not be loaded. Refresh the page to retry.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="ink-error">
            {error}
          </p>
        ) : null}

        {result ? (
          <div role="status" className="flex flex-col gap-2">
            <h3 className="font-display text-base text-rose-deep">
              Created link
            </h3>
            {createdCard(result)}
          </div>
        ) : null}

        {showHistory && !history.length ? (
          <p
            role="status"
            className="rounded-lg bg-paper p-4 text-sm text-ink-soft"
          >
            Links you create in this browser will appear here. Removing an entry
            only clears local history.
          </p>
        ) : null}
        {showHistory && history.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-base text-rose-deep">
              Link history
            </h3>
            {history.map((item) => (
              <div
                key={`${item.domain}/${item.slug}`}
                className="flex flex-col gap-1"
              >
                {createdCard(item)}
                <button
                  type="button"
                  className="ink-button ink-button-quiet self-end px-2 py-1 text-xs"
                  aria-label={`Remove ${item.slug} from history`}
                  onClick={() => forget(item)}
                >
                  <Trash2 aria-hidden size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </form>
  );
};
