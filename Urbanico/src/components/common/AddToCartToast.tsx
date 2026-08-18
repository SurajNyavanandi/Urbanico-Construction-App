import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Check, ShoppingBag, ArrowRight, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ShimmerImage } from './ShimmerImage';

export interface CartToastPayload {
  name: string;
  optionLabel?: string;
  price?: number;
  image?: string;
  quantity?: number;
  onViewBag?: () => void;
}

interface AddToCartToastProps {
  visible: boolean;
  item: CartToastPayload | null;
  onDismiss: () => void;
  duration?: number;
}

export const AddToCartToast: React.FC<AddToCartToastProps> = ({
  visible,
  item,
  onDismiss,
  duration = 4000,
}) => {
  const { theme, typography } = useTheme();
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (visible && item) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible, item]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 30,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible || !item) return null;

  const AnimatedView = Animated.View as any;

  return (
    <View style={styles.bottomOverlay} pointerEvents="box-none">
      <AnimatedView
        style={[
          styles.toastCard,
          {
            backgroundColor: theme.mode === 'dark' ? '#18181B' : '#FFFFFF',
            borderColor: theme.mode === 'dark' ? '#27272A' : '#E5E7EB',
            shadowColor: '#000000',
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        {/* Left: Product Image Thumbnail with emerald green check badge */}
        <View style={styles.imageCol}>
          <View
            style={[
              styles.thumbnailWrapper,
              {
                backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F4F4F5',
                borderColor: theme.border,
              },
            ]}
          >
            {item.image ? (
              <ShimmerImage
                source={{ uri: item.image }}
                style={styles.thumbnailImg}
                resizeMode="cover"
                borderRadius={10}
                preset="pill"
              />
            ) : (
              <ShoppingBag size={20} color={theme.textPrimary} />
            )}
          </View>
          <View style={styles.successBadge}>
            <Check size={10} color="#FFFFFF" strokeWidth={3} />
          </View>
        </View>

        {/* Center: Details */}
        <View style={styles.contentCol}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.headline,
                { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
              ]}
            >
              Added to Cart
            </Text>
            {item.quantity && item.quantity > 1 ? (
              <View style={[styles.qtyChip, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.qtyChipText, { color: theme.textSecondary }]}>
                  x{item.quantity}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[styles.itemName, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            style={[styles.itemSub, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.optionLabel || ''}
            {item.price ? ` • ₹${item.price.toLocaleString('en-IN')}` : ''}
          </Text>
        </View>

        {/* Right: "View Bag" Button + Dismiss */}
        <View style={styles.actionsCol}>
          {item.onViewBag ? (
            <TouchableOpacity
              onPress={() => {
                handleDismiss();
                item.onViewBag?.();
              }}
              activeOpacity={0.85}
              style={[
                styles.viewBagBtn,
                {
                  backgroundColor: theme.mode === 'dark' ? '#FFFFFF' : '#1D1D1F',
                },
              ]}
            >
              <Text
                style={[
                  styles.viewBagBtnText,
                  {
                    color: theme.mode === 'dark' ? '#000000' : '#FFFFFF',
                    fontFamily: typography.fontFamilyHeading,
                  },
                ]}
              >
                View Bag
              </Text>
              <ArrowRight
                size={12}
                color={theme.mode === 'dark' ? '#000000' : '#FFFFFF'}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleDismiss}
            activeOpacity={0.6}
            style={styles.closeBtn}
          >
            <X size={14} color={theme.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomOverlay: {
    position: 'absolute',
    bottom: 74, // Positioned right above the bottom navigation bar
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  imageCol: {
    position: 'relative',
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  successBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981', // Emerald green check
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  qtyChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  qtyChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '400',
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  viewBagBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  closeBtn: {
    padding: 4,
  },
});
