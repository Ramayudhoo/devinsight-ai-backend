import type { Context } from 'hono'
import { AppError } from '@/utils/errors'
import { logger } from '@/utils/logger'

/**
 * Dipasang via app.onError() di app.ts.
 * Semua error yang lolos sampai sini dibungkus jadi response JSON konsisten.
 * Stack trace TIDAK pernah dikirim ke client, hanya di-log server-side.
 */
export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, message: err.message, path: c.req.path })
    return c.json({ success: false, error: { code: err.code, message: err.message } }, err.statusCode as any)
  }

  logger.error({ err, path: c.req.path }, 'Unhandled error')
  return c.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal' } },
    500
  )
}
