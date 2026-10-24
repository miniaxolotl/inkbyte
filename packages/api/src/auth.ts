import { createRemoteJWKSet, decodeJwt, jwtVerify, errors } from "jose";
import { InkbyteError, type Principal } from "@lib/shared";

export interface TokenVerifier {
  verify(token: string): Promise<Principal>;
}

const unauthorized = () =>
  new InkbyteError("unauthorized", "Sign in to continue", 401);

export function validateSessionClaims(
  payload: Record<string, unknown>,
  siteUrl: string,
) {
  if (
    typeof payload.sub !== "string" ||
    !payload.sub.startsWith("user_") ||
    typeof payload.sid !== "string" ||
    payload.azp !== siteUrl ||
    payload.sts === "pending" ||
    typeof payload.iat !== "number" ||
    payload.iat > Date.now() / 1000 + 5
  )
    throw unauthorized();
}

/**
 * Verifies Clerk session tokens against the instance JWKS. The issuer is
 * fixed by configuration; neither request hosts nor token claims select it.
 */
export function clerkVerifier(env: {
  CLERK_ISSUER: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  SITE_URL: string;
}): TokenVerifier {
  const jwks = createRemoteJWKSet(
    new URL("/.well-known/jwks.json", env.CLERK_ISSUER),
    { timeoutDuration: 5000 },
  );

  return {
    async verify(token) {
      try {
        const { payload } = await jwtVerify(token, jwks, {
          issuer: env.CLERK_ISSUER,
          algorithms: ["RS256"],
          clockTolerance: 5,
          requiredClaims: ["sub", "exp", "iat", "sid", "azp"],
        });

        validateSessionClaims(payload, env.SITE_URL);

        const claims = payload as Record<string, unknown>;
        const email = typeof claims.email === "string" ? claims.email : "";
        const firstName =
          typeof claims.first_name === "string" ? claims.first_name : "";
        const lastName =
          typeof claims.last_name === "string" ? claims.last_name : "";

        return { subject: payload.sub!, email, firstName, lastName };
      } catch (error) {
        if (error instanceof InkbyteError) throw error;
        const status = (error as { status?: number }).status;
        if (
          error instanceof errors.JOSEError &&
          !(error instanceof errors.JWKSTimeout)
        ) {
          throw unauthorized();
        }
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw unauthorized();
        }
        throw new InkbyteError(
          "auth_unavailable",
          "Authentication is temporarily unavailable",
          503,
        );
      }
    },
  };
}

/** Reads a Bearer token without validating it. Used by tests and proxies. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer (\S+)$/i);
  if (!match?.[1] || match[1].length > 16384) return null;
  return match[1];
}

export { decodeJwt };
