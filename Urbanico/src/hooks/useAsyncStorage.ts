import { useState, useEffect, useCallback, useRef } from 'react';
import { safeStorage } from '../utils/safeStorage';

// In-memory memory-first cache for synchronous 0ms lookups
const inMemoryCache = new Map<string, any>();

/**
 * Schedule background work using requestIdleCallback or microtask/setTimeout fallback
 */
function scheduleIdleWork(callback: () => void, timeoutMs = 150): () => void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const handle = (window as any).requestIdleCallback(callback, { timeout: timeoutMs });
    return () => {
      try {
        (window as any).cancelIdleCallback(handle);
      } catch {}
    };
  } else {
    const timer = setTimeout(callback, 20);
    return () => clearTimeout(timer);
  }
}

/**
 * Asynchronously serialize data in chunks or idle frames without blocking main thread
 */
function asyncSerialize<T>(value: T): Promise<string> {
  return new Promise((resolve, reject) => {
    scheduleIdleWork(() => {
      try {
        const serialized = JSON.stringify(value);
        resolve(serialized);
      } catch (err) {
        reject(err);
      }
    }, 100);
  });
}

/**
 * Asynchronously parse data in idle frames
 */
function asyncParse<T>(raw: string, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    scheduleIdleWork(() => {
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch {
        resolve(fallback);
      }
    }, 100);
  });
}

export interface UseAsyncStorageOptions<T> {
  debounceMs?: number;
  onPersistSuccess?: (key: string, value: T) => void;
  onPersistError?: (key: string, error: any) => void;
}

/**
 * useAsyncStorage Hook
 * 
 * Non-blocking background local storage persistence hook:
 * - 0ms instant initialization using synchronous memory cache and safeStorage
 * - Offloads JSON serialization and disk I/O to background idle frames (requestIdleCallback)
 * - Prevents UI stutter during high-frequency updates (cart quantity changes, location shifts, theme changes)
 * - Automatic debouncing and flush-on-unload safety
 */
export function useAsyncStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseAsyncStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, { isPersisting: boolean; flush: () => void }] {
  const { debounceMs = 250, onPersistSuccess, onPersistError } = options;

  // Initial read with 0ms sync resolution
  const [state, setState] = useState<T>(() => {
    // 1. Check in-memory warm cache first
    if (inMemoryCache.has(key)) {
      return inMemoryCache.get(key);
    }

    // 2. Read from safeStorage synchronously on first mount
    try {
      const stored = safeStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        inMemoryCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // ignore
    }

    const resolvedInitial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    inMemoryCache.set(key, resolvedInitial);
    return resolvedInitial;
  });

  const [isPersisting, setIsPersisting] = useState<boolean>(false);
  const stateRef = useRef<T>(state);
  stateRef.current = state;

  const debounceTimerRef = useRef<any>(null);
  const cancelIdleRef = useRef<(() => void) | null>(null);

  // Synchronous flush function for unmount or critical transitions
  const flush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (cancelIdleRef.current) {
      cancelIdleRef.current();
      cancelIdleRef.current = null;
    }

    try {
      const currentVal = stateRef.current;
      const serialized = JSON.stringify(currentVal);
      safeStorage.setItem(key, serialized);
      inMemoryCache.set(key, currentVal);
      setIsPersisting(false);
      onPersistSuccess?.(key, currentVal);
    } catch (err) {
      onPersistError?.(key, err);
    }
  }, [key, onPersistSuccess, onPersistError]);

  // Non-blocking update dispatcher
  const updateValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState((prev) => {
        const nextValue = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        
        // Update fast memory cache immediately for instantaneous reads across components
        inMemoryCache.set(key, nextValue);
        stateRef.current = nextValue;
        setIsPersisting(true);

        // Cancel previous timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        if (cancelIdleRef.current) {
          cancelIdleRef.current();
        }

        // Debounce and dispatch to idle frame
        debounceTimerRef.current = setTimeout(() => {
          cancelIdleRef.current = scheduleIdleWork(() => {
            try {
              // Async non-blocking JSON serialization
              const serialized = JSON.stringify(nextValue);
              safeStorage.setItem(key, serialized);
              setIsPersisting(false);
              onPersistSuccess?.(key, nextValue);
            } catch (err) {
              setIsPersisting(false);
              onPersistError?.(key, err);
            }
          }, 150);
        }, debounceMs);

        return nextValue;
      });
    },
    [key, debounceMs, onPersistSuccess, onPersistError]
  );

  // Flush on unmount to avoid losing state
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  return [state, updateValue, { isPersisting, flush }];
}

/**
 * Helper to perform async background serialization on an arbitrary object
 */
export const asyncStorageHelper = {
  scheduleIdle: scheduleIdleWork,
  asyncSerialize,
  asyncParse,
  setMemoryCache: (key: string, val: any) => inMemoryCache.set(key, val),
  getMemoryCache: (key: string) => inMemoryCache.get(key),
};
