import { execFileSync } from "node:child_process";

export function parseGitHubResponse(value) {
  const text = String(value).replaceAll("\r\n", "\n");
  const split = text.indexOf("\n\n");
  const lines = text.slice(0, split).split("\n");
  const match = lines.shift()?.match(/^HTTP\/[\d.]+ (\d{3})(?: .*)?$/);
  if (split < 0 || !match) throw new Error("Invalid GitHub response headers");
  const headers = {};
  for (const line of lines) {
    const index = line.indexOf(":");
    if (index < 1) throw new Error("Invalid GitHub response headers");
    const key = line.slice(0, index).toLowerCase();
    if (Object.hasOwn(headers, key))
      throw new Error("Duplicate GitHub response header");
    headers[key] = line.slice(index + 1).trim();
  }
  return { status: Number(match[1]), headers, body: text.slice(split + 2) };
}

function request(endpoint, { timeoutMs }) {
  const args = [
    "api",
    "--hostname",
    "github.com",
    "--method",
    "GET",
    "--include",
    endpoint,
  ];
  try {
    return parseGitHubResponse(
      execFileSync("gh", args, {
        encoding: "utf8",
        timeout: timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch (error) {
    if (String(error.stdout ?? "").startsWith("HTTP/"))
      return parseGitHubResponse(error.stdout);
    const transient =
      error.code === "ETIMEDOUT" ||
      /connection reset|connection refused|unexpected EOF|TLS handshake timeout|temporary failure|i\/o timeout/i.test(
        String(error.stderr ?? ""),
      );
    throw Object.assign(new Error("GitHub read transport failed"), {
      transient,
    });
  }
}

const sleep = (ms) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Reads only: callers must keep mutation paths separate and reconcile ambiguous writes.
export function readGitHubJson(endpoint, options = {}) {
  if (
    typeof endpoint !== "string" ||
    !/^(?:\/?repos\/|\/?orgs\/|\/?user(?:\?|$))[^\s]*$/.test(endpoint)
  )
    throw new Error("Invalid GitHub read endpoint");
  const {
    now = Date.now,
    request: read = request,
    sleep: wait = sleep,
    timeoutMs = 30_000,
    attempts = 3,
  } = options;
  if (
    !Number.isInteger(attempts) ||
    attempts < 1 ||
    attempts > 5 ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 60_000
  )
    throw new Error("Invalid GitHub read budget");
  const deadline = now() + timeoutMs;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const remaining = deadline - now();
    if (remaining <= 0) throw new Error("GitHub read deadline exceeded");
    let response;
    let terminalFailure = false;
    try {
      response = read(endpoint, {
        method: "GET",
        timeoutMs: Math.min(15_000, remaining),
      });
    } catch (error) {
      terminalFailure = error.transient !== true;
    }
    // Never attach raw CLI errors: their stdout/stderr can contain private evidence.
    if (terminalFailure) throw new Error("GitHub read failed");
    if (now() >= deadline) throw new Error("GitHub read deadline exceeded");
    const status = response?.status;
    if (status >= 200 && status < 300) {
      try {
        const result = JSON.parse(response.body);
        if (result !== null && typeof result === "object") return result;
      } catch {
        /* A truncated successful read may be retried, never accepted. */
      }
    } else if (
      response &&
      !(
        status === 429 ||
        (status >= 500 && status <= 599) ||
        (status === 403 && response.headers?.["x-ratelimit-remaining"] === "0")
      )
    ) {
      throw new Error(
        `GitHub read rejected (HTTP ${Number.isInteger(status) ? status : "invalid"})`,
      );
    }
    if (attempt + 1 === attempts) break;
    const retryAfter = response?.headers?.["retry-after"];
    const delay =
      retryAfter === undefined
        ? 500 * 2 ** attempt
        : /^\d+$/.test(retryAfter)
          ? Number(retryAfter) * 1000
          : Date.parse(retryAfter) - now();
    if (!Number.isFinite(delay) || delay < 0 || delay >= deadline - now())
      throw new Error("GitHub read retry exceeds deadline");
    wait(delay);
  }
  throw new Error("GitHub read failed within bounded retries");
}
