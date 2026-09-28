import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useDynamicCatalog } from './useDynamicCatalog';
import { useNavigationRouter } from './useNavigationRouter';
import { SCREEN_PRELOADERS } from '../components/navigation/ScreenRouter';
import { useAuthSession } from './useAuthSession';
import { useFavoritesManager } from './useFavoritesManager';
import { useSearchManager } from './useSearchManager';
import { useOrderManager } from './useOrderManager';
import { useScrollLock } from './useScrollLock';
import { preloadImages } from '../utils/imageOptimization';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { MaterialItem, CartItem, UnitOption, ActivityDelivery } from '../types';
import { ProjectBundle } from '../components/HomeScreen';

export function useUrbanicoApp() {
  const { theme } = useTheme();
  const { showToast, showAddToCartToast } = useToast();

  // 1. Dynamic Catalog
  const {
    materials,
    categories,
    services,
    bundles,
    isLoading: isCatalogLoading,
  } = useDynamicCatalog();

  // 2. Location Context (Single Source of Truth)
  const {
    selectedLocation,
    savedLocations,
    setSelectedLocation,
    addLocation,
    editLocation,
    deleteLocation,
    resetLocationsToDefault,
    loadUserLocations,
  } = useLocation();

  // 3. Cart Context (Single Source of Truth)
  const {
    cartItems,
    addToCart,
    updateQuantity: handleUpdateCartQty,
    removeFromCart: handleRemoveCartItem,
    clearCart: handleClearCart,
    addBundleToCart,
    setCartItems,
    mergeGuestCartOnAuth,
    resetCartOnLogout,
  } = useCart();

  // 4. Navigation & Route Router
  const {
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
  } = useNavigationRouter(SCREEN_PRELOADERS);

  // 5. Modal State Management
  const [selectedItemForModal, setSelectedItemForModal] = useState<MaterialItem | null>(null);
  const [selectedInvoiceDelivery, setSelectedInvoiceDelivery] = useState<ActivityDelivery | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // 6. User Authentication & Session
  const { user, isLoggedIn, login, logout, updateUser } = useAuthSession({
    onLogoutCleanup: () => {
      resetCartOnLogout();
      resetLocationsToDefault();
      setIsAuthModalOpen(false);
      setIsLocationModalOpen(false);
      setSelectedItemForModal(null);
      setSelectedInvoiceDelivery(null);
      setOpenProfileAddresses(false);
    },
  });

  // 7. Favorites Management
  const {
    favoriteIds,
    toggleFavorite,
    mergeFavoritesOnLogin,
    resetFavorites,
  } = useFavoritesManager({
    isLoggedIn,
    userPhone: user.phone,
    materials,
    onRequireAuth: (itemId) => {
      setPendingIntent({ type: 'favorite', itemId });
      setIsAuthModalOpen(true);
    },
  });

  // 8. Search Management
  const {
    searchQuery,
    setSearchQuery,
    recentSearches,
    selectSearchQuery,
    clearRecentSearches,
    removeRecentSearch,
  } = useSearchManager({
    onSearchResolved: (targetCategory) => {
      setSelectedCategoryId(targetCategory);
      setCurrentScreen('shop');
    },
  });

  // 9. Orders & Deliveries with Native Razorpay Redirection Handling
  const {
    deliveries,
    addOrder,
    loadOrdersForPhone,
    resetOrders,
  } = useOrderManager({
    user,
    isLoggedIn,
    selectedLocation,
    onPaymentSuccess: () => {
      setCartItems([]);
      setCurrentScreen('activity');
      showToast('Payment verified successfully! Your order has been placed.', 'success');
    },
    onPaymentFailure: (errorMsg) => {
      setCurrentScreen('basket');
      showToast(errorMsg, 'error');
    },
    onPaymentCancel: () => {
      setCurrentScreen('basket');
      showToast('Payment was cancelled. Your cart is preserved.', 'info');
    },
  });

  // 10. Background scroll locking
  const isAnyModalOpen =
    isAuthModalOpen ||
    !!selectedItemForModal ||
    !!selectedInvoiceDelivery ||
    isLocationModalOpen;
  useScrollLock(isAnyModalOpen);

  // 11. Warm up catalog images in background
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadImages([
        ...MATERIAL_ITEMS.slice(0, 12).map((item) => ({
          url: item.image,
          preset: 'card' as const,
        })),
      ]);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Modal Action Handlers
  const handleOpenItemModal = useCallback((item: MaterialItem) => {
    setIsAuthModalOpen(false);
    setIsLocationModalOpen(false);
    setSelectedInvoiceDelivery(null);
    setSelectedItemForModal(item);
  }, []);

  const handleOpenAuthModal = useCallback(() => {
    setSelectedItemForModal(null);
    setIsLocationModalOpen(false);
    setSelectedInvoiceDelivery(null);
    setIsAuthModalOpen(true);
  }, []);

  const handleOpenLocationModal = useCallback(() => {
    setSelectedItemForModal(null);
    setIsAuthModalOpen(false);
    setSelectedInvoiceDelivery(null);
    setIsLocationModalOpen(true);
  }, []);

  const handleOpenInvoiceModal = useCallback((del: ActivityDelivery) => {
    setSelectedItemForModal(null);
    setIsAuthModalOpen(false);
    setIsLocationModalOpen(false);
    setSelectedInvoiceDelivery(del);
  }, []);

  const handleAddToCartFromModal = useCallback(
    (item: MaterialItem, option: UnitOption, quantity: number, totalPrice: number) => {
      const isService = item.categoryId === 'services' || item.id.startsWith('service-');
      const unitPrice = isService ? 99 : option.price;

      addToCart(item, option, quantity, unitPrice);

      showAddToCartToast({
        name: item.name,
        optionLabel: option.label,
        price: totalPrice || unitPrice * quantity,
        image: item.image,
        quantity,
        onViewCart: () => setCurrentScreen('basket'),
      });
    },
    [addToCart, showAddToCartToast, setCurrentScreen]
  );

  const handleBuyNowFromModal = useCallback(
    (item: MaterialItem, option: UnitOption, quantity: number) => {
      const isService = item.categoryId === 'services' || item.id.startsWith('service-');
      const unitPrice = isService ? 99 : option.price;

      addToCart(item, option, quantity, unitPrice);
      setSelectedItemForModal(null);
      setCurrentScreen('basket');
    },
    [addToCart, setCurrentScreen]
  );

  const handleAddBundleToCartAndNavigate = useCallback(
    (bundle: ProjectBundle) => {
      const bundleItems = bundle.bundleItems.map((bi) => ({
        itemId: bi.itemId,
        itemName: bi.itemName,
        categoryName: bi.categoryName,
        optionLabel: bi.optionLabel,
        unitPrice: bi.unitPrice,
        quantity: bi.quantity,
        image: bi.image,
      }));

      addBundleToCart(bundleItems);
      showToast(`Added ${bundle.bundleItems.length} items from ${bundle.title} to Cart!`, 'success');
      setCurrentScreen('basket');
    },
    [addBundleToCart, showToast, setCurrentScreen]
  );

  const handleAddToCartItem = useCallback(
    (item: CartItem) => {
      const option: UnitOption = {
        id: 'opt-unit',
        label: item.selectedOptionLabel,
        price: item.unitPrice,
        type: 'stepper',
      };
      const materialItem: MaterialItem = {
        id: item.itemId,
        name: item.itemName,
        categoryId: (item.categoryName || 'all') as any,
        defaultPrice: item.unitPrice,
        image: item.image || '',
        actionType: 'add_to_cart',
        options: [option],
      };
      addToCart(materialItem, option, item.quantity || 1, item.unitPrice);
    },
    [addToCart]
  );

  const handleAuthSuccess = useCallback(
    (phoneNum: string) => {
      const validPhone = (phoneNum || '').trim();
      login(validPhone);
      loadUserLocations(validPhone);
      mergeGuestCartOnAuth(validPhone);
      mergeFavoritesOnLogin(validPhone);
      loadOrdersForPhone(validPhone);

      // Resume pending intent
      if (pendingIntent) {
        if (pendingIntent.type === 'favorite') {
          toggleFavorite(pendingIntent.itemId);
        } else if (pendingIntent.type === 'checkout') {
          setCurrentScreen('basket');
        } else if (pendingIntent.type === 'view_invoice') {
          setSelectedInvoiceDelivery(pendingIntent.delivery);
        }
        setPendingIntent(null);
      }

      // Exit full-screen auth routes after successful auth
      if (currentScreen === 'auth_mobile' || currentScreen === 'auth_otp') {
        setCurrentScreen('home');
      }
    },
    [
      login,
      loadUserLocations,
      mergeGuestCartOnAuth,
      mergeFavoritesOnLogin,
      loadOrdersForPhone,
      pendingIntent,
      toggleFavorite,
      setCurrentScreen,
      setPendingIntent,
      currentScreen,
    ]
  );

  const handleFullLogout = useCallback(() => {
    logout();
    resetOrders();
    resetFavorites();
  }, [logout, resetOrders, resetFavorites]);

  const handleSelectLocationAndSyncUser = useCallback(
    (loc: string) => {
      setSelectedLocation(loc);
      updateUser({ siteLocation: loc });
    },
    [setSelectedLocation, updateUser]
  );

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    theme,
    isCatalogLoading,
    materials,
    categories,
    services,
    bundles,
    currentScreen,
    setCurrentScreen,
    selectedCategoryId,
    globalViewMode,
    setGlobalViewMode,
    openProfileAddresses,
    setOpenProfileAddresses,
    preloadScreen,
    navigateScreen,
    selectCategory,
    getScreenTitle,
    selectedLocation,
    savedLocations,
    addLocation,
    editLocation,
    deleteLocation,
    handleSelectLocationAndSyncUser,
    cartItems,
    handleUpdateCartQty,
    handleRemoveCartItem,
    handleClearCart,
    handleAddToCartItem,
    totalCartCount,
    deliveries,
    addOrder,
    user,
    updateUser,
    isLoggedIn,
    handleFullLogout,
    handleAuthSuccess,
    favoriteIds,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    recentSearches,
    selectSearchQuery,
    clearRecentSearches,
    removeRecentSearch,
    isAuthModalOpen,
    setIsAuthModalOpen,
    handleOpenAuthModal,
    selectedItemForModal,
    setSelectedItemForModal,
    handleOpenItemModal,
    handleAddToCartFromModal,
    handleBuyNowFromModal,
    selectedInvoiceDelivery,
    setSelectedInvoiceDelivery,
    handleOpenInvoiceModal,
    isLocationModalOpen,
    setIsLocationModalOpen,
    handleOpenLocationModal,
    handleAddBundleToCartAndNavigate,
  };
}
