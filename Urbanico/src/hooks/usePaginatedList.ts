import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface UsePaginatedListOptions<T> {
  /**
   * The complete array of filtered and sorted items.
   */
  items: T[];
  /**
   * Initial number of items to render on first mount/reset (e.g. 8–12). Defaults to 10.
   */
  initialChunkSize?: number;
  /**
   * Number of items to append on each subsequent load chunk. Defaults to 8.
   */
  chunkSize?: number;
  /**
   * Delay in ms to simulate async batching or smooth frame rendering (defaults to 0 for instant sync).
   */
  loadDelayMs?: number;
}

export interface UsePaginatedListResult<T> {
  /**
   * Sliced items currently visible in the DOM/Virtual Viewport.
   */
  displayedItems: T[];
  /**
   * Total count of source items.
   */
  totalCount: number;
  /**
   * Count of currently rendered items.
   */
  renderedCount: number;
  /**
   * Boolean indicating if more items can be loaded.
   */
  hasMore: boolean;
  /**
   * Loading state for active chunk appends.
   */
  isLoadingMore: boolean;
  /**
   * Triggers loading the next chunk of items.
   */
  loadMore: () => void;
  /**
   * Resets display slice to initialChunkSize.
   */
  reset: () => void;
  /**
   * Percentage of total list rendered (0 to 100).
   */
  progressPercentage: number;
}

/**
 * usePaginatedList
 * High-performance progressive chunking hook for heavy product & trade service catalogs.
 * Renders an initial high-density chunk (36 items) for instant First Contentful Paint (FCP)
 * without waiting, and appends 24 items synchronously with zero delay.
 * If total items are under 50, renders all items directly without pagination splits.
 */
export function usePaginatedList<T>({
  items,
  initialChunkSize = 36,
  chunkSize = 24,
  loadDelayMs = 0,
}: UsePaginatedListOptions<T>): UsePaginatedListResult<T> {
  const totalCount = items.length;
  // If catalog is compact (<= 50 items), render all items directly without chunking
  const isCompactList = totalCount <= 50;

  const [renderedLimit, setRenderedLimit] = useState<number>(() =>
    isCompactList ? totalCount : initialChunkSize
  );
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset limit whenever source items change (e.g. category switch or search query)
  useEffect(() => {
    setRenderedLimit(items.length <= 50 ? items.length : initialChunkSize);
    setIsLoadingMore(false);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, [items, initialChunkSize]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  const hasMore = !isCompactList && renderedLimit < totalCount;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    if (loadDelayMs > 0) {
      setIsLoadingMore(true);
      loadingTimerRef.current = setTimeout(() => {
        setRenderedLimit((prev) => Math.min(prev + chunkSize, totalCount));
        setIsLoadingMore(false);
      }, loadDelayMs);
    } else {
      // Instant synchronous chunk expansion in next animation frame
      setRenderedLimit((prev) => Math.min(prev + chunkSize, totalCount));
    }
  }, [hasMore, isLoadingMore, loadDelayMs, chunkSize, totalCount]);

  const reset = useCallback(() => {
    setRenderedLimit(items.length <= 50 ? items.length : initialChunkSize);
    setIsLoadingMore(false);
  }, [items.length, initialChunkSize]);

  const displayedItems = useMemo(() => {
    if (isCompactList) return items;
    return items.slice(0, renderedLimit);
  }, [items, renderedLimit, isCompactList]);

  const renderedCount = displayedItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((renderedCount / totalCount) * 100) : 100;

  return {
    displayedItems,
    totalCount,
    renderedCount,
    hasMore,
    isLoadingMore,
    loadMore,
    reset,
    progressPercentage,
  };
}
