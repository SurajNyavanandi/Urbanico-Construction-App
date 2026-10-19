import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Header } from '../Header';
import { ScreenRouter } from './ScreenRouter';
import { useUrbanicoApp } from '../../hooks/useUrbanicoApp';

export interface AppScreenCanvasProps {
  app: ReturnType<typeof useUrbanicoApp>;
}

/**
 * AppScreenCanvas connects the state returned by useUrbanicoApp
 * to the lazy ScreenRouter and persistent Header.
 */
export const AppScreenCanvas: React.FC<AppScreenCanvasProps> = ({ app }) => {
  return (
    <View style={[styles.mainContent, { backgroundColor: app.theme.background }]}>
      <ScreenRouter
        currentScreen={app.currentScreen}
        selectedCategoryId={app.selectedCategoryId}
        onSelectCategory={app.selectCategory}
        onSelectItemModal={app.handleOpenItemModal}
        favoriteIds={app.favoriteIds}
        onToggleFavorite={app.toggleFavorite}
        searchQuery={app.searchQuery}
        onSearchChange={app.setSearchQuery}
        viewMode={app.globalViewMode}
        onViewModeChange={app.setGlobalViewMode}
        onNavigateScreen={app.navigateScreen}
        materials={app.materials}
        categories={app.categories}
        services={app.services}
        bundles={app.bundles}
        deliveries={app.deliveries}
        onOrderCreated={app.addOrder}
        onViewInvoice={app.handleOpenInvoiceModal}
        user={app.user}
        onUpdateUser={app.updateUser}
        isLoggedIn={app.isLoggedIn}
        onLogout={app.handleFullLogout}
        onOpenAuthModal={app.handleOpenAuthModal}
        savedLocations={app.savedLocations}
        onAddLocation={(loc) => loc.trim() && app.addLocation(loc.trim())}
        onEditLocation={(oldL, newL) => newL.trim() && app.editLocation(oldL, newL.trim())}
        onDeleteLocation={app.deleteLocation}
        onSelectLocation={app.handleSelectLocationAndSyncUser}
        selectedLocation={app.selectedLocation}
        cartItems={app.cartItems}
        onUpdateCartQty={app.handleUpdateCartQty}
        onRemoveCartItem={app.handleRemoveCartItem}
        onClearCart={app.handleClearCart}
        onAddToCartItem={app.handleAddToCartItem}
        openProfileAddresses={app.openProfileAddresses}
        setOpenProfileAddresses={app.setOpenProfileAddresses}
        onAddBundleToCartAndNavigate={app.handleAddBundleToCartAndNavigate}
        onAuthSuccess={app.handleAuthSuccess}
        headerComponent={
          <Header
            currentScreen={app.currentScreen}
            title={app.getScreenTitle()}
            selectedLocation={app.selectedLocation}
            onOpenLocationModal={app.handleOpenLocationModal}
            onBack={undefined}
            searchQuery={app.searchQuery}
            onSearchChange={app.setSearchQuery}
            recentSearches={app.recentSearches}
            onSelectSearchQuery={app.selectSearchQuery}
            onClearRecentSearches={app.clearRecentSearches}
            onRemoveRecentSearch={app.removeRecentSearch}
            onSelectItemModal={app.handleOpenItemModal}
            onNavigateScreen={app.navigateScreen}
            materials={app.materials}
            categories={app.categories}
            services={app.services}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    width: '100%',
  },
});
