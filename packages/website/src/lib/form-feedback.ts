/** Prefer an actionable field error over a generic validation envelope. */
export function formError(
  payload: { error?: { message?: string; details?: unknown } },
  fallback: string,
) {
  const details = payload.error?.details;
  if (Array.isArray(details)) {
    const issue = details.find((entry) => typeof entry?.message === "string");
    if (issue) {
      const field = Array.isArray(issue.path) ? issue.path[0] : undefined;
      const labels: Record<string, string> = {
        longUrl: "Destination URL",
        customSlug: "Custom alias",
        domain: "Domain",
        handle: "Handle",
        heading: "Page heading",
        bio: "Bio",
        ctaHeading: "Call to action",
        ctaBody: "Message",
        ctaAction: "Button text",
      };
      return `${labels[String(field)] ? `${labels[String(field)]}: ` : ""}${issue.message}`;
    }
  }
  return payload.error?.message || fallback;
}
