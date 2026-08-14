import type { Context } from 'hono'

/**
 * Envelope response standar - dipakai di SEMUA endpoint
 * supaya frontend tidak perlu menebak-nebak bentuk response.
 */
export function ok<T>(c: Context, data: T, meta?: Record<string, unknown>, status: 200 | 201 = 200) {
  return c.json({ success: true, data, ...(meta ? { meta } : {}) }, status)
}

export function fail(
  c: Context,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502,
  code: string,
  message: string
) {
  return c.json({ success: false, error: { code, message } }, status)
}
