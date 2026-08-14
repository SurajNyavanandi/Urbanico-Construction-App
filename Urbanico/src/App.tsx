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
  const { showToast } = useToast();

  // Navigation & Screen State
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('auth_mobile');
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | 'all'>('sand');
  const [globalViewMode, setGlobalViewMode] = useState<'list' | 'grid'>('grid');
  const [openProfileAddresses, setOpenProfileAddresses] = useState(false);

  // Search & Location
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'UltraTech Cement 53',
    'Plastering Sand',
    'TMT 12mm Rebar',
    'Mason',
  ]);
  const [savedLocations, setSavedLocations] = useState<string[]>(SAVED_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState(SAVED_LOCATIONS[0]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const handleAddLocation = (newLoc: string) => {
    if (!newLoc.trim()) return;
    const trimmed = newLoc.trim();
    if (!savedLocations.includes(trimmed)) {
      setSavedLocations((prev) => [trimmed, ...prev]);
    }
    setSelectedLocation(trimmed);
    showToast(`Saved new delivery address: ${trimmed}`, 'success');
  };

  const handleEditLocation = (oldLoc: string, newLoc: string) => {
    if (!newLoc.trim()) return;
    const trimmed = newLoc.trim();
    setSavedLocations((prev) => prev.map((loc) => (loc === oldLoc ? trimmed : loc)));
    if (selectedLocation === oldLoc) {
      setSelectedLocation(trimmed);
    }
    showToast('Delivery address updated', 'success');
  };

  const handleDeleteLocation = (locToDelete: string) => {
    setSavedLocations((prev) => {
      const filtered = prev.filter((loc) => loc !== locToDelete);
      if (selectedLocation === locToDelete && filtered.length > 0) {
        setSelectedLocation(filtered[0]);
      }
      return filtered;
    });
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

  // User & Auth
  const [user, setUser] = useState<UserProfile>({
    ...INITIAL_USER,
    isVerified: false,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Modal Item Selection & Invoice Modal
  const [selectedItemForModal, setSelectedItemForModal] = useState<MaterialItem | null>(null);
  const [selectedInvoiceDelivery, setSelectedInvoiceDelivery] = useState<ActivityDelivery | null>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'cart-1',
      itemId: 'plastering-sand',
      itemName: 'Plastering Sand',
      categoryName: 'Sand',
      selectedOptionLabel: 'Tractor Full level (~3 Tons)',
      unitPrice: 2700,
      quantity: 2,
      image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_igslv1igslv1igsl_fjq7jv.jpg',
    },
    {
      id: 'cart-2',
      itemId: 'stone-20mm',
      itemName: 'Stone 20mm',
      categoryName: 'Stone',
      selectedOptionLabel: 'Truck (~10 Tons)',
      unitPrice: 15000,
      quantity: 1,
      image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477604/Gemini_Generated_Image_tib95itib95itib9_ompkp6.jpg',
    },
  ]);

  // Deliveries data
  const [deliveries] = useState(INITIAL_DELIVERIES);

  // Favorites State
  const [favoriteIds, setFavoriteIds] = useState<string[]>([
    'plastering-sand',
    'stone-20mm',
  ]);

  const handleToggleFavorite = (itemId: string) => {
    const isFavNow = !favoriteIds.includes(itemId);
    setFavoriteIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
    const item = MATERIAL_ITEMS.find((m) => m.id === itemId);
    const itemName = item ? item.name : 'Item';
    showToast(isFavNow ? `Saved ${itemName} to Favorites` : `Removed ${itemName} from Favorites`, 'info');
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

  // Profile Update Handler
  const handleUpdateUser = (updatedData: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
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
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      itemId: item.id,
      itemName: item.name,
      categoryName: item.categoryId,
      selectedOptionLabel: option.label,
      unitPrice: option.price,
      quantity: quantity,
      image: item.image,
    };

    setCartItems((prev) => [newItem, ...prev]);
    showToast(`Added ${quantity}x ${item.name} to Basket`, 'success');
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
    showToast(`Removed ${itemName} from Basket`, 'info');
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast('Basket cleared', 'info');
  };

  const handleAuthSuccess = (phoneNum: string) => {
    setIsLoggedIn(true);
    setUser((prev) => ({ ...prev, phone: phoneNum, isVerified: true }));
    setCurrentScreen('home');
    setIsLanguageModalOpen(true);
    showToast('Account verified! Welcome to Urbanico.', 'success');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('auth_mobile');
    showToast('Logged out of Urbanico account', 'info');
  };

  // Determine current screen title for header
  const getScreenTitle = (): string => {
    if (currentScreen === 'category') {
      if (selectedCategoryId === 'all') return 'Materials Catalog';
      if (selectedCategoryId === 'services-catalog' || selectedCategoryId === 'services') return 'Services Catalog';
      const cat = CATEGORIES.find((c) => c.id === selectedCategoryId);
      if (cat) return cat.name;
      const srv = SERVICES.find((s) => s.id === selectedCategoryId);
      if (srv) return `${srv.name} Service`;
      return 'Materials';
    }
    if (currentScreen === 'basket') return 'Basket';
    if (currentScreen === 'favorites') return 'Favorites';
    if (currentScreen === 'profile') return 'My Profile';
    if (currentScreen === 'settings') return 'Settings';
    if (currentScreen === 'activity') return 'Activity Dashboard';
    if (currentScreen === 'auth_mobile' || currentScreen === 'auth_otp') return 'Account Verification';
    return 'Home';
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: theme.background }]} edges={['top']}>
      <ExpoStatusBar style={theme.statusBarStyle} />
      {/* Top Header (Visible on most screens except full Auth screen) */}
      {currentScreen !== 'auth_mobile' && currentScreen !== 'auth_otp' && (
        <Header
          currentScreen={currentScreen}
          title={getScreenTitle()}
          selectedLocation={selectedLocation}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onBack={
            currentScreen !== 'home'
              ? () => setCurrentScreen('home')
              : undefined
          }
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
      <View style={[styles.mainContent, { backgroundColor: theme.background }]}>
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
            onViewInvoice={(del) => setSelectedInvoiceDelivery(del)}
            onChangeAddressRedirect={() => {
              setOpenProfileAddresses(true);
              setCurrentScreen('profile');
            }}
          />
        )}

        {currentScreen === 'favorites' && (
          <FavoritesScreen
            onSelectItemModal={handleOpenItemModal}
            onNavigateHome={() => setCurrentScreen('home')}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
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
              if (isLoggedIn) {
                setCurrentScreen('profile');
              } else {
                setCurrentScreen('auth_mobile');
              }
            }}
          />
        )}
      </View>

      {/* Item Quantity Modal (Slide-up Bottom Sheet) */}
      <ItemQuantityModal
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        onAddToCart={handleAddToCartFromModal}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Official GST Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceDelivery}
        onClose={() => setSelectedInvoiceDelivery(null)}
        delivery={selectedInvoiceDelivery}
        user={user}
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

      {/* Fixed Bottom Navigation Bar */}
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
    backgroundColor: '#0F172A',
  },
  mainContent: {
    flex: 1,
    minHeight: 720,
    width: '100%',
  },
});
