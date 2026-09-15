import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce
 * Delays updating a value until after `delayMs` milliseconds have elapsed
 * since the last time the value was changed.
 * Ideal for search bars, live calculations, and filter sliders.
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * useDebouncedCallback
 * Returns a memoized callback function that only triggers after `delayMs`
 * milliseconds since the last call.
 * 
 * @example
 * const handleQuantityChange = useDebouncedCallback((newQty: number) => {
 *   updateCart(item.id, newQty);
 * }, 400);
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 300
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always keep reference to latest callback without causing re-attaching
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );
}
