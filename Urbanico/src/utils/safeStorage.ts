/**
 * Safe Cross-Platform Storage Adapter
 * Operates gracefully across Web, Expo, React Native (Hermes/JSC), and Node SSR.
 * Includes debounced auto-save mechanism to reduce storage write operations during rapid changes.
 */

const memoryFallback = new Map<string, string>();
const debounceTimers = new Map<string, any>();
const pendingDebouncedValues = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
    // If there is a pending debounced write for this key, return it so reads are immediately consistent
    if (pendingDebouncedValues.has(key)) {
      return pendingDebouncedValues.get(key) ?? null;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage restricted or unavailable
    }
    return memoryFallback.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    // Cancel any pending debounced timer for this key since an immediate write is happening
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
      debounceTimers.delete(key);
      pendingDebouncedValues.delete(key);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Storage quota or restricted
    }
    memoryFallback.set(key, value);
  },

  /**
   * Debounced setItem: Batches frequent writes (e.g. quantity adjustments) into a single disk/localStorage write.
   */
  setDebouncedItem: (key: string, value: string, delayMs = 450): void => {
    pendingDebouncedValues.set(key, value);
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
    }
    const timer = setTimeout(() => {
      debounceTimers.delete(key);
      pendingDebouncedValues.delete(key);
      try {
        if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch {
        // Storage quota or restricted
      }
      memoryFallback.set(key, value);
    }, delayMs);
    debounceTimers.set(key, timer);
  },

  /**
   * Immediately commits any pending debounced writes to storage without waiting for timer expiry.
   */
  flushDebounced: (key?: string): void => {
    if (key) {
      if (debounceTimers.has(key)) {
        clearTimeout(debounceTimers.get(key));
        debounceTimers.delete(key);
        const value = pendingDebouncedValues.get(key);
        pendingDebouncedValues.delete(key);
        if (value !== undefined) {
          try {
            if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
              window.localStorage.setItem(key, value);
            } else {
              memoryFallback.set(key, value);
            }
          } catch {}
        }
      }
    } else {
      debounceTimers.forEach((timer, k) => {
        clearTimeout(timer);
        const val = pendingDebouncedValues.get(k);
        if (val !== undefined) {
          try {
            if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
              window.localStorage.setItem(k, val);
            } else {
              memoryFallback.set(k, val);
            }
          } catch {}
        }
      });
      debounceTimers.clear();
      pendingDebouncedValues.clear();
    }
  },

  removeItem: (key: string): void => {
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
      debounceTimers.delete(key);
      pendingDebouncedValues.delete(key);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Storage restricted
    }
    memoryFallback.delete(key);
  },
};

// Automatically flush pending debounced writes on page unload / hide / tab switch
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  try {
    window.addEventListener('beforeunload', () => {
      safeStorage.flushDebounced();
    });
    window.addEventListener('pagehide', () => {
      safeStorage.flushDebounced();
    });
  } catch {}
}

