import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, ShoppingBag, Heart, User } from 'lucide-react-native';
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
  const { theme, typography } = useTheme();

  const isHomeActive = activeScreen === 'home' || activeScreen === 'category';
  const isBasketActive = activeScreen === 'basket';
  const isFavoritesActive = activeScreen === 'favorites';
  const isAccountActive =
    activeScreen === 'profile' ||
    activeScreen === 'settings' ||
    activeScreen === 'activity' ||
    activeScreen === 'auth_mobile' ||
    activeScreen === 'auth_otp';

  const activeColor = theme.primary;
  const inactiveColor = theme.textMuted;

  return (
    <View style={[styles.navContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      <View style={styles.navContent}>
        {/* Home */}
        <TouchableOpacity
          onPress={() => onSelectTab('home')}
          activeOpacity={0.7}
          style={styles.tabButton}
        >
          <Home
            size={22}
            color={isHomeActive ? activeColor : inactiveColor}
            fill={isHomeActive ? activeColor : 'none'}
            strokeWidth={isHomeActive ? 2 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                fontFamily: typography.fontFamily,
                color: isHomeActive ? activeColor : inactiveColor,
                fontWeight: isHomeActive ? '800' : '500',
              },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* Basket */}
        <TouchableOpacity
          onPress={() => onSelectTab('basket')}
          activeOpacity={0.7}
          style={styles.tabButton}
        >
          <View style={styles.iconBadgeWrapper}>
            <ShoppingBag
              size={22}
              color={isBasketActive ? activeColor : inactiveColor}
              strokeWidth={isBasketActive ? 2.2 : 1.8}
            />
            {cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              {
                fontFamily: typography.fontFamily,
                color: isBasketActive ? activeColor : inactiveColor,
                fontWeight: isBasketActive ? '800' : '500',
              },
            ]}
          >
            Basket
          </Text>
        </TouchableOpacity>

        {/* Favorites */}
        <TouchableOpacity
          onPress={() => onSelectTab('favorites')}
          activeOpacity={0.7}
          style={styles.tabButton}
        >
          <Heart
            size={22}
            color={isFavoritesActive ? activeColor : inactiveColor}
            fill={isFavoritesActive ? activeColor : 'none'}
            strokeWidth={isFavoritesActive ? 2 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                fontFamily: typography.fontFamily,
                color: isFavoritesActive ? activeColor : inactiveColor,
                fontWeight: isFavoritesActive ? '800' : '500',
              },
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>

        {/* Account / Profile */}
        <TouchableOpacity
          onPress={() => onSelectTab('profile')}
          activeOpacity={0.7}
          style={styles.tabButton}
        >
          <User
            size={22}
            color={isAccountActive ? activeColor : inactiveColor}
            fill={isAccountActive ? activeColor : 'none'}
            strokeWidth={isAccountActive ? 2 : 1.8}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                fontFamily: typography.fontFamily,
                color: isAccountActive ? activeColor : inactiveColor,
                fontWeight: isAccountActive ? '800' : '500',
              },
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
  },
  iconBadgeWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    borderRadius: 999,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
