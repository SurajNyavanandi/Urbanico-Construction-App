import React from 'react';
import { StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';

// Navigation, Canvas & Modals
import { BottomNav } from './components/BottomNav';
import { AppScreenCanvas } from './components/navigation/AppScreenCanvas';
import { AppModalsContainer } from './components/modals/AppModalsContainer';
import { ScreenSkeletonLoader } from './components/common/ScreenSkeletonLoader';

// Master App Hook
import { useUrbanicoApp } from './hooks/useUrbanicoApp';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated. Use "boxShadow".',
  '"shadow*" style props are deprecated',
]);

function MainAppContent() {
  const app = useUrbanicoApp();

  if (app.isCatalogLoading) {
    return (
      <SafeAreaView style={[styles.appContainer, { backgroundColor: app.theme.background }]} edges={['top']}>
        <ExpoStatusBar style={app.theme.statusBarStyle} />
        <ScreenSkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: app.theme.background }]} edges={['top']}>
      <ExpoStatusBar style={app.theme.statusBarStyle} />

      {/* Primary Screen Canvas */}
      <AppScreenCanvas app={app} />

      {/* Global Application Modals */}
      <AppModalsContainer
        isAuthModalOpen={app.isAuthModalOpen}
        onCloseAuthModal={() => app.setIsAuthModalOpen(false)}
        onAuthSuccess={(phone) => {
          app.handleAuthSuccess(phone);
          app.setIsAuthModalOpen(false);
        }}
        selectedItemForModal={app.selectedItemForModal}
        onCloseItemModal={() => app.setSelectedItemForModal(null)}
        onAddToCartFromModal={app.handleAddToCartFromModal}
        onBuyNowFromModal={app.handleBuyNowFromModal}
        favoriteIds={app.favoriteIds}
        onToggleFavorite={app.toggleFavorite}
        selectedInvoiceDelivery={app.selectedInvoiceDelivery}
        onCloseInvoiceModal={() => app.setSelectedInvoiceDelivery(null)}
        user={app.user}
        isLoggedIn={app.isLoggedIn}
        onOpenLoginModal={app.handleOpenAuthModal}
        isLocationModalOpen={app.isLocationModalOpen}
        onCloseLocationModal={() => app.setIsLocationModalOpen(false)}
      />

      {/* Fixed Bottom Navigation Bar */}
      {app.currentScreen !== 'auth_mobile' && app.currentScreen !== 'auth_otp' && (
        <BottomNav
          activeScreen={app.currentScreen}
          onSelectTab={(scr) => {
            if (scr === 'shop') app.selectCategory('all');
            app.navigateScreen(scr);
          }}
          onPreloadTab={app.preloadScreen}
          cartCount={app.totalCartCount}
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
            <CartProvider>
              <ToastProvider>
                <MainAppContent />
              </ToastProvider>
            </CartProvider>
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
});
