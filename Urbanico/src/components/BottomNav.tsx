import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Heart, ShoppingCart } from 'lucide-react-native';
import { ScreenType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { soundService } from '../utils/soundHelper';

interface BottomNavProps {
  activeScreen: ScreenType;
  onSelectTab: (screen: ScreenType) => void;
  onPreloadTab?: (screen: ScreenType) => void;
  cartCount: number;
}

interface NavTabItemProps {
  screen: ScreenType;
  isActive: boolean;
  label: string;
  activeColor: string;
  inactiveColor: string;
  children: React.ReactNode;
  onPress: (screen: ScreenType) => void;
  onPreload?: (screen: ScreenType) => void;
}

const NavTabItem: React.FC<NavTabItemProps> = React.memo(({
  screen,
  isActive,
  label,
  activeColor,
  inactiveColor,
  children,
  onPress,
  onPreload,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    onPreload?.(screen);
    Animated.spring(scaleAnim, {
      toValue: 0.90,
      friction: 8,
      tension: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePress = () => {
    soundService.playTap();
    onPress(screen);
  };

  const AnimatedView = Animated.View as any;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityLabel={`${label} Tab`}
    >
      <AnimatedView style={{ alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
        <View style={[styles.iconWrapper, isActive && styles.activeIconPill]}>
          {children}
        </View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? activeColor : inactiveColor,
              fontWeight: isActive ? '800' : '600',
            },
          ]}
        >
          {label}
        </Text>
        {isActive && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
      </AnimatedView>
    </Pressable>
  );
});

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onSelectTab,
  onPreloadTab,
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

  const AnimatedView = Animated.View as any;

  return (
    <View style={[styles.navWrapper, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.navContainer,
          {
            backgroundColor: navBgColor,
            borderColor: navBorderColor,
            paddingBottom: 6,
          },
        ]}
      >
        <View style={styles.navContent}>
          {/* 1. Home Tab */}
          <NavTabItem
            screen="home"
            isActive={isHomeActive}
            label="Home"
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onPress={onSelectTab}
            onPreload={onPreloadTab}
          >
            <Home
              size={22}
              color={isHomeActive ? activeColor : inactiveColor}
              strokeWidth={isHomeActive ? 2.5 : 1.8}
            />
          </NavTabItem>

          {/* 2. Shop Tab */}
          <NavTabItem
            screen="shop"
            isActive={isShopActive}
            label="Shop"
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onPress={onSelectTab}
            onPreload={onPreloadTab}
          >
            <Search
              size={22}
              color={isShopActive ? activeColor : inactiveColor}
              strokeWidth={isShopActive ? 2.5 : 1.8}
            />
          </NavTabItem>

          {/* 3. Favourites Tab */}
          <NavTabItem
            screen="favorites"
            isActive={isFavoritesActive}
            label="Favourites"
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onPress={onSelectTab}
            onPreload={onPreloadTab}
          >
            <Heart
              size={22}
              color={isFavoritesActive ? activeColor : inactiveColor}
              strokeWidth={isFavoritesActive ? 2.5 : 1.8}
              fill={isFavoritesActive ? activeColor : 'transparent'}
            />
          </NavTabItem>

          {/* 4. Cart Tab */}
          <NavTabItem
            screen="basket"
            isActive={isCartActive}
            label="Cart"
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onPress={onSelectTab}
            onPreload={onPreloadTab}
          >
            <View style={styles.iconBadgeWrapper}>
              <ShoppingCart
                size={22}
                color={isCartActive ? activeColor : inactiveColor}
                strokeWidth={isCartActive ? 2.5 : 1.8}
              />
              {cartCount > 0 && (
                <AnimatedView
                  style={[
                    styles.badge,
                    {
                      backgroundColor: theme.buttonBg || activeColor,
                      transform: [{ scale: cartScaleAnim }],
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: theme.buttonText || '#18181B' }]}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </AnimatedView>
              )}
            </View>
          </NavTabItem>

          {/* 5. Profile Tab */}
          <NavTabItem
            screen="profile"
            isActive={isProfileActive}
            label="Profile"
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onPress={onSelectTab}
            onPreload={onPreloadTab}
          >
            <Image
              source={{ uri: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg' }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: isProfileActive ? 2 : 1,
                borderColor: isProfileActive ? activeColor : (theme.border || '#9CA3AF'),
              }}
              resizeMode="cover"
            />
          </NavTabItem>
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
    backgroundColor: '#FCB026',
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
