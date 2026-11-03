"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { useRef, useSyncExternalStore } from "react";
import {
  analyticsAllowed,
  browserOptOut,
  chooseAnalytics,
  publicAnalyticsPaths,
  publicAnalyticsUrl,
  subscribeAnalytics,
} from "@/lib/website-consent";

const serverChoice = () => false;

export function WebsiteInsights() {
  const pathname = usePathname();
  const allowed = useSyncExternalStore(
    subscribeAnalytics,
    analyticsAllowed,
    serverChoice,
  );
  if (
    !allowed ||
    !publicAnalyticsPaths.has(pathname) ||
    process.env.NEXT_PUBLIC_VERCEL_INSIGHTS_ENABLED !== "true"
  )
    return null;
  return (
    <>
      <Analytics
        beforeSend={(event) => {
          const url = publicAnalyticsUrl(event.url);
          return url ? { ...event, url } : null;
        }}
      />
      <SpeedInsights
        beforeSend={(event) => {
          const url = publicAnalyticsUrl(event.url);
          return url ? { ...event, url, route: new URL(url).pathname } : null;
        }}
      />
    </>
  );
}

export function WebsitePrivacySettings() {
  const dialog = useRef<HTMLDialogElement>(null);
  const allowed = useSyncExternalStore(
    subscribeAnalytics,
    analyticsAllowed,
    serverChoice,
  );
  const optedOut = useSyncExternalStore(
    subscribeAnalytics,
    browserOptOut,
    serverChoice,
  );
  return (
    <>
      <button
        className="underline underline-offset-4"
        onClick={() => dialog.current?.showModal()}
      >
        Privacy &amp; analytics
      </button>
      <dialog
        ref={dialog}
        aria-label="Website analytics preferences"
        className="ink-card w-[calc(100%-2rem)] max-w-md p-6 text-ink"
      >
        <h2 className="font-display text-xl text-cerulean">
          Your privacy preferences
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          Optional Vercel analytics help us improve the public website. Account
          pages, short-link addresses and bio profiles are excluded, and query
          strings are removed. Nothing loads until you opt in.
        </p>
        <p role="status" className="mt-3 text-sm font-semibold">
          {allowed
            ? "Website analytics are allowed."
            : "Only essential functionality is enabled."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            className="ink-button"
            disabled={optedOut}
            onClick={() => {
              chooseAnalytics(true);
              dialog.current?.close();
            }}
          >
            Allow website analytics
          </button>
          <button
            className="ink-button ink-button-quiet"
            onClick={() => {
              chooseAnalytics(false);
              dialog.current?.close();
            }}
          >
            Essential only
          </button>
          <button
            className="py-2 text-sm text-ink-soft underline"
            onClick={() => dialog.current?.close()}
          >
            Close
          </button>
        </div>
        {optedOut ? (
          <p className="mt-3 text-xs text-ink-faint">
            Your browser’s privacy signal disables optional analytics.
          </p>
        ) : null}
        <p className="mt-4 text-xs text-ink-faint">
          This choice controls website monitoring, not the dashboard settings of
          links you create.
        </p>
      </dialog>
    </>
  );
}
