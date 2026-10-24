type Bucket = { tokens: number; updatedAt: number };

/**
 * Best-effort fixed-window limiter for a single API instance. DigitalOcean
 * runs one API instance, so this bounds abuse of the public endpoints; it is
 * not a distributed guarantee and does not need to be.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly window: number;
  private readonly limit: number;
  private lastSweep = Date.now();

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  consume(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    this.sweep(now);

    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.updatedAt >= this.window) {
      this.buckets.set(key, { tokens: 1, updatedAt: now });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (bucket.tokens >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(
          (bucket.updatedAt + this.window - now) / 1000,
        ),
      };
    }
    bucket.tokens += 1;
    bucket.updatedAt = now;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private sweep(now: number) {
    if (now - this.lastSweep < this.window) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.updatedAt >= this.window) this.buckets.delete(key);
    }
  }
}

export function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}
