import { useEffect, useCallback, useRef } from 'react';
import { MaterialItem, CategoryId, ScreenType } from '../types';
import {
  preloadImage,
  preloadImages,
  ImageSizePreset,
  imageCache,
} from '../utils/imageOptimization';

export interface UseImagePrefetchOptions {
  enabled?: boolean;
  currentScreen?: ScreenType;
  items?: MaterialItem[];
}

/**
 * useImagePrefetch
 * Multi-tier intelligent image prefetching hook.
 * Pre-caches next-screen images (top category thumbnails, hero showcases, and product detail images)
 * into browser disk cache and memory during idle frames for instant zero-latency rendering.
 */
export function useImagePrefetch(options?: UseImagePrefetchOptions) {
  const { enabled = true, currentScreen = 'home', items = [] } = options || {};
  const hasPrefetchedScreenRef = useRef<Record<string, boolean>>({});

  /**
   * Safe idle scheduler that runs tasks when the browser/JS thread is idle
   */
  const scheduleIdleTask = useCallback((task: () => void) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => task(), { timeout: 2000 });
    } else {
      setTimeout(task, 400);
    }
  }, []);

  /**
   * Prefetches a single image on hover/interaction (e.g. detail view preset)
   */
  const prefetchOnHover = useCallback((imageUrl?: string | null, preset: ImageSizePreset = 'detail') => {
    if (!imageUrl || imageCache.isCached(imageUrl)) return;
    scheduleIdleTask(() => {
      preloadImage(imageUrl, preset);
    });
  }, [scheduleIdleTask]);

  /**
   * Prefetches a list of URLs with a specific preset
   */
  const prefetchImagesList = useCallback(
    (urls: string[], preset: ImageSizePreset = 'thumbnail') => {
      if (!urls || urls.length === 0) return;
      scheduleIdleTask(() => {
        const toFetch = urls.filter((u) => u && !imageCache.isCached(u));
        if (toFetch.length > 0) {
          preloadImages(toFetch.map((url) => ({ url, preset })));
        }
      });
    },
    [scheduleIdleTask]
  );

  /**
   * Prefetches item detail images for a material item
   */
  const prefetchItemDetail = useCallback(
    (item?: MaterialItem | null) => {
      if (!item?.image) return;
      prefetchOnHover(item.image, 'detail');
    },
    [prefetchOnHover]
  );

  /**
   * Prefetches next screen images based on destination screen type
   */
  const prefetchNextScreen = useCallback(
    (nextScreen: ScreenType, screenItems: MaterialItem[] = items) => {
      if (!enabled) return;

      scheduleIdleTask(() => {
        if (nextScreen === 'shop' || nextScreen === 'category') {
          // Prefetch the top 8 catalog items for shop
          const topImages = screenItems.slice(0, 8).map((m) => m.image).filter(Boolean);
          if (topImages.length > 0) {
            preloadImages(topImages.map((url) => ({ url, preset: 'card' })));
          }
        } else if (nextScreen === 'basket') {
          // Basket thumbnails
          const basketImages = screenItems.slice(0, 4).map((m) => m.image).filter(Boolean);
          if (basketImages.length > 0) {
            preloadImages(basketImages.map((url) => ({ url, preset: 'thumbnail' })));
          }
        }
      });
    },
    [enabled, items, scheduleIdleTask]
  );

  /**
   * Prefetches images for a selected category
   */
  const prefetchCategoryImages = useCallback(
    (categoryId: CategoryId | 'all', allItems: MaterialItem[] = items) => {
      if (!enabled) return;

      scheduleIdleTask(() => {
        const filtered =
          categoryId === 'all'
            ? allItems
            : allItems.filter((i) => i.categoryId === categoryId);

        const categoryImages = filtered.slice(0, 6).map((m) => m.image).filter(Boolean);
        if (categoryImages.length > 0) {
          preloadImages(categoryImages.map((url) => ({ url, preset: 'card' })));
        }
      });
    },
    [enabled, items, scheduleIdleTask]
  );

  // Automatic screen-level prefetching on mount/screen change
  useEffect(() => {
    if (!enabled || hasPrefetchedScreenRef.current[currentScreen]) return;

    hasPrefetchedScreenRef.current[currentScreen] = true;

    scheduleIdleTask(() => {
      if (currentScreen === 'home') {
        // Pre-cache primary materials and category thumbnails for seamless navigation to Shop
        const topCatalogImages = items.slice(0, 10).map((m) => m.image).filter(Boolean);
        if (topCatalogImages.length > 0) {
          preloadImages(topCatalogImages.map((url) => ({ url, preset: 'card' })));
        }
      }
    });
  }, [currentScreen, enabled, items, scheduleIdleTask]);

  return {
    prefetchOnHover,
    prefetchImagesList,
    prefetchItemDetail,
    prefetchNextScreen,
    prefetchCategoryImages,
  };
}

export default useImagePrefetch;
