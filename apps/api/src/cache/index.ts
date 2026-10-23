interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  lastSuccessfulRefresh: string;
}

export class TieredCache {
  private store = new Map<string, CacheEntry<unknown>>();

  public get<T>(key: string): { data: T; isStale: boolean; lastSuccessfulRefresh: string } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    const isStale = now > entry.expiresAt;

    return {
      data: entry.data,
      isStale,
      lastSuccessfulRefresh: entry.lastSuccessfulRefresh,
    };
  }

  public set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    this.store.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
      lastSuccessfulRefresh: new Date(now).toISOString(),
    });
  }

  public invalidate(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

export const globalCache = new TieredCache();
