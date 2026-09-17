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
  const { theme, isAppleDesign } = useTheme();
  const insets = useSafeAreaInsets();

  const isHomeActive = activeScreen === 'home';
  const isShopActive = activeScreen === 'shop' || activeScreen === 'category';
  const isFavoritesActive = activeScreen === 'favorites';
  const isCartActive = activeScreen === 'basket';
  const isProfileActive =
    activeScreen === 'profile' ||
    activeScreen === 'activity';

  const activeColor = isAppleDesign ? '#007AFF' : theme.textPrimary;
  const inactiveColor = isAppleDesign ? '#86868B' : (theme.textMuted || '#707072');
  const navBgColor = theme.surface;
  const navBorderColor = isAppleDesign ? '#E5E5EA' : theme.borderLight;

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
    <View style={[styles.navWrapper, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.navContainer,
          {
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            paddingBottom: 6,
          },
        ]}
      >
        <View style={styles.navContent}>
          {/* 1. Home Tab */}
          <TouchableOpacity
            onPress={() => handleTabPress('home')}
            activeOpacity={0.7}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel="Home Tab"
          >
            <View style={[styles.iconWrapper, isHomeActive && styles.activeIconPill]}>
              <Home
                size={22}
                color={isHomeActive ? '#111111' : '#6B7280'}
                strokeWidth={isHomeActive ? 2.5 : 1.8}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isHomeActive ? '#111111' : '#6B7280',
                  fontWeight: isHomeActive ? '800' : '600',
                },
              ]}
            >
              Home
            </Text>
            {isHomeActive && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* 2. Shop Tab */}
          <TouchableOpacity
            onPress={() => handleTabPress('shop')}
            activeOpacity={0.7}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel="Shop Tab"
          >
            <View style={[styles.iconWrapper, isShopActive && styles.activeIconPill]}>
              <Search
                size={22}
                color={isShopActive ? '#111111' : '#6B7280'}
                strokeWidth={isShopActive ? 2.5 : 1.8}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isShopActive ? '#111111' : '#6B7280',
                  fontWeight: isShopActive ? '800' : '600',
                },
              ]}
            >
              Shop
            </Text>
            {isShopActive && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* 3. Favourites Tab */}
          <TouchableOpacity
            onPress={() => handleTabPress('favorites')}
            activeOpacity={0.7}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel="Favourites Tab"
          >
            <View style={[styles.iconWrapper, isFavoritesActive && styles.activeIconPill]}>
              <Heart
                size={22}
                color={isFavoritesActive ? '#111111' : '#6B7280'}
                strokeWidth={isFavoritesActive ? 2.5 : 1.8}
                fill={isFavoritesActive ? '#111111' : 'transparent'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFavoritesActive ? '#111111' : '#6B7280',
                  fontWeight: isFavoritesActive ? '800' : '600',
                },
              ]}
            >
              Favourites
            </Text>
            {isFavoritesActive && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* 4. Cart Tab */}
          <TouchableOpacity
            onPress={() => handleTabPress('basket')}
            activeOpacity={0.7}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel="Cart Tab"
          >
            <View style={styles.iconBadgeWrapper}>
              <View style={[styles.iconWrapper, isCartActive && styles.activeIconPill]}>
                <ShoppingCart
                  size={22}
                  color={isCartActive ? '#111111' : '#6B7280'}
                  strokeWidth={isCartActive ? 2.5 : 1.8}
                />
              </View>
              {cartCount > 0 && (
                <AnimatedView
                  style={[
                    styles.badge,
                    {
                      backgroundColor: '#111111',
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
                  color: isCartActive ? '#111111' : '#6B7280',
                  fontWeight: isCartActive ? '800' : '600',
                },
              ]}
            >
              Cart
            </Text>
            {isCartActive && <View style={styles.activeDot} />}
          </TouchableOpacity>

          {/* 5. Profile Tab */}
          <TouchableOpacity
            onPress={() => handleTabPress('profile')}
            activeOpacity={0.7}
            style={styles.tabButton}
            accessibilityRole="button"
            accessibilityLabel="Profile Tab"
          >
            <View style={[styles.iconWrapper, isProfileActive && styles.activeIconPill]}>
              <User
                size={22}
                color={isProfileActive ? '#111111' : '#6B7280'}
                strokeWidth={isProfileActive ? 2.5 : 1.8}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isProfileActive ? '#111111' : '#6B7280',
                  fontWeight: isProfileActive ? '800' : '600',
                },
              ]}
            >
              Profile
            </Text>
            {isProfileActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  navContainer: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
    position: 'relative',
  },
  iconWrapper: {
    width: 38,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconPill: {
    backgroundColor: '#F3F4F6',
    transform: [{ scale: 1.04 }],
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111111',
    marginTop: 1,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  iconBadgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});

