import React from 'react';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ScreenSuspense } from '../common/ScreenSuspense';
import type { ProjectBundle } from '../HomeScreen';
import {
  ScreenType,
  CategoryId,
  MaterialItem,
  CartItem,
  UserProfile,
  ActivityDelivery,
  MaterialCategory,
} from '../../types';
import { ServiceItem, MATERIAL_ITEMS } from '../../data/materialsData';

// Dynamic route loaders for screen-level code splitting
const loadHome = () => import('../HomeScreen').then((m) => ({ default: m.HomeScreen }));
const loadBasket = () => import('../BasketScreen').then((m) => ({ default: m.BasketScreen }));
const loadFavorites = () => import('../FavoritesScreen').then((m) => ({ default: m.FavoritesScreen }));
const loadShop = () => import('../ShopScreen').then((m) => ({ default: m.ShopScreen }));
const loadMaterialsCatalog = () => import('../MaterialsCatalogScreen').then((m) => ({ default: m.MaterialsCatalogScreen }));
const loadServicesCatalog = () => import('../ServicesCatalogScreen').then((m) => ({ default: m.ServicesCatalogScreen }));
const loadTradeServicesDetail = () => import('../TradeServicesDetailScreen').then((m) => ({ default: m.TradeServicesDetailScreen }));
const loadProfile = () => import('../UserProfileScreen').then((m) => ({ default: m.UserProfileScreen }));
const loadActivity = () => import('../ActivityDashboardScreen').then((m) => ({ default: m.ActivityDashboardScreen }));
const loadLiveTracking = () => import('../LiveTrackingScreen').then((m) => ({ default: m.LiveTrackingScreen }));
const loadInvoice = () => import('../InvoiceScreen').then((m) => ({ default: m.InvoiceScreen }));
const loadAuth = () => import('../AuthScreen').then((m) => ({ default: m.AuthScreen }));

// Lazy route components
export const HomeScreen = React.lazy(loadHome);
export const BasketScreen = React.lazy(loadBasket);
export const FavoritesScreen = React.lazy(loadFavorites);
export const ShopScreen = React.lazy(loadShop);
export const MaterialsCatalogScreen = React.lazy(loadMaterialsCatalog);
export const ServicesCatalogScreen = React.lazy(loadServicesCatalog);
export const TradeServicesDetailScreen = React.lazy(loadTradeServicesDetail);
export const UserProfileScreen = React.lazy(loadProfile);
export const ActivityDashboardScreen = React.lazy(loadActivity);
export const LiveTrackingScreen = React.lazy(loadLiveTracking);
export const InvoiceScreen = React.lazy(loadInvoice);
export const AuthScreen = React.lazy(loadAuth);

export const SCREEN_PRELOADERS = {
  home: loadHome,
  basket: loadBasket,
  favorites: loadFavorites,
  shop: loadShop,
  category: loadShop,
  materialsCatalog: loadMaterialsCatalog,
  servicesCatalog: loadServicesCatalog,
  tradeServices: loadTradeServicesDetail,
  profile: loadProfile,
  activity: loadActivity,
  tracking: loadLiveTracking,
  invoice: loadInvoice,
  auth: loadAuth,
};

export interface ScreenRouterProps {
  currentScreen: ScreenType;
  selectedCategoryId: CategoryId | 'all';
  onSelectCategory: (catId: CategoryId | 'all' | 'services' | 'services-catalog') => void;
  onSelectItemModal: (item: MaterialItem) => void;
  favoriteIds: string[];
  onToggleFavorite: (itemId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onNavigateScreen: (scr: ScreenType) => void;
  materials: MaterialItem[];
  categories: MaterialCategory[];
  services: ServiceItem[];
  bundles: ProjectBundle[];
  deliveries: ActivityDelivery[];
  onOrderCreated: (order: ActivityDelivery) => void;
  onViewInvoice: (del: ActivityDelivery) => void;
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile>) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  savedLocations: string[];
  onAddLocation: (loc: string) => void;
  onEditLocation: (oldLoc: string, newLoc: string) => void;
  onDeleteLocation: (loc: string) => void;
  onSelectLocation: (loc: string) => void;
  selectedLocation: string;
  cartItems: CartItem[];
  onUpdateCartQty: (cartId: string, quantity: number) => void;
  onRemoveCartItem: (cartId: string) => void;
  onClearCart: () => void;
  onAddToCartItem: (item: CartItem) => void;
  openProfileAddresses: boolean;
  setOpenProfileAddresses: (open: boolean) => void;
  onAddBundleToCartAndNavigate: (bundle: ProjectBundle) => void;
  onAuthSuccess: (phone: string) => void;
  headerComponent: React.ReactNode;
}

