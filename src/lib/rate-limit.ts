// In-memory sliding-window rate limiter.
//
// Used to protect authentication + payment endpoints from brute-force
// attacks. Each "bucket" is keyed by a string (typically IP + endpoint
// name). Buckets store an array of timestamps; on each check we slide
// the window forward (drop timestamps older than `windowMs`) and reject
// if the count exceeds `maxRequests`.
//
// Caveats:
//   - In-memory, so resets on every server restart. Good enough for
//     sandboxed / single-instance dev; for production behind a load
//     balancer, switch to Redis.
//   - The cleanup sweep runs every 60s to drop expired buckets so the
//     Map doesn't grow unbounded.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// One-time sweep on first import.
let sweepStarted = false;
function ensureSweepStarted() {
  if (sweepStarted) return;
  sweepStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      // Drop empty buckets entirely (keeps the Map small).
      const fresh = b.timestamps.filter((t) => now - t < 60_000);
      if (fresh.length === 0) {
        buckets.delete(key);
      } else {
        b.timestamps = fresh;
      }
    }
  }, 60_000).unref?.();
}

export interface RateLimitResult {
  ok: boolean;
  /** Number of requests remaining in the current window. */
  remaining: number;
  /** When the oldest request in the window expires (ms since epoch). */
  resetAt: number;
}

// Check (and consume) a token from the bucket. Returns {ok, remaining, resetAt}.
export function rateLimit(opts: {
  key: string;
  maxRequests: number;
  windowMs: number;
}): RateLimitResult {
  ensureSweepStarted();
  const now = Date.now();
  let bucket = buckets.get(opts.key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(opts.key, bucket);
  }
  // Slide the window forward: drop timestamps older than windowMs.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < opts.windowMs);

  if (bucket.timestamps.length >= opts.maxRequests) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      resetAt: oldest + opts.windowMs,
    };
  }

  // Consume a token.
  bucket.timestamps.push(now);
  return {
    ok: true,
    remaining: opts.maxRequests - bucket.timestamps.length,
    resetAt: bucket.timestamps[0] + opts.windowMs,
  };
}

// Convenience: derive a rate-limit key from a Next.js request. Uses
// x-forwarded-for if present, falls back to the NextRequest IP.
export function getRequestKey(req: Request, suffix: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    return `${fwd.split(",")[0].trim()}:${suffix}`;
  }
  return `anon:${suffix}`;
}
