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
    if (typeof window !== 'undefined' && window.location) {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlScreen = params.get('screen') as ScreenType;
        if (urlScreen) return urlScreen;
      } catch {}
    }
    return 'home';
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | 'all'>(() => {
    if (typeof window !== 'undefined' && window.location) {
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

  // Synchronize URL parameters on browser navigation / popstate (Safely guarded for React Native Android / iOS runtimes)
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !window.location ||
      typeof window.addEventListener !== 'function'
    ) {
      return;
    }
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
    if (
      typeof window === 'undefined' ||
      !window.location ||
      !window.history?.replaceState
    ) {
      return;
    }
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
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {}
  };

  const isTransitioningRef = useRef(false);

  const navigateTo = useCallback(
    (screen: ScreenType, categoryId?: CategoryId | 'all') => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const newCategory = categoryId || (screen === 'home' ? 'all' : selectedCategoryId);

      if (screenPreloaders && screenPreloaders[screen]) {
        screenPreloaders[screen]().catch(() => {});
      }

      startTransition(() => {
        setCurrentScreen(screen);
        setSelectedCategoryId(newCategory);
        updateUrlState(screen, newCategory);
        isTransitioningRef.current = false;
      });
    },
    [screenPreloaders, selectedCategoryId]
  );

  const selectCategory = useCallback(
    (catId: CategoryId | 'all') => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      startTransition(() => {
        setSelectedCategoryId(catId);
        setCurrentScreen('shop');
        updateUrlState('shop', catId);
        isTransitioningRef.current = false;
      });
    },
    []
  );

  const handleFavoriteAction = useCallback(
    (itemId: string, isLoggedIn: boolean, openLoginModal?: () => void) => {
      if (!isLoggedIn) {
        setPendingIntent({ type: 'favorite', itemId });
        if (openLoginModal) openLoginModal();
        return false;
      }
      return true;
    },
    []
  );

  const handleCheckoutAction = useCallback(
    (isLoggedIn: boolean, openLoginModal?: () => void) => {
      if (!isLoggedIn) {
        setPendingIntent({ type: 'checkout' });
        if (openLoginModal) openLoginModal();
        return false;
      }
      navigateTo('basket');
      return true;
    },
    [navigateTo]
  );

  const handleViewInvoiceAction = useCallback(
    (delivery: ActivityDelivery, isLoggedIn: boolean, openLoginModal?: () => void) => {
      if (!isLoggedIn) {
        setPendingIntent({ type: 'view_invoice', delivery });
        if (openLoginModal) openLoginModal();
        return;
      }
      navigateTo('basket');
    },
    [navigateTo]
  );

  const clearPendingIntent = useCallback(() => {
    setPendingIntent(null);
  }, []);

  const preloadScreen = useCallback((screen: ScreenType) => {
    if (screenPreloaders && screenPreloaders[screen]) {
      screenPreloaders[screen]().catch(() => {});
    }
  }, [screenPreloaders]);

  const getScreenTitle = useCallback((screen: ScreenType): string => {
    switch (screen) {
      case 'home': return 'Urbanico Direct Yard';
      case 'shop': return 'Materials & Services Catalog';
      case 'basket': return 'Site Delivery & Cart';
      case 'favorites': return 'Saved Contractor Supplies';
      case 'activity': return 'Consignment Dispatch Hub';
      case 'profile': return 'Contractor Business Profile';
      default: return 'Urbanico';
    }
  }, []);

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
    navigateTo,
    navigateScreen: navigateTo,
    preloadScreen,
    getScreenTitle,
    selectCategory,
    handleFavoriteAction,
    handleCheckoutAction,
    handleViewInvoiceAction,
    clearPendingIntent,
  };
}

