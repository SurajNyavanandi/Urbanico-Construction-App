import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LocationProvider, useLocation } from './context/LocationContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { CategoryDetailScreen } from './components/CategoryDetailScreen';
import { ItemQuantityModal } from './components/ItemQuantityModal';
import { UserProfileScreen } from './components/UserProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ActivityDashboardScreen } from './components/ActivityDashboardScreen';
import { AuthScreen } from './components/AuthScreen';
import { BasketScreen } from './components/BasketScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { ShopScreen } from './components/ShopScreen';
import { NikeAuthModal } from './components/NikeAuthModal';
import { LocationModal } from './components/LocationModal';
import { InvoiceModal } from './components/InvoiceModal';
import { LanguagePromptModal } from './components/LanguagePromptModal';
import { preloadImages } from './utils/imageOptimization';
import { BRAND_LOGO_URL } from './constants';

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
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('urbanico_auth_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          const phone = parsed.phone || '9666635009';
          const savedProfile = window.localStorage.getItem(`urbanico_user_profile_${phone}`);
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
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('urbanico_auth_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          return !!parsed.isLoggedIn;
        }
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
      if (typeof window !== 'undefined' && window.localStorage) {
        const authSaved = window.localStorage.getItem('urbanico_auth_session');
        const phone = authSaved ? JSON.parse(authSaved).phone : null;
        const key = phone ? `urbanico_cart_${phone}` : 'urbanico_cart_guest';
        const savedCart = window.localStorage.getItem(key);
        if (savedCart) return JSON.parse(savedCart);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Sync cart to storage whenever changed
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = isLoggedIn && user.phone ? `urbanico_cart_${user.phone}` : 'urbanico_cart_guest';
        window.localStorage.setItem(key, JSON.stringify(cartItems));
      }
    } catch {
      // ignore
    }
  }, [cartItems, isLoggedIn, user.phone]);

  // Deliveries data (persisted for live production app)
  const [deliveries, setDeliveries] = useState<ActivityDelivery[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('urbanico_orders');
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_DELIVERIES;
  });

  const handleOrderCreated = (newOrder: ActivityDelivery) => {
    setDeliveries((prev) => {
      const updated = [newOrder, ...prev];
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('urbanico_orders', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Favorites State (persisted per user or guest session)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const authSaved = window.localStorage.getItem('urbanico_auth_session');
        const isAuth = authSaved ? JSON.parse(authSaved).isLoggedIn : false;
        const phone = authSaved ? JSON.parse(authSaved).phone : null;
        const key = isAuth && phone ? `urbanico_favorite_ids_${phone}` : 'urbanico_favorite_ids_guest';
        const favSaved = window.localStorage.getItem(key) || window.localStorage.getItem('urbanico_favorite_ids');
        if (favSaved) return JSON.parse(favSaved);
        if (isAuth) return ['plastering-sand', 'stone-20mm'];
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Sync favorites with localStorage whenever changed
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = isLoggedIn && user.phone ? `urbanico_favorite_ids_${user.phone}` : 'urbanico_favorite_ids_guest';
        window.localStorage.setItem(key, JSON.stringify(favoriteIds));
      }
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

  // Profile Update Handler with persistence
  const handleUpdateUser = (updatedData: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      try {
        if (typeof window !== 'undefined' && window.localStorage && updated.phone) {
          window.localStorage.setItem(`urbanico_user_profile_${updated.phone}`, JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return updated;
    });
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
    setSelectedItemForModal(item);
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
    const validPhone = phoneNum || '9666635009';

    // 1. Restore or initialize user profile
    let loadedProfile = { ...INITIAL_USER, phone: validPhone, isVerified: true };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedProf = window.localStorage.getItem(`urbanico_user_profile_${validPhone}`);
        if (savedProf) {
          loadedProfile = { ...loadedProfile, ...JSON.parse(savedProf) };
        }
      }
    } catch {
      // ignore
    }
    setUser(loadedProfile);

    // 2. Load user addresses
    loadUserLocations(validPhone);

    // 3. Merge guest cart with existing user cart
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          'urbanico_auth_session',
          JSON.stringify({ isLoggedIn: true, phone: validPhone })
        );

        // Merge cart items
        const userSavedCartRaw = window.localStorage.getItem(`urbanico_cart_${validPhone}`);
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
        window.localStorage.setItem(`urbanico_cart_${validPhone}`, JSON.stringify(mergedCart));

        // Merge favorites
        const userSavedFavsRaw = window.localStorage.getItem(`urbanico_favorite_ids_${validPhone}`);
        const userSavedFavs: string[] = userSavedFavsRaw
          ? JSON.parse(userSavedFavsRaw)
          : ['plastering-sand', 'stone-20mm'];
        const mergedFavs = Array.from(new Set([...userSavedFavs, ...favoriteIds]));
        setFavoriteIds(mergedFavs);
        window.localStorage.setItem(`urbanico_favorite_ids_${validPhone}`, JSON.stringify(mergedFavs));
      }
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
    setUser((prev) => ({ ...prev, isVerified: false }));
    setCartItems([]);
    setFavoriteIds([]);
    resetLocationsToDefault();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('urbanico_auth_session');
        window.localStorage.removeItem('urbanico_cart_guest');
        window.localStorage.removeItem('urbanico_favorite_ids_guest');
      }
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
      {/* Top Header (Visible exclusively on Home screen) */}
      {currentScreen === 'home' && (
        <Header
          currentScreen={currentScreen}
          title={getScreenTitle()}
          selectedLocation={selectedLocation}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
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
      )}

      {/* Main View Router */}
      <View style={[styles.mainContent, { backgroundColor: '#FFFFFF' }]}>
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
            onViewInvoice={(del) => setSelectedInvoiceDelivery(del)}
            onChangeAddressRedirect={() => {
              setOpenProfileAddresses(true);
              setCurrentScreen('profile');
            }}
            isLoggedIn={isLoggedIn}
            onOpenLoginModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentScreen === 'favorites' && (
          <FavoritesScreen
            onSelectItemModal={handleOpenItemModal}
            onNavigateHome={() => setCurrentScreen('home')}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            isLoggedIn={isLoggedIn}
            onOpenLoginModal={() => setIsAuthModalOpen(true)}
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
            onViewInvoice={(del) => setSelectedInvoiceDelivery(del)}
            initialOpenAddressesModal={openProfileAddresses}
            onOpenLoginModal={() => setIsAuthModalOpen(true)}
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
      </View>

      {/* Nike Auth Modal (Login/Signup Bottom Sheet matching n1.jpeg, n2.jpeg) */}
      <NikeAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessAuth={(phone) => {
          handleAuthSuccess(phone);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Item Quantity Modal (Slide-up Bottom Sheet) */}
      <ItemQuantityModal
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        onAddToCart={handleAddToCartFromModal}
        onBuyNow={handleBuyNowFromModal}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Official GST Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceDelivery}
        onClose={() => setSelectedInvoiceDelivery(null)}
        delivery={selectedInvoiceDelivery}
        user={user}
        isLoggedIn={isLoggedIn}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
      />

      {/* Delivery Site Location Picker Sheet */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Post-Login Preferred Language Selection Modal Prompt */}
      <LanguagePromptModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

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
});
