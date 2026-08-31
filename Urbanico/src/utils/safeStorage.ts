/**
 * Safe Cross-Platform Storage Adapter
 * Operates gracefully across Web, Expo, React Native (Hermes/JSC), and Node SSR.
 */

const memoryFallback = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
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

  removeItem: (key: string): void => {
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
