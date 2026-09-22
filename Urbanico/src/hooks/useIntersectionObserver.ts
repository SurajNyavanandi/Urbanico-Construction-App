import { useState, useEffect, useRef, RefObject } from 'react';
import { Platform } from 'react-native';

export interface UseIntersectionObserverProps {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

/**
 * Reusable hook for detecting when an element is visible in the viewport using
 * native browser IntersectionObserver with zero external dependencies.
 * Used for native lazy loading of product images, scroll triggers, and view transitions.
 */
export function useIntersectionObserver<T extends HTMLElement = any>(
  options: UseIntersectionObserverProps = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.01, rootMargin = '180px 0px', triggerOnce = true, enabled = true } = options;
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState<boolean>(!enabled);

  useEffect(() => {
    // If lazy loading is disabled, trigger immediate visibility
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    // SSR or Non-Web fallback: Immediately show image if IntersectionObserver is unavailable
    if (
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      (Platform.OS !== 'web' && typeof (global as any).IntersectionObserver === 'undefined')
    ) {
      setIsVisible(true);
      return;
    }

    const rawRef = elementRef.current;
    if (!rawRef) {
      return;
    }

    // Support React Native Web DOM node resolution
    const node: Element | null =
      (rawRef as any) instanceof Element
        ? (rawRef as any)
        : (rawRef as any)?._nativeNode ||
          (rawRef as any)?.node ||
          (typeof (rawRef as any)?.getScrollableNode === 'function' ? (rawRef as any).getScrollableNode() : null) ||
          null;

    if (!node || !(node instanceof Element)) {
      // If unable to query DOM node directly, mark visible to avoid breaking images
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(node);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, enabled]);

  return [elementRef, isVisible];
}

/**
 * Specialized image lazy loading hook providing optimized viewport margins
 */
export function useLazyImageLoad(options: UseIntersectionObserverProps = {}) {
  const [ref, isVisible] = useIntersectionObserver<any>({
    rootMargin: '200px 0px',
    threshold: 0.01,
    triggerOnce: true,
    enabled: true,
    ...options,
  });
  return { ref, isVisible };
}
