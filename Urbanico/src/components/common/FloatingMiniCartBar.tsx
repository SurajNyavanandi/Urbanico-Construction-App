import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { ShoppingCart, ArrowRight, Zap } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { soundService } from '../../utils/soundHelper';

interface FloatingMiniCartBarProps {
  onNavigateCart: () => void;
}

export const FloatingMiniCartBar: React.FC<FloatingMiniCartBarProps> = ({
  onNavigateCart,
}) => {
  const { totals, cartItems } = useCart();
  const { theme } = useTheme();

  const totalQuantity = totals.totalQuantity;
  const grandTotal = totals.grandTotal || totals.subtotal;
  const isVisible = totalQuantity > 0;

  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : 50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(totalQuantity);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : 50,
      friction: 8,
      tension: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isVisible, slideAnim]);

  // Gentle pop animation when quantity increases
  useEffect(() => {
    if (totalQuantity > prevCountRef.current) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.04,
          friction: 4,
          tension: 160,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
    prevCountRef.current = totalQuantity;
  }, [totalQuantity, scaleAnim]);

  if (!isVisible) return null;

  const handlePress = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
      try {
        (navigator as any).vibrate(15);
      } catch {}
    }
    soundService.playTap();
    onNavigateCart();
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <View style={styles.dockWrapper}>
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.9}
        style={[
          styles.miniCartContainer,
          {
            backgroundColor: theme.mode === 'dark' ? '#27272A' : '#18181B',
            borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View Cart with ${totalQuantity} items totalling rupees ${grandTotal}`}
      >
        {/* Left: Cart Icon & Item/Price Summary */}
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <ShoppingCart size={18} color="#18181B" strokeWidth={2.4} />
          </View>
          <View style={styles.textDetails}>
            <View style={styles.primaryRow}>
              <Text style={styles.itemsCountText}>
                {totalQuantity} {totalQuantity === 1 ? 'ITEM' : 'ITEMS'}
              </Text>
              <Text style={styles.dividerDot}>•</Text>
              <Text style={styles.priceText}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.secondaryRow}>
              <Zap size={11} color="#FCB026" strokeWidth={2.4} />
              <Text style={styles.directYardText}>
                {totals.couponDiscount > 0
                  ? `₹${totals.couponDiscount} coupon savings applied`
                  : 'Direct yard pricing & fast dispatch'}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: View Cart Action Pill */}
        <View style={styles.rightAction}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <ArrowRight size={15} color="#FCB026" strokeWidth={2.6} />
        </View>
      </AnimatedTouchable>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 2,
    zIndex: 90,
  },
  miniCartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FCB026',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDetails: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsCountText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerDot: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directYardText: {
    color: '#D1D5DB',
    fontSize: 10.5,
    fontWeight: '500',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 8,
  },
  viewCartText: {
    color: '#FCB026',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default FloatingMiniCartBar;
