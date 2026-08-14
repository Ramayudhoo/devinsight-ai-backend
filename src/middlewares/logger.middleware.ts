import type { MiddlewareHandler } from 'hono'
import { logger } from '@/utils/logger'

/**
 * Log setiap request: method, path, status, durasi.
 * Setiap request dikasih requestId supaya gampang di-trace di log yang ramai.
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-Id', requestId)

  const start = performance.now()
  await next()
  const durationMs = Math.round(performance.now() - start)

  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
  })
}
