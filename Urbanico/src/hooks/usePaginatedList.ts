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
 * Renders an initial lightweight chunk (8–12 items) for instant First Contentful Paint (FCP),
 * and incrementally expands the rendered slice as the user scrolls or requests more.
 */
export function usePaginatedList<T>({
  items,
  initialChunkSize = 10,
  chunkSize = 8,
  loadDelayMs = 0,
}: UsePaginatedListOptions<T>): UsePaginatedListResult<T> {
  const [renderedLimit, setRenderedLimit] = useState<number>(initialChunkSize);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset limit to initial chunk size whenever source items change (e.g. category switch or search query)
  useEffect(() => {
    setRenderedLimit(initialChunkSize);
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

  const totalCount = items.length;
  const hasMore = renderedLimit < totalCount;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    if (loadDelayMs > 0) {
      setIsLoadingMore(true);
      loadingTimerRef.current = setTimeout(() => {
        setRenderedLimit((prev) => Math.min(prev + chunkSize, totalCount));
        setIsLoadingMore(false);
      }, loadDelayMs);
    } else {
      setRenderedLimit((prev) => Math.min(prev + chunkSize, totalCount));
    }
  }, [hasMore, isLoadingMore, loadDelayMs, chunkSize, totalCount]);

  const reset = useCallback(() => {
    setRenderedLimit(initialChunkSize);
    setIsLoadingMore(false);
  }, [initialChunkSize]);

  const displayedItems = useMemo(() => {
    return items.slice(0, renderedLimit);
  }, [items, renderedLimit]);

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
