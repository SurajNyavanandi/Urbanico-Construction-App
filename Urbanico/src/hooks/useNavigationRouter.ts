import { useState, useEffect, useCallback } from 'react';
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
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | 'all'>('all');
  const [globalViewMode, setGlobalViewMode] = useState<'list' | 'grid'>('grid');
  const [openProfileAddresses, setOpenProfileAddresses] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>(null);

  // Eagerly prefetch secondary screens during idle time
  useEffect(() => {
    if (!screenPreloaders) return;

    const prefetchRoutes = () => {
      Object.values(screenPreloaders).forEach((preload) => {
        try {
          preload();
        } catch {}
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchRoutes, { timeout: 1000 });
    } else {
      const timer = setTimeout(prefetchRoutes, 100);
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
      if (scr === 'activity' && screenPreloaders.activity) screenPreloaders.activity();
    },
    [screenPreloaders]
  );

  const navigateScreen = useCallback((scr: ScreenType) => {
    if (scr === 'shop' || scr === 'category') {
      setSelectedCategoryId('all');
    }
    setCurrentScreen(scr);
  }, []);

  const selectCategory = useCallback(
    (catId: CategoryId | 'all' | 'services' | 'services-catalog') => {
      setSelectedCategoryId(catId as any);
      setCurrentScreen('shop');
    },
    []
  );

  const getScreenTitle = useCallback((): string => {
    if (currentScreen === 'shop' || currentScreen === 'category') return 'Shop';
    if (currentScreen === 'basket') return 'Cart';
    if (currentScreen === 'favorites') return 'Favourites';
    if (currentScreen === 'profile') return 'Profile';
    if (currentScreen === 'activity') return 'Activity Dashboard';
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
  };
}
