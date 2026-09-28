import React from 'react';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { HomeScreen, ProjectBundle } from '../HomeScreen';
import { BasketScreen } from '../BasketScreen';
import { FavoritesScreen } from '../FavoritesScreen';
import { UserProfileScreen } from '../UserProfileScreen';
import { ActivityDashboardScreen } from '../ActivityDashboardScreen';
import { AuthScreen } from '../AuthScreen';
import { ShopScreen } from '../ShopScreen';
import { CategoryDetailScreen } from '../CategoryDetailScreen';
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

export const SCREEN_PRELOADERS = {
  basket: () => Promise.resolve(),
  favorites: () => Promise.resolve(),
  shop: () => Promise.resolve(),
  category: () => Promise.resolve(),
  profile: () => Promise.resolve(),
  activity: () => Promise.resolve(),
  auth: () => Promise.resolve(),
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
      )}

      {currentScreen === 'home' && (
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
      )}

      {currentScreen === 'basket' && (
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
      )}

      {currentScreen === 'favorites' && (
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
      )}

      {currentScreen === 'profile' && (
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
      )}

      {currentScreen === 'activity' && (
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
      )}

      {(currentScreen === 'auth_mobile' || currentScreen === 'auth_otp') && (
        <AuthScreen
          initialStep={currentScreen === 'auth_otp' ? 'otp' : 'mobile'}
          onSuccessAuth={onAuthSuccess}
          onBack={() => {
            onNavigateScreen('home');
          }}
        />
      )}
    </ErrorBoundary>
  );
};
