import type {
  AnalyticsOverview,
  ApiEnvelope,
  LinkAnalytics,
  LinkSummary,
  PublicDomain,
  PublicUser,
} from "@lib/shared";

export class DashboardApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "DashboardApiError";
    this.code = code;
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

const apiOrigin =
  process.env.INKBYTE_API_URL ??
  (process.env.VERCEL_ENV ? `https://${process.env.VERCEL_ENV}.inkbyte.app` : null) ??
  "http://localhost:26090";

/** Server-side API caller. The website talks to the API directly. */
export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${apiOrigin}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    ...(options.signal ? { signal: options.signal } : {}),
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.success) {
    throw new DashboardApiError(
      payload.error.code,
      payload.error.message,
      response.status,
    );
  }
  return payload.data;
}

export const fetchDomains = (signal?: AbortSignal) =>
  api<{ domains: PublicDomain[] }>("/api/v1/domains", { signal }).then(
    (data) => data.domains,
  );

export const fetchSession = (token: string, signal?: AbortSignal) =>
  api<{ user: PublicUser | null }>("/api/v1/auth/session", { token, signal }).then(
    (data) => data.user,
  );

export const fetchLinks = (token: string, signal?: AbortSignal) =>
  api<{ links: LinkSummary[] }>("/api/v1/links", { token, signal }).then(
    (data) => data.links,
  );

export const createLink = (
  token: string,
  input: {
    longUrl: string;
    domain: string;
    customSlug?: string;
    title?: string;
    isTracking?: boolean;
  },
) =>
  api<{ link: LinkSummary }>("/api/v1/links", {
    method: "POST",
    token,
    body: input,
  }).then((data) => data.link);

export const updateLink = (
  token: string,
  id: string,
  input: {
    longUrl?: string;
    title?: string | null;
    isTracking?: boolean;
    isActive?: boolean;
  },
) =>
  api<{ link: LinkSummary }>(`/api/v1/links/${id}`, {
    method: "PATCH",
    token,
    body: input,
  }).then((data) => data.link);

export const deleteLink = (token: string, id: string) =>
  api<null>(`/api/v1/links/${id}`, { method: "DELETE", token });

export const fetchOverview = (token: string, signal?: AbortSignal) =>
  api<{ overview: AnalyticsOverview }>("/api/v1/analytics/overview", {
    token,
    signal,
  }).then((data) => data.overview);

export const fetchLinkAnalytics = (
  token: string,
  id: string,
  signal?: AbortSignal,
) =>
  api<{ analytics: LinkAnalytics }>(`/api/v1/analytics/links/${id}`, {
    token,
    signal,
  }).then((data) => data.analytics);
