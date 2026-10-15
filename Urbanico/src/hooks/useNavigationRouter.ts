import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { ScreenType, CategoryId, ActivityDelivery } from '../types';

export type PendingIntent =
  | { type: 'favorite'; itemId: string }
  | { type: 'checkout' }
  | { type: 'view_invoice'; delivery: ActivityDelivery }
  | null;

export interface PreloadableLazyModule {
  preload?: () => Promise<any>;
}

export function useNavigationRouter(screenPreloaders?: Record<string, () => Promise<any>>) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlScreen = params.get('screen') as ScreenType;
        if (urlScreen) return urlScreen;
      } catch {}
    }
    return 'home';
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | 'all'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlCat = params.get('category') as CategoryId;
        if (urlCat) return urlCat;
      } catch {}
    }
    return 'all';
  });

  const [globalViewMode, setGlobalViewMode] = useState<'list' | 'grid'>('grid');
  const [openProfileAddresses, setOpenProfileAddresses] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>(null);

  // Synchronize URL parameters on browser navigation / popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlScreen = (params.get('screen') as ScreenType) || 'home';
        const urlCat = (params.get('category') as CategoryId) || 'all';
        setCurrentScreen(urlScreen);
        setSelectedCategoryId(urlCat);
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateUrlState = (scr: ScreenType, cat?: CategoryId | 'all') => {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    try {
      const url = new URL(window.location.href);
      if (scr === 'home') {
        url.searchParams.delete('screen');
      } else {
        url.searchParams.set('screen', scr);
      }
      if (cat && cat !== 'all') {
        url.searchParams.set('category', cat);
      } else {
        url.searchParams.delete('category');
      }
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };

  // Scroll position cache across tabs to preserve scroll offset when switching back and forth
  const scrollPositionsRef = useRef<Record<string, number>>({});

  const saveScrollPosition = useCallback((screen: ScreenType, position: number) => {
    scrollPositionsRef.current[screen] = Math.max(0, position);
  }, []);

  const getScrollPosition = useCallback((screen: ScreenType): number => {
    return scrollPositionsRef.current[screen] || 0;
  }, []);

  // Defer secondary screen prefetching to generous browser idle time (after homepage is interactive)
  useEffect(() => {
    if (!screenPreloaders) return;

    const prefetchRoutes = () => {
      // Only preload core shop/basket in idle, never block homepage
      try {
        if (screenPreloaders.shop) screenPreloaders.shop();
        if (screenPreloaders.basket) screenPreloaders.basket();
      } catch {}
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(prefetchRoutes, { timeout: 4000 });
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleId);
        }
      };
    } else {
      const timer = setTimeout(prefetchRoutes, 3000);
      return () => clearTimeout(timer);
    }
  }, [screenPreloaders]);

  const preloadScreen = useCallback(
    (scr: ScreenType) => {
      if (!screenPreloaders) return;
      if (scr === 'basket' && screenPreloaders.basket) screenPreloaders.basket();
      if (scr === 'favorites' && screenPreloaders.favorites) screenPreloaders.favorites();
      if ((scr === 'shop' || scr === 'category') && screenPreloaders.shop) {
        screenPreloaders.shop();
        screenPreloaders.category?.();
      }
      if (scr === 'profile' && screenPreloaders.profile) screenPreloaders.profile();
      if ((scr === 'activity' || scr === 'orders' || scr === 'order_history') && screenPreloaders.orders) screenPreloaders.orders();
      if (scr === 'activity' && screenPreloaders.activity) screenPreloaders.activity();
    },
    [screenPreloaders]
  );

  /**
   * Fast Screen Navigation wrapped in React.startTransition
   * Ensures tap feedback and touch inputs stay 60fps responsive without UI thread locking
   */
  const navigateScreen = useCallback((scr: ScreenType) => {
    startTransition(() => {
      if (scr === 'shop' || scr === 'category') {
        setSelectedCategoryId('all');
        updateUrlState(scr, 'all');
      } else {
        updateUrlState(scr);
      }
      setCurrentScreen(scr);
    });
  }, []);

  /**
   * Category Selection wrapped in React.startTransition
   */
  const selectCategory = useCallback(
    (catId: CategoryId | 'all' | 'services' | 'services-catalog') => {
      startTransition(() => {
        setSelectedCategoryId(catId as any);
        setCurrentScreen('shop');
        updateUrlState('shop', catId as any);
      });
    },
    []
  );

  const getScreenTitle = useCallback((): string => {
    if (currentScreen === 'shop' || currentScreen === 'category') return 'Shop';
    if (currentScreen === 'basket') return 'Cart';
    if (currentScreen === 'favorites') return 'Favourites';
    if (currentScreen === 'profile') return 'Profile';
    if (currentScreen === 'activity') return 'Activity Dashboard';
    if (currentScreen === 'orders' || currentScreen === 'order_history') return 'Order History';
    if (currentScreen === 'auth_mobile' || currentScreen === 'auth_otp')
      return 'Account Verification';
    return 'Home';
  }, [currentScreen]);

  return {
    currentScreen,
    setCurrentScreen,
    selectedCategoryId,
    setSelectedCategoryId,
    globalViewMode,
    setGlobalViewMode,
    openProfileAddresses,
    setOpenProfileAddresses,
    pendingIntent,
    setPendingIntent,
    preloadScreen,
    navigateScreen,
    selectCategory,
    getScreenTitle,
    saveScrollPosition,
    getScrollPosition,
  };
}
