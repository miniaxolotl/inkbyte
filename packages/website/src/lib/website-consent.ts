const key = "inkbyte:website-analytics:v1";
const eventName = "inkbyte:website-analytics-change";
export const publicAnalyticsPaths = new Set(["/", "/help", "/privacy"]);

export function browserOptOut() {
  return (
    typeof navigator !== "undefined" &&
    (navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl === true)
  );
}

export function analyticsAllowed() {
  if (typeof window === "undefined" || browserOptOut()) return false;
  try {
    return window.localStorage.getItem(key) === "allowed";
  } catch {
    return false;
  }
}

export function chooseAnalytics(allowed: boolean) {
  try {
    window.localStorage.setItem(
      key,
      allowed && !browserOptOut() ? "allowed" : "essential",
    );
  } catch {
    /* A blocked preference store keeps analytics off. */
  }
  window.dispatchEvent(new Event(eventName));
}

export function subscribeAnalytics(listener: () => void) {
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Private paths, short-link slugs, fragments and query strings never leave here. */
export function publicAnalyticsUrl(value: string) {
  if (!analyticsAllowed()) return null;
  try {
    const url = new URL(value);
    return url.origin === window.location.origin &&
      publicAnalyticsPaths.has(url.pathname)
      ? `${url.origin}${url.pathname}`
      : null;
  } catch {
    return null;
  }
}
