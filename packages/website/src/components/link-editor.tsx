"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicLink } from "@lib/shared";

export function LinkEditor({ link }: { link: PublicLink }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      aria-busy={pending}
      className="ink-card mt-6 flex flex-col gap-4 p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        setPending(true);
        setMessage("");
        try {
          const response = await fetch(`/api/inkbyte/links/${link.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              longUrl: values.get("longUrl"),
              title: values.get("title"),
              isActive: values.get("isActive") === "on",
              isTracking: values.get("isTracking") === "on",
              ctaHeading: values.get("ctaHeading") || null,
              ctaBody: values.get("ctaBody") || null,
              ctaAction: values.get("ctaAction") || null,
            }),
          });
          if (!response.ok) throw new Error();
          setMessage("Link updated.");
          router.refresh();
        } catch {
          setMessage(
            "Could not update the link. Check the destination and retry.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <h2 className="font-display text-lg text-cerulean">Link settings</h2>
      <p className="text-xs text-ink-faint">
        Changing the destination preserves your short URL, QR code and existing
        analytics.
      </p>
      <label>
        Destination URL
        <input
          className="ink-input mt-1"
          name="longUrl"
          type="url"
          required
          defaultValue={link.longUrl}
        />
      </label>
      <label>
        Title
        <input
          className="ink-input mt-1"
          name="title"
          maxLength={120}
          defaultValue={link.title ?? ""}
        />
      </label>
      <label className="flex gap-2">
        <input name="isActive" type="checkbox" defaultChecked={link.isActive} />{" "}
        Redirect is active
      </label>
      <label className="flex gap-2">
        <input
          name="isTracking"
          type="checkbox"
          defaultChecked={link.isTracking}
        />{" "}
        Track clicks
      </label>
      <label>
        Call to action heading
        <input
          className="ink-input mt-1"
          name="ctaHeading"
          maxLength={120}
          defaultValue={link.cta?.heading ?? ""}
        />
      </label>
      <label>
        Message
        <textarea
          className="ink-input mt-1"
          name="ctaBody"
          maxLength={600}
          defaultValue={link.cta?.body ?? ""}
        />
      </label>
      <label>
        Button text
        <input
          className="ink-input mt-1"
          name="ctaAction"
          maxLength={48}
          defaultValue={link.cta?.action ?? "Continue"}
        />
      </label>
      <button className="ink-button" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
      {message ? (
        <p
          role="status"
          className={message === "Link updated." ? "ink-success" : "ink-error"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
