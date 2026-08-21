import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react-native';
import { ScreenType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  activeScreen: ScreenType;
  onSelectTab: (screen: ScreenType) => void;
  cartCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onSelectTab,
  cartCount,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const isHomeActive = activeScreen === 'home';
  const isShopActive = activeScreen === 'shop' || activeScreen === 'category';
  const isFavoritesActive = activeScreen === 'favorites';
  const isCartActive = activeScreen === 'basket';
  const isProfileActive =
    activeScreen === 'profile' ||
    activeScreen === 'settings' ||
    activeScreen === 'activity';

  const activeColor = theme.textPrimary;
  const inactiveColor = theme.textMuted || '#707072';
  const navBgColor = theme.surface;
  const navBorderColor = theme.borderLight;

  // Dynamic bottom padding taking device safe area into account
  const bottomPadding = Math.max(8, (insets.bottom || 0) + 4);

  return (
    <View
      style={[
        styles.navContainer,
        {
          backgroundColor: navBgColor,
          borderTopColor: navBorderColor,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.navContent}>
        {/* 1. Home Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('home')}
          activeOpacity={0.7}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Home Tab"
        >
          <Home
            size={22}
            color={isHomeActive ? activeColor : inactiveColor}
            strokeWidth={isHomeActive ? 2.4 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isHomeActive ? activeColor : inactiveColor,
                fontWeight: isHomeActive ? '700' : '500',
              },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Shop Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('shop')}
          activeOpacity={0.7}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Shop Tab"
        >
          <Search
            size={22}
            color={isShopActive ? activeColor : inactiveColor}
            strokeWidth={isShopActive ? 2.4 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isShopActive ? activeColor : inactiveColor,
                fontWeight: isShopActive ? '700' : '500',
              },
            ]}
          >
            Shop
          </Text>
        </TouchableOpacity>

        {/* 3. Favourites Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('favorites')}
          activeOpacity={0.7}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Favourites Tab"
        >
          <Heart
            size={22}
            color={isFavoritesActive ? activeColor : inactiveColor}
            strokeWidth={isFavoritesActive ? 2.4 : 1.8}
            fill={isFavoritesActive ? activeColor : 'transparent'}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isFavoritesActive ? activeColor : inactiveColor,
                fontWeight: isFavoritesActive ? '700' : '500',
              },
            ]}
          >
            Favourites
          </Text>
        </TouchableOpacity>

        {/* 4. Cart Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('basket')}
          activeOpacity={0.7}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Cart Tab"
        >
          <View style={styles.iconBadgeWrapper}>
            <ShoppingCart
              size={22}
              color={isCartActive ? activeColor : inactiveColor}
              strokeWidth={isCartActive ? 2.4 : 1.8}
            />
            {cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              {
                color: isCartActive ? activeColor : inactiveColor,
                fontWeight: isCartActive ? '700' : '500',
              },
            ]}
          >
            Cart
          </Text>
        </TouchableOpacity>

        {/* 5. Profile Tab */}
        <TouchableOpacity
          onPress={() => onSelectTab('profile')}
          activeOpacity={0.7}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Profile Tab"
        >
          <User
            size={22}
            color={isProfileActive ? activeColor : inactiveColor}
            strokeWidth={isProfileActive ? 2.4 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isProfileActive ? activeColor : inactiveColor,
                fontWeight: isProfileActive ? '700' : '500',
              },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.1,
  },
  iconBadgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
