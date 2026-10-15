import { useState, useEffect, useCallback, useRef } from 'react';

// In-memory runtime cache for lightning-fast sub-millisecond lookups
const memoryCache = new Map<string, { data: any; timestamp: number }>();

const STORAGE_PREFIX = '@urbanico:swr:';

/**
 * Reads data synchronously from memory or sessionStorage.
 */
function readSyncCache<T>(key: string): { data: T; timestamp: number } | null {
  // 1. Check in-memory store first
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as { data: T; timestamp: number };
  }

  // 2. Fall back to sessionStorage if in browser environment
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_PREFIX + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.timestamp === 'number') {
          // Hydrate memory cache
          memoryCache.set(key, parsed);
          return parsed as { data: T; timestamp: number };
        }
      }
    } catch {
      // Ignore storage read/quota errors
    }
  }

  return null;
}

/**
 * Writes data synchronously to memory and sessionStorage.
 */
function writeSyncCache<T>(key: string, data: T): void {
  const entry = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Quota exceeded or private mode
    }
  }
}

export interface UseAsyncDataOptions<T> {
  /**
   * Unique cache identifier for SWR caching.
   */
  key: string;
  /**
   * Async fetcher function returning fresh data.
   */
  fetcher: () => Promise<T>;
  /**
   * Initial data fallback if neither memory nor sessionStorage has a cached record.
   */
  initialData?: T;
  /**
   * Time to live in ms. If cached data is younger than this, background revalidation can optionally be skipped.
   * Defaults to 0 (always revalidate in background).
   */
  ttlMs?: number;
  /**
   * Whether to automatically revalidate on component mount. Defaults to true.
   */
  revalidateOnMount?: boolean;
  /**
   * Whether to re-fetch when browser regains internet connectivity. Defaults to true.
   */
  revalidateOnReconnect?: boolean;
  /**
   * Callback fired upon successful fetch.
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback fired upon fetch failure.
   */
  onError?: (error: Error) => void;
}

export interface UseAsyncDataResult<T> {
  /**
   * Current data (either cached instant data or latest validated data).
   */
  data: T | undefined;
  /**
   * True only if there is NO cached data available and the initial fetch is in flight.
   */
  loading: boolean;
  /**
   * True whenever a background revalidation or manual reload is actively fetching.
   */
  isRefreshing: boolean;
  /**
   * Error object if the last fetch attempt failed.
   */
  error: Error | null;
  /**
   * Manually trigger revalidation.
   */
  reload: () => Promise<T | undefined>;
  /**
   * Timestamp in ms of when the cached data was last written.
   */
  lastUpdated: number | null;
  /**
   * Mutation helper to optimistically update local cache & state without waiting for network.
   */
  mutate: (newData: T | ((prev: T | undefined) => T), shouldRevalidate?: boolean) => void;
}

/**
 * useAsyncData
 * Cache-First (SWR - Stale While Revalidate) data fetching hook.
 * 
 * Guarantees 0ms perceived wait time by serving cached data synchronously on mount,
 * while automatically revalidating fresh data in the background and handling auto-retries on reconnect.
 */
export function useAsyncData<T>({
  key,
  fetcher,
  initialData,
  ttlMs = 0,
  revalidateOnMount = true,
  revalidateOnReconnect = true,
  onSuccess,
  onError,
}: UseAsyncDataOptions<T>): UseAsyncDataResult<T> {
  // Synchronous cache read for instant 0ms mount rendering
  const initialCacheEntry = readSyncCache<T>(key);

  const [data, setData] = useState<T | undefined>(() => {
    if (initialCacheEntry) {
      return initialCacheEntry.data;
    }
    return initialData;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    // Only show blocking loading state if no cached data exists
    return !initialCacheEntry && initialData === undefined;
  });

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    initialCacheEntry ? initialCacheEntry.timestamp : null
  );

  // References to keep callbacks current
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Revalidate fresh data in background or foreground
   */
  const revalidate = useCallback(async (): Promise<T | undefined> => {
    if (!isMountedRef.current) return undefined;

    // Check TTL if configured
    const cached = readSyncCache<T>(key);
    if (ttlMs > 0 && cached && Date.now() - cached.timestamp < ttlMs) {
      if (isMountedRef.current) {
        setData(cached.data);
        setLastUpdated(cached.timestamp);
        setLoading(false);
        setIsRefreshing(false);
      }
      return cached.data;
    }

    if (data === undefined && !cached) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const freshData = await fetcherRef.current();

      if (isMountedRef.current) {
        // Update synchronous caches
        writeSyncCache(key, freshData);

        setData(freshData);
        setLastUpdated(Date.now());
        setLoading(false);
        setIsRefreshing(false);
        setError(null);

        if (onSuccessRef.current) {
          onSuccessRef.current(freshData);
        }
      }
      return freshData;
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(errorObj);
        setLoading(false);
        setIsRefreshing(false);

        if (onErrorRef.current) {
          onErrorRef.current(errorObj);
        }
      }
      return undefined;
    }
  }, [key, ttlMs, data]);

  // Initial mount revalidation
  useEffect(() => {
    // If key changes, immediately check sync cache
    const currentCached = readSyncCache<T>(key);
    if (currentCached) {
      setData(currentCached.data);
      setLastUpdated(currentCached.timestamp);
      setLoading(false);
    } else if (initialData !== undefined) {
      setData(initialData);
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (revalidateOnMount) {
      revalidate();
    }
  }, [key]);

  // Automatic retry on network reconnection
  useEffect(() => {
    if (!revalidateOnReconnect || typeof window === 'undefined') return;

    const handleOnline = () => {
      revalidate();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [revalidateOnReconnect, revalidate]);

  // Optimistic Mutate Helper
  const mutate = useCallback(
    (newData: T | ((prev: T | undefined) => T), shouldRevalidate: boolean = false) => {
      setData((prev) => {
        const resolved = typeof newData === 'function' ? (newData as any)(prev) : newData;
        writeSyncCache(key, resolved);
        setLastUpdated(Date.now());
        return resolved;
      });

      if (shouldRevalidate) {
        revalidate();
      }
    },
    [key, revalidate]
  );

  return {
    data,
    loading,
    isRefreshing,
    error,
    reload: revalidate,
    lastUpdated,
    mutate,
  };
}

/**
 * Utility to manually pre-populate or invalidate SWR cache items externally
 */
export const swrCache = {
  get: <T>(key: string): T | null => {
    const entry = readSyncCache<T>(key);
    return entry ? entry.data : null;
  },
  set: <T>(key: string, data: T): void => {
    writeSyncCache(key, data);
  },
  clear: (key?: string): void => {
    if (key) {
      memoryCache.delete(key);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          window.sessionStorage.removeItem(STORAGE_PREFIX + key);
        } catch {
          // Ignore
        }
      }
    } else {
      memoryCache.clear();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          Object.keys(window.sessionStorage)
            .filter((k) => k.startsWith(STORAGE_PREFIX))
            .forEach((k) => window.sessionStorage.removeItem(k));
        } catch {
          // Ignore
        }
      }
    }
  },
};
