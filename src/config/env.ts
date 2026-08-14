import { z } from 'zod'
import 'dotenv/config'

/**
 * Semua environment variable divalidasi di sini saat aplikasi start.
 * Kalau ada yang kosong/salah format, aplikasi akan gagal start (fail-fast)
 * daripada error random di tengah request nanti.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // GitHub
  GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN wajib diisi (personal access token GitHub)'),

  // AI Provider (OpenAI-compatible)
  AI_API_KEY: z.string().min(1, 'AI_API_KEY wajib diisi'),
  AI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().default('gpt-4o-mini'),

  // Database (opsional untuk tahap awal)
  DATABASE_URL: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(16, 'JWT_SECRET minimal 16 karakter').optional(),

  // Rate limit
  RATE_LIMIT_ANALYZE_PER_MIN: z.coerce.number().default(5),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Environment variable tidak valid:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
