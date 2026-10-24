import { z } from "zod";

/** Uniform success envelope used by every InkByte API response. */
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

/** Uniform failure envelope used by every InkByte API response. */
export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** Domain error carrying a stable machine-readable code and HTTP status. */
export class InkbyteError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "InkbyteError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const errorResponse = (
  error: InkbyteError,
  requestId?: string,
): ApiFailure => ({
  success: false,
  error: {
    code: error.code,
    message: error.message,
    ...(requestId ? { requestId } : {}),
    ...(error.details === undefined ? {} : { details: error.details }),
  },
});

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(
    /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/,
    "Use letters, numbers, dashes and underscores",
  );

export const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(253)
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    "Use a valid domain name",
  );

export const longUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .superRefine((value, ctx) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid URL, including https://",
      });
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        message: "Only http and https URLs can be shortened",
      });
    }
  });

export const linkCreateSchema = z.object({
  longUrl: longUrlSchema,
  domain: domainSchema,
  customSlug: slugSchema.optional(),
  title: z.string().trim().max(120).optional(),
  isTracking: z.boolean().default(true),
});

export const linkUpdateSchema = z.object({
  longUrl: longUrlSchema.optional(),
  title: z.string().trim().max(120).nullable().optional(),
  isTracking: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type LinkCreateInput = z.infer<typeof linkCreateSchema>;
export type LinkUpdateInput = z.infer<typeof linkUpdateSchema>;

/** Identity of the signed-in Clerk user, as resolved by the API. */
export type Principal = {
  subject: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

export type PublicDomain = {
  id: string;
  slug: string;
  isDefault: boolean;
};

export type PublicLink = {
  id: string;
  slug: string;
  longUrl: string;
  title: string | null;
  isTracking: boolean;
  isActive: boolean;
  createdAt: string;
  domain: PublicDomain;
  shortUrl: string;
};

export type LinkSummary = PublicLink & {
  views: number;
  uniqueVisitors: number;
};

export type AnalyticsOverview = {
  links: number;
  totalViews: number;
  uniqueVisitors: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  topLinks: Array<{
    id: string;
    slug: string;
    title: string | null;
    longUrl: string;
    views: number;
    uniqueVisitors: number;
  }>;
  referrers: Array<{ referrer: string | null; views: number }>;
  countries: Array<{ country: string | null; views: number }>;
  dailyViews: Array<{ day: string; views: number }>;
};

export type LinkAnalytics = {
  link: PublicLink;
  views: number;
  uniqueVisitors: number;
  referrers: Array<{ referrer: string | null; views: number }>;
  countries: Array<{ country: string | null; views: number }>;
  dailyViews: Array<{ day: string; views: number }>;
};
