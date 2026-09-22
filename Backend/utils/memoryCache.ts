/**
 * Pure In-Memory TTL Cache for High-Throughput Node.js Services (Zero External Dependencies)
 * 
 * Provides O(1) map lookups, automatic expiration cleanup, and memoized Promise resolvers
 * to avoid redundant database queries and JSON serializations.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private defaultTtlMs: number = 300_000) {
    // Run garbage collection every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.purgeExpired();
    }, 120_000);

    // Unref interval so it does not block Node process exit
    if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public set(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public invalidatePattern(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  public async getOrSet(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return fresh;
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global Singletons for Backend Domains
export const materialCache = new MemoryCache<any>(180_000); // 3 minutes TTL
export const categoryCache = new MemoryCache<any>(300_000); // 5 minutes TTL
export const serviceCache = new MemoryCache<any>(300_000);  // 5 minutes TTL
export const bundleCache = new MemoryCache<any>(300_000);   // 5 minutes TTL
