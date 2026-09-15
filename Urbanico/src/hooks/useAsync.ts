import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseAsyncState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
}

/**
 * useAsync
 * Reusable hook to execute asynchronous functions with clear loading, error, and data states.
 * Automatically guards against memory leaks if the component unmounts while the promise is pending.
 * 
 * @example
 * const { execute: fetchDeliveries, loading, error, data } = useAsync(
 *   () => DeliveryService.getAllDeliveries(),
 *   true // execute immediately on mount
 * );
 */
export function useAsync<T, Args extends any[] = any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  immediate: boolean = false
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    loading: immediate,
    error: null,
    data: null,
  });

  const isMountedRef = useRef<boolean>(true);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFnRef.current(...args);
        if (isMountedRef.current) {
          setState({ loading: false, error: null, data: result });
        }
        return result;
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setState({ loading: false, error: errorObj, data: null });
        }
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      (execute as any)();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}
