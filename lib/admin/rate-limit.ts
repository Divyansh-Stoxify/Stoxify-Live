import "server-only";

/**
 * Sliding-window per-IP rate limit for the admin login route.
 *
 * Counter storage is in-process. That's enough to defeat single-host brute
 * force, but in a multi-instance deployment each Node process has its own
 * counter — the effective limit becomes N * limit. Acceptable as a stopgap;
 * the proper fix is to back this with Redis (BUG B2 in
 * ADMIN_AUTH_FIX_PROMPT.md) or push the limit to the WAF.
 *
 * PROD: swap the Map for Redis (`@stoxify/redis` already exists in the
 * backend) when promoting beyond a single Next.js instance.
 */

type Bucket = number[];

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;
const PRUNE_INTERVAL = 100;

const buckets = new Map<string, Bucket>();
let opsSincePrune = 0;

function prune(now: number, windowMs: number) {
  for (const [key, stamps] of buckets) {
    const fresh = stamps.filter((ts) => now - ts < windowMs);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else if (fresh.length !== stamps.length) {
      buckets.set(key, fresh);
    }
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number; resetAt: number };

export function checkAdminLoginRateLimit(
  ip: string,
  {
    limit = DEFAULT_LIMIT,
    windowMs = DEFAULT_WINDOW_MS,
  }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now();
  opsSincePrune += 1;
  if (opsSincePrune >= PRUNE_INTERVAL) {
    opsSincePrune = 0;
    prune(now, windowMs);
  }

  const key = ip || "unknown";
  const existing = buckets.get(key) ?? [];
  const fresh = existing.filter((ts) => now - ts < windowMs);

  if (fresh.length >= limit) {
    const oldest = fresh[0];
    const resetAt = oldest + windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
    buckets.set(key, fresh);
    return { ok: false, retryAfterSec, resetAt };
  }

  fresh.push(now);
  buckets.set(key, fresh);
  return { ok: true, remaining: limit - fresh.length, resetAt: now + windowMs };
}

/** Test-only: reset internal state. Do not call from app code. */
export function __resetAdminLoginRateLimitForTests() {
  buckets.clear();
  opsSincePrune = 0;
}
