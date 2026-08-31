import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react-native';
import { ScreenType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { soundService } from '../utils/soundHelper';

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

  // Animation for Cart Badge Pop
  const cartScaleAnim = useRef(new Animated.Value(1)).current;
  const prevCartCountRef = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      Animated.sequence([
        Animated.spring(cartScaleAnim, {
          toValue: 1.35,
          friction: 4,
          tension: 120,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(cartScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount, cartScaleAnim]);

  // Tab index calculation for smooth horizontal sliding pill indicator (Animation 9)
  const getActiveTabIndex = () => {
    if (isHomeActive) return 0;
    if (isShopActive) return 1;
    if (isFavoritesActive) return 2;
    if (isCartActive) return 3;
    if (isProfileActive) return 4;
    return 0;
  };

  const activeIndex = getActiveTabIndex();
  const indicatorAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [activeIndex, indicatorAnim]);

  // Dynamic bottom padding taking device safe area into account
  const bottomPadding = Math.max(8, (insets.bottom || 0) + 4);

  const AnimatedView = Animated.View as any;

  const handleTabPress = (tab: ScreenType) => {
    soundService.playTap();
    onSelectTab(tab);
  };

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
          onPress={() => handleTabPress('home')}
          activeOpacity={0.65}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Home Tab"
        >
          <View style={[styles.iconWrapper, isHomeActive && styles.activeIconPill]}>
            <Home
              size={21}
              color={isHomeActive ? activeColor : inactiveColor}
              strokeWidth={isHomeActive ? 2.4 : 1.8}
            />
          </View>
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
          {isHomeActive && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
        </TouchableOpacity>

        {/* 2. Shop Tab */}
        <TouchableOpacity
          onPress={() => handleTabPress('shop')}
          activeOpacity={0.65}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Shop Tab"
        >
          <View style={[styles.iconWrapper, isShopActive && styles.activeIconPill]}>
            <Search
              size={21}
              color={isShopActive ? activeColor : inactiveColor}
              strokeWidth={isShopActive ? 2.4 : 1.8}
            />
          </View>
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
          {isShopActive && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
        </TouchableOpacity>

        {/* 3. Favourites Tab */}
        <TouchableOpacity
          onPress={() => handleTabPress('favorites')}
          activeOpacity={0.65}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Favourites Tab"
        >
          <View style={[styles.iconWrapper, isFavoritesActive && styles.activeIconPill]}>
            <Heart
              size={21}
              color={isFavoritesActive ? activeColor : inactiveColor}
              strokeWidth={isFavoritesActive ? 2.4 : 1.8}
              fill={isFavoritesActive ? activeColor : 'transparent'}
            />
          </View>
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
          {isFavoritesActive && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
        </TouchableOpacity>

        {/* 4. Cart Tab */}
        <TouchableOpacity
          onPress={() => handleTabPress('basket')}
          activeOpacity={0.65}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Cart Tab"
        >
          <View style={styles.iconBadgeWrapper}>
            <View style={[styles.iconWrapper, isCartActive && styles.activeIconPill]}>
              <ShoppingCart
                size={21}
                color={isCartActive ? activeColor : inactiveColor}
                strokeWidth={isCartActive ? 2.4 : 1.8}
              />
            </View>
            {cartCount > 0 && (
              <AnimatedView
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.primary,
                    transform: [{ scale: cartScaleAnim }],
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </AnimatedView>
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
          {isCartActive && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
        </TouchableOpacity>

        {/* 5. Profile Tab */}
        <TouchableOpacity
          onPress={() => handleTabPress('profile')}
          activeOpacity={0.65}
          style={styles.tabButton}
          accessibilityRole="button"
          accessibilityLabel="Profile Tab"
        >
          <View style={[styles.iconWrapper, isProfileActive && styles.activeIconPill]}>
            <User
              size={21}
              color={isProfileActive ? activeColor : inactiveColor}
              strokeWidth={isProfileActive ? 2.4 : 1.8}
            />
          </View>
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
          {isProfileActive && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
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
    paddingVertical: 3,
    gap: 2,
    position: 'relative',
  },
  iconWrapper: {
    padding: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconPill: {
    transform: [{ scale: 1.05 }],
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
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

