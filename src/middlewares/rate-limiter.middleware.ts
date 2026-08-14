import type { MiddlewareHandler } from 'hono'
import { RateLimitExceededError } from '@/utils/errors'

type Bucket = { count: number; resetAt: number }

/**
 * Rate limiter in-memory sederhana (fixed window).
 * CATATAN: untuk production multi-instance, ganti store ini dengan Redis
 * supaya limit konsisten across instance. Untuk portfolio/single-instance,
 * in-memory sudah cukup dan lebih simpel.
 */
export function rateLimiter({ windowMs, limit }: { windowMs: number; limit: number }): MiddlewareHandler {
  const store = new Map<string, Bucket>()

  return async (c, next) => {
    const key = c.req.header('x-forwarded-for') ?? 'anonymous'
    const now = Date.now()
    const bucket = store.get(key)

    if (!bucket || bucket.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
    } else {
      bucket.count += 1
      if (bucket.count > limit) {
        throw new RateLimitExceededError()
      }
    }

    await next()
  }
}
