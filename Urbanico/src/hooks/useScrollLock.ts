import { useEffect } from 'react';

/**
 * Custom hook to lock document body scrolling when modals or bottom sheets are open.
 * Ensures smooth, professional web and mobile web experience without background scrolling.
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;

    if (isLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'auto';
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isLocked]);
}
