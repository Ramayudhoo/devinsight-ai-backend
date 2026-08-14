/**
 * Cache in-memory sederhana dengan TTL, pakai Map biasa.
 * CATATAN: untuk production multi-instance, ganti dengan Redis -
 * sama seperti rate limiter, in-memory cukup untuk single-instance/portfolio.
 *
 * Sengaja dibuat generic (bukan spesifik ke GitHub atau AI) supaya
 * service lain tidak peduli implementasi cache-nya apa - cukup panggil
 * cacheService.get/set/getOrSet.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Helper utama yang bakal paling sering dipakai: cek cache dulu,
   * kalau MISS baru jalanin fetcher() dan simpan hasilnya ke cache.
   */
  async getOrSet<T>(
    key: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
  ): Promise<{ value: T; cached: boolean }> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return { value: cached, cached: true };
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return { value: fresh, cached: false };
  }
}

export const cacheService = new CacheService();

export const CACHE_TTL = {
  GITHUB_DATA_MS: 10 * 60 * 1000, // 10 menit
  AI_RESULT_MS: 24 * 60 * 60 * 1000, // 24 jam
} as const;
