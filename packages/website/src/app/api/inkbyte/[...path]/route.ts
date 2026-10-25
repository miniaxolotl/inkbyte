import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { site } from "@/lib/site";

export const maxDuration = 30;

const allowed =
  /^(auth\/session|domains|links(?:\/[0-9a-f-]+)?|analytics\/(?:overview|links\/[0-9a-f-]+)|bio(?:\/items(?:\/[0-9a-f-]+)?)?|public\/links\/[a-zA-Z0-9_-]+|public\/bio\/[a-z0-9-]+|qr)$/;

async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const headers = { "Cache-Control": "private, no-store" };
  const fail = (status: number, message: string) =>
    Response.json(
      { success: false, error: { code: "request_failed", message } },
      { status, headers },
    );

  if (!process.env.CLERK_SECRET_KEY || !process.env.INKBYTE_API_URL) {
    return fail(503, "InkByte account services are not configured yet");
  }

  const session = await auth();
  if (!session.userId) return fail(401, "Sign in to InkByte to continue");

  if (
    !["GET", "HEAD"].includes(request.method) &&
    request.headers.get("origin") !== site.url
  ) {
    return fail(403, "Request origin is not allowed");
  }

  const path = (await context.params).path.join("/");
  if (!allowed.test(path)) return fail(404, "Route not found");

  const token = await session.getToken();
  if (!token) return fail(401, "Sign in to InkByte to continue");

  const origin = new URL(process.env.INKBYTE_API_URL);
  if (
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    (origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]", "api"].includes(origin.hostname)
      ))
  ) {
    return fail(503, "Invalid API configuration");
  }

  try {
    const content = request.method === "GET" ? undefined : await request.text();
    if (content && Buffer.byteLength(content) > 64 * 1024) {
      return fail(413, "Request body is too large");
    }
    const target = new URL(`/api/v1/${path}`, origin.origin);
    // Preserve QR customisation and domain selectors.
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (["slug", "domain", "size", "margin", "dark", "light"].includes(key)) {
        target.searchParams.set(key, value);
      }
    }
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: content,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
    });
    const outgoing = new Headers(headers);
    for (const name of [
      "content-type",
      "content-disposition",
      "content-length",
      "retry-after",
      "cache-control",
    ]) {
      const value = upstream.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: outgoing,
    });
  } catch {
    return fail(503, "InkByte is temporarily unavailable. Please retry.");
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
};
