"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { formError } from "@/lib/form-feedback";
import type { PublicBioPage } from "@lib/shared";

type Props = { initial: PublicBioPage | null };

export const BioManager = ({ initial }: Props) => {
  const router = useRouter();
  const [bio, setBio] = useState<PublicBioPage | null>(initial);
  const [handle, setHandle] = useState(initial?.handle ?? "");
  const [heading, setHeading] = useState(initial?.heading ?? "");
  const [bioText, setBioText] = useState(initial?.bio ?? "");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [published, setPublished] = useState(initial?.isPublished ?? true);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice("");
    setPending(true);
    try {
      const response = await fetch("/api/inkbyte/bio", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle,
          heading,
          bio: bioText,
          isPublished: published,
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { bio: PublicBioPage };
        error?: { message: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        setError(formError(payload, "Could not save the page."));
        return;
      }
      setBio(payload.data.bio);
      setNotice("Page saved.");
      router.refresh();
    } catch {
      setError("Could not reach InkByte. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  const addItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/inkbyte/bio/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { items: PublicBioPage["items"] };
        error?: { message: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        setError(formError(payload, "Could not add the item."));
        return;
      }
      setBio((current) =>
        current ? { ...current, items: payload.data!.items } : current,
      );
      setLabel("");
      setUrl("");
      router.refresh();
    } catch {
      setError("Could not reach InkByte. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  const removeItem = async (id: string) => {
    if (
      !window.confirm("Remove this item? Its short link will stop redirecting.")
    )
      return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/inkbyte/bio/items/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("Could not remove the item.");
        return;
      }
      setBio((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== id),
            }
          : current,
      );
      router.refresh();
    } catch {
      setError("Could not reach InkByte. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {bio ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule bg-paper-raised p-4 text-sm">
          <span className="text-ink-soft">
            {bio.isPublished
              ? "Your page is published"
              : "Your page is unpublished"}
          </span>
          {bio.isPublished ? (
            <Link
              href={`/b/${bio.handle}`}
              prefetch={false}
              className="text-cerulean underline"
            >
              Preview /b/{bio.handle}
            </Link>
          ) : (
            <span className="text-ink-faint">
              Publish to view the public page
            </span>
          )}
        </div>
      ) : null}
      <form onSubmit={save} className="ink-card p-5" aria-busy={pending}>
        <h2 className="font-display text-lg text-cerulean">Page settings</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="ink-label" htmlFor="bio-handle">
                Handle
              </label>
              <input
                id="bio-handle"
                className="ink-input mt-2"
                placeholder="yourname"
                required
                maxLength={64}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                aria-describedby="bio-handle-hint"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
              />
              <p id="bio-handle-hint" className="mt-1 text-xs text-ink-faint">
                Your page lives at /b/{handle || "…"}
              </p>
              {bio && handle !== bio.handle ? (
                <p className="mt-2 text-xs text-rose-deep">
                  Changing your handle changes the public address. Previously
                  shared bio-page URLs won’t follow automatically.
                </p>
              ) : null}
            </div>
            <div>
              <label className="ink-label" htmlFor="bio-heading">
                Heading
              </label>
              <input
                id="bio-heading"
                className="ink-input mt-2"
                placeholder="Your name"
                maxLength={120}
                value={heading}
                onChange={(event) => setHeading(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="ink-label" htmlFor="bio-text">
              Bio
            </label>
            <textarea
              id="bio-text"
              className="ink-input mt-2"
              rows={3}
              maxLength={600}
              placeholder="A line or two about you."
              value={bioText}
              onChange={(event) => setBioText(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />{" "}
            Publish this page
          </label>
          <button type="submit" disabled={pending} className="ink-button">
            {pending ? "Saving…" : bio ? "Save page" : "Create page"}
          </button>
        </div>
      </form>

      {bio ? (
        <form onSubmit={addItem} className="ink-card p-5" aria-busy={pending}>
          <h2 className="font-display text-lg text-cerulean">Add a link</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="ink-label" htmlFor="bio-item-label">
                  Label
                </label>
                <input
                  id="bio-item-label"
                  className="ink-input mt-2"
                  required
                  maxLength={120}
                  placeholder="My website"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                />
              </div>
              <div>
                <label className="ink-label" htmlFor="bio-item-url">
                  URL
                </label>
                <input
                  id="bio-item-url"
                  className="ink-input mt-2"
                  required
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </div>
            </div>
            <button type="submit" disabled={pending} className="ink-button">
              Add to page
            </button>
          </div>
        </form>
      ) : null}

      {bio && bio.items.length > 0 ? (
        <section className="ink-card p-5">
          <h2 className="font-display text-lg text-cerulean">
            Links on your page
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {bio.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded border border-rule bg-paper px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-display text-ink">{item.label}</p>
                  <p className="truncate text-xs text-ink-faint">{item.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/r/${encodeURIComponent(item.slug)}?domain=${encodeURIComponent(item.domain)}`}
                    className="ink-button ink-button-quiet px-2 py-1 text-xs"
                  >
                    /{item.slug}
                  </a>
                  <button
                    disabled={pending}
                    type="button"
                    className="ink-button ink-button-quiet px-2 py-1 text-xs"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 aria-hidden size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="ink-error">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="ink-success">
          {notice}
        </p>
      ) : null}
    </div>
  );
};
