import { z } from "zod";

const postgresUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    ["postgres:", "postgresql:"].includes(url.protocol) &&
    Boolean(url.hostname) &&
    url.pathname.length > 1 &&
    !["disable", "no-verify"].includes(url.searchParams.get("sslmode") ?? "")
  );
}, "Use a PostgreSQL URL with a database name and verified TLS");

const origin = z.url().transform((value, ctx) => {
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Use an HTTPS origin (HTTP is allowed on loopback)",
    });
    return z.NEVER;
  }
  return url.origin;
});

export const serverEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(26090),
    DATABASE_URL: postgresUrl,
    MIGRATION_DATABASE_URL: postgresUrl.optional(),
    DATABASE_SSL: z.enum(["require", "disable"]).default("disable"),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(64).default(8),
    DATABASE_ACQUIRE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(30000)
      .default(2000),
    DATABASE_STATEMENT_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(30000)
      .default(10000),
    API_ORIGIN: origin.default("http://localhost:26090"),
    SITE_URL: origin.default("http://localhost:3000"),
    CLERK_SECRET_KEY: z.string().startsWith("sk_"),
    CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
    CLERK_ISSUER: origin,
    TRACKING_SECRET: z.string().min(32),
    DEFAULT_DOMAINS: z
      .string()
      .default("inkb.ca,inkbyte.ca")
      .transform((value) =>
        value
          .split(",")
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean),
      )
      .refine(
        (value) =>
          value.length > 0 &&
          value.every((domain) =>
            /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(domain),
          ),
        "Provide bare domain names without schemes, paths or ports",
      ),
    TRUST_PROXY: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  .superRefine((env, ctx) => {
    const host = new URL(env.DATABASE_URL).hostname;
    if (
      !["localhost", "127.0.0.1", "[::1]", "postgres"].includes(host) &&
      env.DATABASE_SSL !== "require"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_SSL"],
        message: "Remote PostgreSQL requires verified TLS",
      });
    }
    if (
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== env.CLERK_PUBLISHABLE_KEY
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
        message: "Website and API must use the same Clerk instance",
      });
    }
  });

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(
    Object.fromEntries(Object.entries(env).filter(([, value]) => value !== "")),
  );
}

export const websiteEnvironmentSchema = z
  .object({
    SITE_URL: origin.default("http://localhost:3000"),
    INKBYTE_API_URL: z
      .union([origin, z.literal("http://api:26090")])
      .default("http://localhost:26090"),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
    CLERK_SECRET_KEY: z.string().startsWith("sk_").optional(),
    NEXT_PUBLIC_VERCEL_INSIGHTS_ENABLED: z
      .enum(["true", "false"])
      .default("false"),
    SITE_NOINDEX: z.enum(["true", "false"]).default("false"),
  })
  .superRefine((env, ctx) => {
    if (
      Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) !==
      Boolean(env.CLERK_SECRET_KEY)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["CLERK_SECRET_KEY"],
        message: "Configure both Clerk keys, or neither for public-only mode",
      });
    }
  });

export type WebsiteEnvironment = z.infer<typeof websiteEnvironmentSchema>;

export function readWebsiteEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): WebsiteEnvironment {
  return websiteEnvironmentSchema.parse(
    Object.fromEntries(Object.entries(env).filter(([, value]) => value !== "")),
  );
}
