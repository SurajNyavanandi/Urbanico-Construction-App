import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseClipboardOptions {
  timeout?: number;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

/**
 * useClipboard
 * Reliable clipboard copy hook with automatic success-reset timer
 * and safe fallback if the navigator.clipboard API is restricted in an iframe.
 * 
 * @example
 * const { copy, copied } = useClipboard({ timeout: 2500 });
 * <button onClick={() => copy(order.orderNumber)}>
 *   {copied ? 'Copied!' : 'Copy Order ID'}
 * </button>
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const { timeout = 2000, onSuccess, onError } = options;
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback using temporary textarea for environments without clipboard API access
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        setCopied(true);
        setError(null);
        if (onSuccess) onSuccess();

        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (err: any) {
        const copyError = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(copyError);
        setCopied(false);
        if (onError) onError(copyError);
        return false;
      }
    },
    [timeout, onSuccess, onError]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}
