import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';

/**
 * usePersistedState
 * Synchronizes React state with local storage using Urbanico's SafeStorage abstraction.
 * Works seamlessly in sandboxed iframes and private browsing modes without throwing errors.
 * 
 * @example
 * const [savedAddress, setSavedAddress] = usePersistedState<string>('urbanico_user_address', '');
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = safeStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error) {
      console.warn(`[usePersistedState] Could not parse item for key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          safeStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`[usePersistedState] Could not save item for key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
