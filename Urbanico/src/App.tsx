import React, { useState, useEffect, lazy, Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LocationProvider, useLocation } from './context/LocationContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen, ProjectBundle } from './components/HomeScreen';
import { ItemQuantityModal } from './components/ItemQuantityModal';
import { SettingsScreen } from './components/SettingsScreen';
import { AuthScreen } from './components/AuthScreen';
import { BasketScreen } from './components/BasketScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { ShopScreen } from './components/ShopScreen';
import { NikeAuthModal } from './components/NikeAuthModal';
import { LocationModal } from './components/LocationModal';
import { InvoiceModal } from './components/InvoiceModal';
import { LanguagePromptModal } from './components/LanguagePromptModal';
import { preloadImages } from './utils/imageOptimization';
import { safeStorage } from './utils/safeStorage';
import { BRAND_LOGO_URL } from './constants';

// Lazy load heavy screens to optimize bundle size and app startup time
const CategoryDetailScreen = lazy(() => import('./components/CategoryDetailScreen'));
const UserProfileScreen = lazy(() => import('./components/UserProfileScreen'));
const ActivityDashboardScreen = lazy(() => import('./components/ActivityDashboardScreen'));

function ScreenLoadingFallback() {
  const { theme } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

import {
  ScreenType,
  CategoryId,
  MaterialItem,
  CartItem,
  UnitOption,
  UserProfile,
  ActivityDelivery,
} from './types';
import {
  INITIAL_USER,
  INITIAL_DELIVERIES,
  SAVED_LOCATIONS,
  CATEGORIES,
  SERVICES,
  MATERIAL_ITEMS,
} from './data/materialsData';
import { resolveSearchCategory } from './services/searchService';
import { apiService } from './services/apiService';

function MainAppContent() {
  const { theme } = useTheme();
  const { showToast, showAddToCartToast } = useToast();

  // Navigation & Screen State (Opens directly to Home screen by default)
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | 'all'>('sand');
  const [globalViewMode, setGlobalViewMode] = useState<'list' | 'grid'>('grid');
  const [openProfileAddresses, setOpenProfileAddresses] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Search & Location via LocationContext (Single Source of Truth)
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

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'UltraTech Cement 53',
    'Plastering Sand',
    'TMT 12mm Rebar',
    'Mason',
  ]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Intent resumption state when guest is asked to authenticate
  const [pendingIntent, setPendingIntent] = useState<
    | { type: 'favorite'; itemId: string }
    | { type: 'checkout' }
    | { type: 'view_invoice'; delivery: ActivityDelivery }
    | null
  >(null);

  const handleAddLocation = (newLoc: string) => {
    if (!newLoc.trim()) return;
    addLocation(newLoc.trim());
    showToast(`Saved new delivery address: ${newLoc.trim()}`, 'success');
  };

  const handleEditLocation = (oldLoc: string, newLoc: string) => {
    if (!newLoc.trim()) return;
    editLocation(oldLoc, newLoc.trim());
    showToast('Delivery address updated', 'success');
  };

  const handleDeleteLocation = (locToDelete: string) => {
    deleteLocation(locToDelete);
    showToast('Address removed', 'info');
  };

  // Warm up material and catalog images in the background after main thread settles
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadImages([
        ...MATERIAL_ITEMS.slice(0, 12).map((item) => ({ url: item.image, preset: 'card' as const })),
      ]);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // User & Auth with session persistence
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = safeStorage.getItem('urbanico_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        const phone = parsed.phone || '';
        if (phone) {
          const savedProfile = safeStorage.getItem(`urbanico_user_profile_${phone}`);
          if (savedProfile) {
            return {
              ...INITIAL_USER,
              ...JSON.parse(savedProfile),
              phone,
              isVerified: true,
            };
          }
          return {
            ...INITIAL_USER,
            phone,
            isVerified: true,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return {
      ...INITIAL_USER,
      isVerified: false,
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('urbanico_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!parsed.isLoggedIn;
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Modal Item Selection & Invoice Modal
  const [selectedItemForModal, setSelectedItemForModal] = useState<MaterialItem | null>(null);
  const [selectedInvoiceDelivery, setSelectedInvoiceDelivery] = useState<ActivityDelivery | null>(null);

  // Background scroll locking when any bottom sheet or modal is open on web
  const isAnyModalOpen =
    isAuthModalOpen ||
    !!selectedItemForModal ||
    !!selectedInvoiceDelivery ||
    isLocationModalOpen ||
    isLanguageModalOpen;

  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      if (isAnyModalOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  }, [isAnyModalOpen]);

  // Cart State (Persisted and partition-scoped per user / guest)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const key = phone ? `urbanico_cart_${phone}` : 'urbanico_cart_guest';
      const savedCart = safeStorage.getItem(key);
      if (savedCart) return JSON.parse(savedCart);
    } catch {
      // ignore
    }
    return [];
  });

  // Sync cart to storage whenever changed
  useEffect(() => {
    try {
      const key = isLoggedIn && user.phone ? `urbanico_cart_${user.phone}` : 'urbanico_cart_guest';
      safeStorage.setItem(key, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems, isLoggedIn, user.phone]);

  // Deliveries data (persisted for live production app)
  const [deliveries, setDeliveries] = useState<ActivityDelivery[]>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const isAuth = authSaved ? JSON.parse(authSaved).isLoggedIn : false;
      if (isAuth) {
        const saved = safeStorage.getItem('urbanico_orders');
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const handleOrderCreated = (newOrder: ActivityDelivery) => {
    setDeliveries((prev) => {
      const updated = [newOrder, ...prev];
      try {
        safeStorage.setItem('urbanico_orders', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Favorites State (persisted per user or guest session)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const isAuth = authSaved ? JSON.parse(authSaved).isLoggedIn : false;
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const key = isAuth && phone ? `urbanico_favorite_ids_${phone}` : 'urbanico_favorite_ids_guest';
      const favSaved = safeStorage.getItem(key) || safeStorage.getItem('urbanico_favorite_ids');
      if (favSaved) return JSON.parse(favSaved);
      if (isAuth) return ['plastering-sand', 'stone-20mm'];
    } catch {
      // ignore
    }
    return [];
  });

  // Sync favorites with storage whenever changed
  useEffect(() => {
    try {
      const key = isLoggedIn && user.phone ? `urbanico_favorite_ids_${user.phone}` : 'urbanico_favorite_ids_guest';
      safeStorage.setItem(key, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds, isLoggedIn, user.phone]);

  const handleToggleFavorite = (itemId: string) => {
    if (!isLoggedIn) {
      setPendingIntent({ type: 'favorite', itemId });
      showToast('Please log in to save items to your favorites', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    const isFavNow = !favoriteIds.includes(itemId);
    setFavoriteIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
    const item = MATERIAL_ITEMS.find((m) => m.id === itemId);
    const itemName = item ? item.name : 'Item';
    showToast(isFavNow ? `Saved ${itemName} to Favorites` : `Removed ${itemName} from Favorites`, 'info');
  };

  const generateCartItemId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `cart-${crypto.randomUUID()}`;
    }
    return `cart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Search Handlers
  const handleSelectSearchQuery = (queryStr: string) => {
    if (!queryStr || !queryStr.trim()) return;
    const cleanQuery = queryStr.trim();
    setSearchQuery(cleanQuery);
    setRecentSearches((prev) => [
      cleanQuery,
      ...prev.filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase()),
    ].slice(0, 6));

    // Resolve exact subcategory (e.g. 'sand', 'bricks', 'cement', 'stone', 'iron_bars', 'centring', 'services-catalog')
    const resolution = resolveSearchCategory(cleanQuery);
    setSelectedCategoryId(resolution.categoryId);
    setCurrentScreen('category');
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleRemoveRecentSearch = (queryStr: string) => {
    setRecentSearches((prev) =>
      prev.filter((item) => item.toLowerCase() !== queryStr.toLowerCase())
    );
  };

  // Sync with backend on mount and auth changes
  useEffect(() => {
    // 1. Fetch live orders from backend API only if user is logged in
    if (isLoggedIn && user.phone) {
      apiService
        .getOrders({ phone: user.phone })
        .then((backendOrders) => {
          if (backendOrders && backendOrders.length > 0) {
            setDeliveries((prev) => {
              const backendMapped: ActivityDelivery[] = backendOrders.map((bo: any) => ({
                id: bo._id || `del-${bo.orderNumber}`,
                orderNumber: bo.orderNumber,
                materialName:
                  bo.items?.map((i: any) => `${i.name} (${i.unit || 'unit'})`).join(', ') ||
                  'Direct Yard Supply Order',
                quantity: `${bo.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1} Items`,
                driverName: bo.driverName || 'Ramesh Goud',
                driverPhone: bo.driverPhone || '+91 98480 22341',
                vehicleType: '10-Tyre Tipper (16T)',
                vehicleNumber: bo.vehicleNumber || 'TS 08 UB 8821',
                estimatedArrival: '35 mins away',
                status: bo.orderStatus === 'delivered' ? 'Delivered' : 'En Route',
                siteAddress: bo.siteAddress?.street || bo.siteAddress?.siteName || 'Construction Site',
                siteSupervisorName: bo.customerName || 'Site Supervisor',
                siteSupervisorPhone: bo.customerPhone || user.phone,
                timestamp: new Date(bo.createdAt || Date.now()).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                }),
                totalAmount: bo.totalAmount || 0,
                deliveryOtp: bo.deliveryOtp || '8842',
                ewayBillNumber: bo.eWayBillNo || `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
                weighmentSlipId: `WB-MYP-${Math.floor(1000 + Math.random() * 9000)}`,
              }));
              const existingNums = new Set(prev.map((d) => d.orderNumber));
              const newOnes = backendMapped.filter((d) => !existingNums.has(d.orderNumber));
              return [...newOnes, ...prev];
            });
          }
        })
        .catch(() => {});

      // 2. Fetch user profile from backend API
      apiService
        .getUserProfile(user.phone)
        .then((serverUser) => {
          if (serverUser) {
            setUser((prev) => ({
              ...prev,
              name: serverUser.name || prev.name,
              email: serverUser.email || prev.email,
              companyName: serverUser.companyName || prev.companyName,
              gstin: serverUser.gstin || prev.gstin,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isLoggedIn, user.phone]);

  // Profile Update Handler with persistence
  const handleUpdateUser = (updatedData: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      try {
        if (updated.phone) {
          safeStorage.setItem(`urbanico_user_profile_${updated.phone}`, JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return updated;
    });
    if (updatedData.phone) {
      apiService.updateUserProfile(updatedData.phone, updatedData).catch(() => {});
    }
    if (updatedData.siteLocation) {
      setSelectedLocation(updatedData.siteLocation);
    }
    showToast('Profile details updated successfully', 'success');
  };


  const handleSelectLocation = (loc: string) => {
    setSelectedLocation(loc);
    setUser((prev) => ({ ...prev, siteLocation: loc }));
    showToast(`Delivery location set to ${loc}`, 'info');
  };

  // Navigation Handlers
  const handleSelectCategory = (catId: CategoryId) => {
    setSelectedCategoryId(catId);
    setCurrentScreen('category');
  };

  const handleOpenItemModal = (item: MaterialItem) => {
    setIsAuthModalOpen(false);
    setIsLocationModalOpen(false);
    setIsLanguageModalOpen(false);
    setSelectedInvoiceDelivery(null);
    setSelectedItemForModal(item);
  };

  const handleOpenAuthModal = () => {
    setSelectedItemForModal(null);
    setIsLocationModalOpen(false);
    setIsLanguageModalOpen(false);
    setSelectedInvoiceDelivery(null);
    setIsAuthModalOpen(true);
  };

  const handleOpenLocationModal = () => {
    setSelectedItemForModal(null);
    setIsAuthModalOpen(false);
    setIsLanguageModalOpen(false);
    setSelectedInvoiceDelivery(null);
    setIsLocationModalOpen(true);
  };

  const handleOpenInvoiceModal = (del: ActivityDelivery) => {
    setSelectedItemForModal(null);
    setIsAuthModalOpen(false);
    setIsLocationModalOpen(false);
    setIsLanguageModalOpen(false);
    setSelectedInvoiceDelivery(del);
  };

  const handleAddToCartFromModal = (
    item: MaterialItem,
    option: UnitOption,
    quantity: number,
    totalPrice: number
  ) => {
    const newItem: CartItem = {
      id: generateCartItemId(),
      itemId: item.id,
      itemName: item.name,
      categoryName: item.categoryId,
      selectedOptionLabel: option.label,
      unitPrice: option.price,
      quantity: quantity,
      image: item.image,
    };

    setCartItems((prev) => {
      // If item with same option already in cart, increment quantity
      const existingIdx = prev.findIndex(
        (ci) => ci.itemId === item.id && ci.selectedOptionLabel === option.label
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }
      return [newItem, ...prev];
    });

    showAddToCartToast({
      name: item.name,
      optionLabel: option.label,
      price: totalPrice || option.price * quantity,
      image: item.image,
      quantity: quantity,
      onViewCart: () => setCurrentScreen('basket'),
    });
  };

  const handleBuyNowFromModal = (
    item: MaterialItem,
    option: UnitOption,
    quantity: number,
    totalPrice: number
  ) => {
    const newItem: CartItem = {
      id: generateCartItemId(),
      itemId: item.id,
      itemName: item.name,
      categoryName: item.categoryId,
      selectedOptionLabel: option.label,
      unitPrice: option.price,
      quantity: quantity,
      image: item.image,
    };

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.itemId === item.id && ci.selectedOptionLabel === option.label
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }
      return [newItem, ...prev];
    });

    setSelectedItemForModal(null);
    setCurrentScreen('basket');
  };

  const handleAddBundleToCartAndNavigate = (bundle: ProjectBundle) => {
    const itemsToAdd: CartItem[] = bundle.bundleItems.map((bi) => ({
      id: generateCartItemId(),
      itemId: bi.itemId,
      itemName: bi.itemName,
      categoryName: bi.categoryName,
      selectedOptionLabel: bi.optionLabel,
      unitPrice: bi.unitPrice,
      quantity: bi.quantity,
      image: bi.image,
    }));

    setCartItems((prev) => {
      const updated = [...prev];
      itemsToAdd.forEach((newItem) => {
        const existingIdx = updated.findIndex(
          (ci) => ci.itemId === newItem.itemId && ci.selectedOptionLabel === newItem.selectedOptionLabel
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + newItem.quantity,
          };
        } else {
          updated.unshift(newItem);
        }
      });
      return updated;
    });

    showToast(`Added ${bundle.bundleItems.length} items from ${bundle.title} to Bag!`, 'success');
    setCurrentScreen('basket');
  };

  const handleUpdateCartQty = (cartId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (cartId: string) => {
    const itemToRemove = cartItems.find((ci) => ci.id === cartId);
    const itemName = itemToRemove ? itemToRemove.itemName : 'Item';
    setCartItems((prev) => prev.filter((item) => item.id !== cartId));
    showToast(`Removed ${itemName} from Cart`, 'info');
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast('Cart cleared', 'info');
  };

  const handleAuthSuccess = (phoneNum: string) => {
    setIsLoggedIn(true);
    const validPhone = phoneNum || '9876543210';

    // 1. Restore or initialize user profile
    let loadedProfile = { ...INITIAL_USER, phone: validPhone, isVerified: true };
    try {
      const savedProf = safeStorage.getItem(`urbanico_user_profile_${validPhone}`);
      if (savedProf) {
        loadedProfile = { ...loadedProfile, ...JSON.parse(savedProf) };
      }
    } catch {
      // ignore
    }
    setUser(loadedProfile);

    // 2. Load user addresses
    loadUserLocations(validPhone);

    // 3. Merge guest cart with existing user cart
    try {
      safeStorage.setItem(
        'urbanico_auth_session',
        JSON.stringify({ isLoggedIn: true, phone: validPhone })
      );

      // Merge cart items
      const userSavedCartRaw = safeStorage.getItem(`urbanico_cart_${validPhone}`);
      const userSavedCart: CartItem[] = userSavedCartRaw ? JSON.parse(userSavedCartRaw) : [];

      let mergedCart = [...userSavedCart];
      cartItems.forEach((guestItem) => {
        const matchIdx = mergedCart.findIndex(
          (ci) => ci.itemId === guestItem.itemId && ci.selectedOptionLabel === guestItem.selectedOptionLabel
        );
        if (matchIdx >= 0) {
          mergedCart[matchIdx] = {
            ...mergedCart[matchIdx],
            quantity: mergedCart[matchIdx].quantity + guestItem.quantity,
          };
        } else {
          mergedCart.push(guestItem);
        }
      });

      setCartItems(mergedCart);
      safeStorage.setItem(`urbanico_cart_${validPhone}`, JSON.stringify(mergedCart));

      // Merge favorites
      const userSavedFavsRaw = safeStorage.getItem(`urbanico_favorite_ids_${validPhone}`);
      const userSavedFavs: string[] = userSavedFavsRaw
        ? JSON.parse(userSavedFavsRaw)
        : ['plastering-sand', 'stone-20mm'];
      const mergedFavs = Array.from(new Set([...userSavedFavs, ...favoriteIds]));
      setFavoriteIds(mergedFavs);
      safeStorage.setItem(`urbanico_favorite_ids_${validPhone}`, JSON.stringify(mergedFavs));
    } catch {
      // ignore
    }

    // 4. Resume any pending user intent
    if (pendingIntent) {
      if (pendingIntent.type === 'favorite') {
        const itemToFav = pendingIntent.itemId;
        setFavoriteIds((prev) => (prev.includes(itemToFav) ? prev : [...prev, itemToFav]));
        showToast('Saved item to your favorites!', 'success');
      } else if (pendingIntent.type === 'checkout') {
        setCurrentScreen('basket');
      } else if (pendingIntent.type === 'view_invoice') {
        setSelectedInvoiceDelivery(pendingIntent.delivery);
      }
      setPendingIntent(null);
    } else {
      showToast('Account verified! Welcome to Urbanico.', 'success');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(INITIAL_USER);
    setDeliveries([]);
    setCartItems([]);
    setFavoriteIds([]);
    resetLocationsToDefault();
    try {
      safeStorage.removeItem('urbanico_auth_session');
      safeStorage.removeItem('urbanico_orders');
      safeStorage.removeItem('urbanico_cart_guest');
      safeStorage.removeItem('urbanico_favorite_ids_guest');
    } catch {
      // ignore
    }
    showToast('Logged out of Urbanico account', 'info');
  };

  // Determine current screen title for header
  const getScreenTitle = (): string => {
    if (currentScreen === 'shop') return 'Shop';
    if (currentScreen === 'category') {
      if (selectedCategoryId === 'all') return 'Materials Catalog';
      if (selectedCategoryId === 'services-catalog' || selectedCategoryId === 'services') return 'Services Catalog';
      const cat = CATEGORIES.find((c) => c.id === selectedCategoryId);
      if (cat) return cat.name;
      const srv = SERVICES.find((s) => s.id === selectedCategoryId);
      if (srv) return `${srv.name} Service`;
      return 'Materials';
    }
    if (currentScreen === 'basket') return 'Bag';
    if (currentScreen === 'favorites') return 'Favourites';
    if (currentScreen === 'profile') return 'Profile';
    if (currentScreen === 'settings') return 'Settings';
    if (currentScreen === 'activity') return 'Activity Dashboard';
    if (currentScreen === 'auth_mobile' || currentScreen === 'auth_otp') return 'Account Verification';
    return 'Home';
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
      <ExpoStatusBar style="dark" />

      {/* Main View Router with Suspense for Lazy Loaded Screens */}
      <View style={[styles.mainContent, { backgroundColor: '#FFFFFF' }]}>
        <Suspense fallback={<ScreenLoadingFallback />}>
          {currentScreen === 'shop' && (
            <ShopScreen
              onSelectCategoryTab={handleSelectCategory}
              onSelectItem={handleOpenItemModal}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentScreen === 'home' && (
            <HomeScreen
              headerComponent={
                <Header
                  currentScreen={currentScreen}
                  title={getScreenTitle()}
                  selectedLocation={selectedLocation}
                  onOpenLocationModal={handleOpenLocationModal}
                  onBack={undefined}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  recentSearches={recentSearches}
                  onSelectSearchQuery={handleSelectSearchQuery}
                  onClearRecentSearches={handleClearRecentSearches}
                  onRemoveRecentSearch={handleRemoveRecentSearch}
                  onSelectItemModal={handleOpenItemModal}
                  onNavigateScreen={setCurrentScreen}
                />
              }
              onSelectCategory={handleSelectCategory}
              onNavigateAllMaterials={() => {
                setSelectedCategoryId('all');
                setCurrentScreen('category');
              }}
              onNavigateAllServices={() => {
                setSelectedCategoryId('services-catalog');
                setCurrentScreen('category');
              }}
              onSelectItem={handleOpenItemModal}
              searchQuery={searchQuery}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onAddBundleToCartAndNavigate={handleAddBundleToCartAndNavigate}
            />
          )}

          {currentScreen === 'category' && (
            <CategoryDetailScreen
              categoryId={selectedCategoryId}
              onSelectItem={handleOpenItemModal}
              onSelectCategoryTab={(catId) => setSelectedCategoryId(catId)}
              searchQuery={searchQuery}
              onBack={() => setCurrentScreen('home')}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              viewMode={globalViewMode}
              onViewModeChange={setGlobalViewMode}
            />
          )}

          {currentScreen === 'basket' && (
            <BasketScreen
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateCartQty}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              selectedLocation={selectedLocation}
              onNavigateScreen={setCurrentScreen}
              deliveries={deliveries}
              onOrderCreated={handleOrderCreated}
              onViewInvoice={handleOpenInvoiceModal}
              onChangeAddressRedirect={() => {
                setOpenProfileAddresses(true);
                setCurrentScreen('profile');
              }}
              isLoggedIn={isLoggedIn}
              onOpenLoginModal={handleOpenAuthModal}
            />
          )}

          {currentScreen === 'favorites' && (
            <FavoritesScreen
              onSelectItemModal={handleOpenItemModal}
              onNavigateHome={() => setCurrentScreen('home')}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              isLoggedIn={isLoggedIn}
              onOpenLoginModal={handleOpenAuthModal}
            />
          )}

          {currentScreen === 'profile' && (
            <UserProfileScreen
              user={user}
              onUpdateUser={handleUpdateUser}
              onNavigateScreen={(scr) => {
                setOpenProfileAddresses(false);
                setCurrentScreen(scr);
              }}
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
              savedLocations={savedLocations}
              onAddLocation={handleAddLocation}
              onEditLocation={handleEditLocation}
              onDeleteLocation={handleDeleteLocation}
              onSelectLocation={handleSelectLocation}
              deliveries={deliveries}
              onViewInvoice={handleOpenInvoiceModal}
              initialOpenAddressesModal={openProfileAddresses}
              onOpenLoginModal={handleOpenAuthModal}
              favoriteCount={favoriteIds.length}
              viewMode={globalViewMode}
              onViewModeChange={setGlobalViewMode}
              onExploreCatalog={() => {
                setSelectedCategoryId('all');
                setCurrentScreen('category');
              }}
              onReorderMaterial={(matName) => {
                const matchedItem = MATERIAL_ITEMS.find((m) =>
                  m.name.toLowerCase().includes(matName.toLowerCase()) || matName.toLowerCase().includes(m.name.toLowerCase())
                );
                if (matchedItem) {
                  handleOpenItemModal(matchedItem);
                } else {
                  setSelectedCategoryId('all');
                  setCurrentScreen('category');
                }
              }}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen
              onBack={() => setCurrentScreen('profile')}
              onClearRecentSearches={handleClearRecentSearches}
              viewMode={globalViewMode}
              onViewModeChange={setGlobalViewMode}
            />
          )}

          {currentScreen === 'activity' && (
            <ActivityDashboardScreen
              deliveries={deliveries}
              onBack={() => setCurrentScreen('profile')}
              onExploreCatalog={() => {
                setSelectedCategoryId('all');
                setCurrentScreen('category');
              }}
              onViewInvoice={handleOpenInvoiceModal}
              onReorderMaterial={(matName) => {
                const matchedItem = MATERIAL_ITEMS.find((m) =>
                  m.name.toLowerCase().includes(matName.toLowerCase()) || matName.toLowerCase().includes(m.name.toLowerCase())
                );
                if (matchedItem) {
                  handleOpenItemModal(matchedItem);
                } else {
                  setSelectedCategoryId('all');
                  setCurrentScreen('category');
                }
              }}
            />
          )}

          {(currentScreen === 'auth_mobile' || currentScreen === 'auth_otp') && (
            <AuthScreen
              initialStep={currentScreen === 'auth_otp' ? 'otp' : 'mobile'}
              onSuccessAuth={handleAuthSuccess}
              onBack={() => {
                setCurrentScreen('home');
              }}
            />
          )}
        </Suspense>
      </View>

      {/* Nike Auth Modal (Login/Signup Bottom Sheet matching n1.jpeg, n2.jpeg) */}
      {isAuthModalOpen && (
        <NikeAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccessAuth={(phone) => {
            handleAuthSuccess(phone);
            setIsAuthModalOpen(false);
          }}
        />
      )}

      {/* Item Quantity Modal (Slide-up Bottom Sheet) */}
      {selectedItemForModal && (
        <ItemQuantityModal
          item={selectedItemForModal}
          onClose={() => setSelectedItemForModal(null)}
          onAddToCart={handleAddToCartFromModal}
          onBuyNow={handleBuyNowFromModal}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Official GST Tax Invoice Modal */}
      {selectedInvoiceDelivery && (
        <InvoiceModal
          isOpen={!!selectedInvoiceDelivery}
          onClose={() => setSelectedInvoiceDelivery(null)}
          delivery={selectedInvoiceDelivery}
          user={user}
          isLoggedIn={isLoggedIn}
          onOpenLoginModal={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Delivery Site Location Picker Sheet */}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
        />
      )}

      {/* Post-Login Preferred Language Selection Modal Prompt */}
      {isLanguageModalOpen && (
        <LanguagePromptModal
          isOpen={isLanguageModalOpen}
          onClose={() => setIsLanguageModalOpen(false)}
        />
      )}

      {/* Fixed Bottom Navigation Bar (5 tabs: Home, Shop, Favorites, Bag, Profile) */}
      {currentScreen !== 'auth_mobile' && currentScreen !== 'auth_otp' && (
        <BottomNav
          activeScreen={currentScreen}
          onSelectTab={(scr) => setCurrentScreen(scr)}
          cartCount={totalCartCount}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <LocationProvider>
            <ToastProvider>
              <MainAppContent />
            </ToastProvider>
          </LocationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    minHeight: 720,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
});
