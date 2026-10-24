"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  domains: Array<{ slug: string }>;
  token: string | null;
  defaultDomain?: string;
};

const copyToClipboard = async (value: string) => {
  await navigator.clipboard.writeText(value);
};

export const ShortenForm = ({ domains, token, defaultDomain }: Props) => {
  const router = useRouter();
  const [longUrl, setLongUrl] = useState("");
  const [domain, setDomain] = useState(defaultDomain ?? domains[0]?.slug ?? "");
  const [customSlug, setCustomSlug] = useState("");
  const [isTracking, setIsTracking] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);

    if (!token) {
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
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { link: { shortUrl: string } };
        error?: { message: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.error?.message ?? "Could not create the link.");
        return;
      }
      setResult(payload.data.link.shortUrl);
      setLongUrl("");
      setCustomSlug("");
      router.refresh();
    } catch {
      setError("Could not reach InkByte. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="ink-card p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <label className="ink-label" htmlFor="long-url">
            Destination URL
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="ink-label" htmlFor="domain">
              Domain
            </label>
            <select
              id="domain"
              name="domain"
              className="ink-input mt-2"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            >
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

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={isTracking}
            onChange={(event) => setIsTracking(event.target.checked)}
            className="h-4 w-4 accent-rose"
          />
          Track clicks for this link
        </label>

        <button type="submit" disabled={pending} className="ink-button">
          {pending ? "Creating link…" : "Shorten link"}
        </button>

        {error ? (
          <p role="alert" className="text-sm text-rose-deep">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="ink-card bg-paper p-4">
            <p className="ink-label">Your short link</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href={result}
                className="font-display text-lg font-semibold text-sky underline underline-offset-4"
                rel="noreferrer"
              >
                {result}
              </a>
              <button
                type="button"
                className="ink-button ink-button-quiet text-sm"
                onClick={async () => {
                  await copyToClipboard(result);
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
};
