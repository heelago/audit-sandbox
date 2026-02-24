interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, RateLimitBucket>;
};

const store = globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitBucket>();
if (!globalForRateLimit.rateLimitStore) {
  globalForRateLimit.rateLimitStore = store;
}

function pruneExpiredBuckets(now: number): void {
  if (store.size < 5000) return;
  for (const [key, value] of store.entries()) {
    if (now >= value.resetAt) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  pruneExpiredBuckets(now);
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, retryAfterSeconds: 0 };
}