export const ScreenRouter: React.FC<ScreenRouterProps> = ({
  currentScreen,
  selectedCategoryId,
  onSelectCategory,
  onSelectItemModal,
  favoriteIds,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onNavigateScreen,
  materials,
  categories,
  services,
  bundles,
  deliveries,
  onOrderCreated,
  onViewInvoice,
  user,
  onUpdateUser,
  isLoggedIn,
  onLogout,
  onOpenAuthModal,
  savedLocations,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onSelectLocation,
  selectedLocation,
  cartItems,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onAddToCartItem,
  openProfileAddresses,
  setOpenProfileAddresses,
  onAddBundleToCartAndNavigate,
  onAuthSuccess,
  headerComponent,
}) => {
  return (
    <ErrorBoundary>
      {(currentScreen === 'shop' || currentScreen === 'category') && (
        <ScreenSuspense type="catalog">
          <ShopScreen
            selectedCategoryId={selectedCategoryId}
            onSelectCategoryTab={onSelectCategory}
            onSelectItem={onSelectItemModal}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onBack={() => onNavigateScreen('home')}
            materials={materials}
            categories={categories}
            services={services}
          />
        </ScreenSuspense>
      )}

      {currentScreen === 'home' && (
        <ScreenSuspense type="home">
          <HomeScreen
            headerComponent={headerComponent}
            onSelectCategory={onSelectCategory}
            onNavigateAllMaterials={() => {
              onSelectCategory('materials');
              onNavigateScreen('shop');
            }}
            onNavigateAllServices={() => {
              onSelectCategory('services-catalog');
              onNavigateScreen('shop');
            }}
            onSelectItem={onSelectItemModal}
            searchQuery={searchQuery}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            onAddBundleToCartAndNavigate={onAddBundleToCartAndNavigate}
            materials={materials}
            categories={categories}
            services={services}
            bundles={bundles}
          />
        </ScreenSuspense>
      )}

      {currentScreen === 'basket' && (
        <ScreenSuspense type="basket">
          <BasketScreen
            user={user}
            cartItems={cartItems}
            onUpdateQuantity={onUpdateCartQty}
            onRemoveItem={onRemoveCartItem}
            onClearCart={onClearCart}
            onAddToCart={onAddToCartItem}
            selectedLocation={selectedLocation}
            onNavigateScreen={onNavigateScreen}
            deliveries={deliveries}
            onOrderCreated={onOrderCreated}
            onViewInvoice={onViewInvoice}
            onChangeAddressRedirect={() => {
              setOpenProfileAddresses(true);
              onNavigateScreen('profile');
            }}
            isLoggedIn={isLoggedIn}
            onOpenLoginModal={onOpenAuthModal}
          />
        </ScreenSuspense>
      )}

      {currentScreen === 'favorites' && (
        <ScreenSuspense type="catalog">
          <FavoritesScreen
            items={materials}
            onSelectItemModal={onSelectItemModal}
            onNavigateHome={() => onNavigateScreen('home')}
            onExploreCatalog={() => {
              onSelectCategory('all');
              onNavigateScreen('shop');
            }}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            isLoggedIn={isLoggedIn}
            onOpenLoginModal={onOpenAuthModal}
          />
        </ScreenSuspense>
      )}

      {currentScreen === 'profile' && (
        <ScreenSuspense type="profile">
          <UserProfileScreen
            user={user}
            onUpdateUser={onUpdateUser}
            onNavigateScreen={(scr) => {
              setOpenProfileAddresses(false);
              onNavigateScreen(scr);
            }}
            isLoggedIn={isLoggedIn}
            onLogout={onLogout}
            savedLocations={savedLocations}
            onAddLocation={onAddLocation}
            onEditLocation={onEditLocation}
            onDeleteLocation={onDeleteLocation}
            onSelectLocation={onSelectLocation}
            deliveries={deliveries}
            onViewInvoice={onViewInvoice}
            initialOpenAddressesModal={openProfileAddresses}
            onOpenLoginModal={onOpenAuthModal}
            favoriteCount={favoriteIds.length}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onExploreCatalog={() => {
              onSelectCategory('all');
              onNavigateScreen('shop');
            }}
            onReorderMaterial={(matName) => {
              const matchedItem =
                materials.find(
                  (m) =>
                    m.name.toLowerCase().includes(matName.toLowerCase()) ||
                    matName.toLowerCase().includes(m.name.toLowerCase())
                ) ||
                MATERIAL_ITEMS.find(
                  (m) =>
                    m.name.toLowerCase().includes(matName.toLowerCase()) ||
                    matName.toLowerCase().includes(m.name.toLowerCase())
                );
              if (matchedItem) {
                onSelectItemModal(matchedItem);
              } else {
                onSelectCategory('all');
                onNavigateScreen('shop');
              }
            }}
          />
        </ScreenSuspense>
      )}

      {currentScreen === 'activity' && (
        <ScreenSuspense type="tracking">
          <ActivityDashboardScreen
            deliveries={deliveries}
            isLoggedIn={isLoggedIn}
            onOpenLoginModal={onOpenAuthModal}
            onBack={() => onNavigateScreen('profile')}
            onExploreCatalog={() => {
              onSelectCategory('all');
              onNavigateScreen('shop');
            }}
            onViewInvoice={onViewInvoice}
            onReorderMaterial={(matName) => {
              const matchedItem =
                materials.find(
                  (m) =>
                    m.name.toLowerCase().includes(matName.toLowerCase()) ||
                    matName.toLowerCase().includes(m.name.toLowerCase())
                ) ||
                MATERIAL_ITEMS.find(
                  (m) =>
                    m.name.toLowerCase().includes(matName.toLowerCase()) ||
                    matName.toLowerCase().includes(m.name.toLowerCase())
                );
              if (matchedItem) {
                onSelectItemModal(matchedItem);
              } else {
                onSelectCategory('all');
                onNavigateScreen('shop');
              }
            }}
          />
        </ScreenSuspense>
      )}

      {(currentScreen === 'auth_mobile' || currentScreen === 'auth_otp') && (
        <ScreenSuspense type="profile">
          <AuthScreen
            initialStep={currentScreen === 'auth_otp' ? 'otp' : 'mobile'}
            onSuccessAuth={onAuthSuccess}
            onBack={() => {
              onNavigateScreen('home');
            }}
          />
        </ScreenSuspense>
      )}
    </ErrorBoundary>
  );
};
