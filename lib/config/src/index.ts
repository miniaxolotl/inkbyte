import { z } from "zod";

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

export const serverEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(26090),
  DATABASE_URL: z.string().min(1),
  MIGRATION_DATABASE_URL: z.string().min(1).optional(),
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
  CLERK_ISSUER: origin,
  DEFAULT_DOMAINS: z
    .string()
    .default("inkbyte.app,inkbyte.co")
    .transform((value) =>
      value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    )
    .refine((value) => value.length > 0, "At least one domain is required"),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(
    Object.fromEntries(Object.entries(env).filter(([, value]) => value !== "")),
  );
}

export const websiteEnvironmentSchema = z.object({
  SITE_URL: origin.default("http://localhost:3000"),
  INKBYTE_API_URL: z.url().default("http://localhost:26090"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  CLERK_SECRET_KEY: z.string().startsWith("sk_").optional(),
});

export type WebsiteEnvironment = z.infer<typeof websiteEnvironmentSchema>;

export function readWebsiteEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): WebsiteEnvironment {
  return websiteEnvironmentSchema.parse(
    Object.fromEntries(Object.entries(env).filter(([, value]) => value !== "")),
  );
}
