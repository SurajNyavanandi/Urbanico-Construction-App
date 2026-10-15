import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseOtpOptions {
  length?: number;
  initialCountdown?: number;
  defaultCode?: string;
  onAutoVerify?: (code: string) => void;
}

export function useOtpVerification({
  length = 6,
  initialCountdown = 30,
  defaultCode,
  onAutoVerify,
}: UseOtpOptions = {}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [countdown, setCountdown] = useState<number>(initialCountdown);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetTimeRef = useRef<number>(Date.now() + initialCountdown * 1000);

  // Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const restartCountdown = useCallback((seconds: number = initialCountdown) => {
    targetTimeRef.current = Date.now() + seconds * 1000;
    setCountdown(seconds);
  }, [initialCountdown]);

  const setDigit = useCallback((index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    setError(null);

    // Paste handling
    if (clean.length > 1) {
      const newDigits = Array(length).fill('');
      const chars = clean.slice(0, length).split('');
      for (let i = 0; i < length; i++) {
        newDigits[i] = chars[i] || '';
      }
      setDigits(newDigits);
      if (newDigits.every((d) => d !== '') && onAutoVerify) {
        onAutoVerify(newDigits.join(''));
      }
      return;
    }

    setDigits((prev) => {
      const copy = [...prev];
      copy[index] = clean;
      if (copy.every((d) => d !== '') && onAutoVerify) {
        onAutoVerify(copy.join(''));
      }
      return copy;
    });
  }, [length, onAutoVerify]);

  const fillDefault = useCallback(() => {
    if (defaultCode) {
      const chars = defaultCode.slice(0, length).split('');
      const arr = Array(length).fill('');
      for (let i = 0; i < length; i++) {
        arr[i] = chars[i] || '';
      }
      setDigits(arr);
      setError(null);
    }
  }, [defaultCode, length]);

  const resetOtp = useCallback(() => {
    setDigits(Array(length).fill(''));
    setError(null);
  }, [length]);

  const code = digits.join('');
  const isComplete = digits.every((d) => d !== '');

  return {
    digits,
    code,
    isComplete,
    countdown,
    isVerifying,
    setIsVerifying,
    isSending,
    setIsSending,
    error,
    setError,
    setDigit,
    setDigits,
    fillDefault,
    resetOtp,
    restartCountdown,
  };
}
