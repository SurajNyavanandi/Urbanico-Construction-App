import { useState, useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Reusable hook for detecting when an element is visible in the viewport.
 * Used for lazy loading, animations, and performant scroll triggers.
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverProps = {}
): [RefObject<T>, boolean] {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
  }, [threshold, rootMargin, triggerOnce]);

  return [elementRef, isVisible];
}
