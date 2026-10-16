import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { ShoppingBag, ArrowRight } from 'lucide-react-native';
import { ScreenType } from '../../types';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { formatINR } from '../../utils/priceHelper';
import { soundService } from '../../utils/soundHelper';

interface FloatingMiniCartProps {
  currentScreen: ScreenType;
  onNavigateBasket: () => void;
}

export const FloatingMiniCart: React.FC<FloatingMiniCartProps> = ({
  currentScreen,
  onNavigateBasket,
}) => {
  const { cartItems, totals } = useCart();
  const { theme } = useTheme();

  const isVisible =
    cartItems.length > 0 &&
    currentScreen !== 'basket' &&
    currentScreen !== 'auth_mobile' &&
    currentScreen !== 'auth_otp';

  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : 80)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : 90,
      friction: 8,
      tension: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isVisible, slideAnim]);

  if (!isVisible && (slideAnim as any)._value >= 80) {
    return null;
  }

  const totalQty = totals.totalQuantity || cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const subtotal = totals.subtotal || cartItems.reduce((acc, it) => acc + (it.unitPrice * (it.quantity || 1)), 0);

  const handlePress = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
      try {
        (navigator as any).vibrate(15);
      } catch {}
    }
    soundService.playTap();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
    onNavigateBasket();
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.92}
        style={[
          styles.container,
          {
            backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#0F172A',
            borderColor: theme.mode === 'dark' ? '#334155' : '#1E293B',
            transform: [{ scale: scaleAnim }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View Basket with ${totalQty} items`}
      >
        {/* Left Side: Cart Icon & Item Summary */}
        <View style={styles.leftSection}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
            <ShoppingBag size={18} color={theme.buttonText || '#0F172A'} strokeWidth={2.5} />
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{totalQty}</Text>
            </View>
          </View>

          <View style={styles.textContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.itemsLabel}>
                {totalQty} {totalQty === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.subtotalText}>{formatINR(subtotal)}</Text>
            </View>
            <Text style={styles.hintText}>
              Direct Quarry & Mill Dispatch
            </Text>
          </View>
        </View>

        {/* Right Side: View Cart Pill CTA */}
        <View style={[styles.viewCartBtn, { backgroundColor: theme.primary }]}>
          <Text style={[styles.viewCartText, { color: theme.buttonText || '#0F172A' }]}>
            View Cart
          </Text>
          <ArrowRight size={15} color={theme.buttonText || '#0F172A'} strokeWidth={2.6} />
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 64, // Sits directly above bottom tab bar
    left: 12,
    right: 12,
    zIndex: 999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.28), 0 2px 6px rgba(15, 23, 42, 0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  textContainer: {
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  itemsLabel: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '600',
  },
  separator: {
    color: '#64748B',
    fontSize: 11,
  },
  subtotalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default FloatingMiniCart;
