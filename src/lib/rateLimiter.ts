// Simple in-memory token bucket rate limiter (per IP) for serverless runtime.
// NOTE: In production use a durable store (Redis) to avoid per-instance bypass.

interface Bucket {
  tokens: number;
  lastRefill: number; // epoch ms
}

const capacity = 30; // requests
const intervalMs = 60_000; // per minute
const buckets: Map<string, Bucket> = new Map();

function refill(bucket: Bucket) {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  if (elapsed > intervalMs) {
    const periods = Math.floor(elapsed / intervalMs);
    bucket.tokens = Math.min(capacity, bucket.tokens + periods * capacity);
    bucket.lastRefill = now;
  }
}

export function consume(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const key = ip || 'unknown';
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: Date.now() };
    buckets.set(key, bucket);
  }
  refill(bucket);
  if (bucket.tokens <= 0) {
    const resetIn = intervalMs - (Date.now() - bucket.lastRefill);
    return { allowed: false, remaining: 0, resetMs: resetIn };
  }
  bucket.tokens -= 1;
  const resetIn = intervalMs - (Date.now() - bucket.lastRefill);
  return { allowed: true, remaining: bucket.tokens, resetMs: resetIn };
}
