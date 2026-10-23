import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { Heart, Plus, Minus, ChevronRight } from 'lucide-react-native';
import { MaterialItem } from '../../types';
import { ShimmerImage } from './ShimmerImage';
import { useTheme, useTypography } from '../../theme';
import { parseSanitizedPrice, formatInr } from '../../utils/priceHelper';
import { soundService } from '../../utils/soundHelper';
import { preloadImage } from '../../utils/imageOptimization';
import { getHighlightedSegments } from '../../services/searchService';
import { useClipboard } from '../../hooks';
import { useCartActions } from '../../hooks/useCartActions';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export interface ProductCardProps {
  item?: MaterialItem;
  title?: string;
  subtitle?: string;
  tag?: string;
  priceLabel?: string;
  image?: string;
  viewMode?: 'list' | 'grid';
  onPress: () => void;
  onAddToCartPress?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  cartQuantity?: number;
  width?: number | string;
  style?: ViewStyle;
  showAddButton?: boolean;
  searchQuery?: string;
  isCategoryCard?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  item,
  title,
  subtitle,
  tag,
  priceLabel,
  image,
  viewMode = 'grid',
  onPress,
  onAddToCartPress,
  isFavorite = false,
  onToggleFavorite,
  cartQuantity,
  width,
  style,
  showAddButton = true,
  searchQuery = '',
  isCategoryCard,
}) => {
  const { theme } = useTheme();
  const typography = useTypography();
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const { addMaterialWithFeedback } = useCartActions();
  const { showToast } = useToast();
  const lastClickTimeRef = React.useRef<number>(0);

  // Micro-interaction animation references (Animations 1, 2, 4)
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const favScaleAnim = useRef(new Animated.Value(1)).current;
  const addBtnScaleAnim = useRef(new Animated.Value(1)).current;

  // Determine if this card is a category navigation tile vs a purchasable SKU
  const isCategory = isCategoryCard ?? (!item && Boolean(title));

  // Determine multi-variant capability (e.g. 50kg Bag vs 1 Ton vs Truckload)
  const hasMultipleVariants = Boolean(item?.options && item.options.length > 1);

  // Determine inventory cap & stock availability
  const maxOrderLimit = item?.maxOrderQuantity || 50;
  const isOutOfStock = item?.inStock === false || (item?.stock !== undefined && item.stock <= 0);
  const isLowStock = !isOutOfStock && item?.stock !== undefined && item.stock > 0 && item.stock <= 5;

  // Determine current quantity in cart for this specific item
  const matchingCartItems = React.useMemo(() => {
    if (!item?.id) return [];
    return cartItems.filter((ci) => ci.itemId === item.id);
  }, [cartItems, item?.id]);

  const hasMultipleVariantsInCart = matchingCartItems.length > 1;

  const currentQuantity = cartQuantity !== undefined
    ? cartQuantity
    : matchingCartItems.reduce((acc, ci) => acc + (ci.quantity || 0), 0);

  const handleCardPressIn = () => {
    // Pre-cache full fidelity detail image on user intent/hover
    const targetImage = image || item?.image;
    if (targetImage) {
      preloadImage(targetImage, 'detail');
    }

    Animated.spring(cardScaleAnim, {
      toValue: 0.975,
      friction: 8,
      tension: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation?.();
    soundService.playFavorite();
    Animated.sequence([
      Animated.spring(favScaleAnim, {
        toValue: 1.35,
        friction: 3,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(favScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    if (onToggleFavorite) {
      handleSafeAction(onToggleFavorite);
    }
  };

  const handleAddPress = (e: any) => {
    e.stopPropagation?.();
    if (isOutOfStock) {
      if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
        try {
          (navigator as any).vibrate(10);
        } catch {}
      }
      soundService.playTap();
      showToast(`We'll notify you as soon as ${displayTitle} arrives!`, 'info');
      return;
    }

    // When an item has multiple units/options (e.g., 50kg bag vs 1 Ton vs Truckload),
    // open the variant picker modal to prevent accidental default mismatch!
    if (hasMultipleVariants) {
      soundService.playTap();
      onPress();
      return;
    }

    if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
      try {
        (navigator as any).vibrate(15);
      } catch {}
    }
    Animated.sequence([
      Animated.spring(addBtnScaleAnim, {
        toValue: 1.25,
        friction: 4,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(addBtnScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    handleSafeAction(() => {
      if (onAddToCartPress) {
        onAddToCartPress();
      } else if (item) {
        addMaterialWithFeedback(item);
      } else {
        onPress();
      }
    });
  };

  const handleIncrement = (e: any) => {
    e.stopPropagation?.();
    // If the user already has multiple distinct options in the cart, open the variant modal
    // so they can choose which specific variant to adjust!
    if (hasMultipleVariantsInCart) {
      soundService.playTap();
      onPress();
      return;
    }

    // Enforce max order limit per SKU (Blinkit / Zepto / Amazon standard)
    if (currentQuantity >= maxOrderLimit) {
      if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
        try {
          (navigator as any).vibrate(20);
        } catch {}
      }
      soundService.playTap();
      showToast(`Maximum limit of ${maxOrderLimit} units reached for this item.`, 'info');
      return;
    }

    if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
      try {
        (navigator as any).vibrate(12);
      } catch {}
    }
    soundService.playAddToCart();

    Animated.sequence([
      Animated.spring(addBtnScaleAnim, {
        toValue: 1.15,
        friction: 4,
        tension: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(addBtnScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    if (matchingCartItems.length > 0) {
      const target = matchingCartItems[0];
      updateQuantity(target.id, target.quantity + 1);
    } else if (item) {
      addMaterialWithFeedback(item, undefined, 1, { silent: true });
    }
  };

  const handleDecrement = (e: any) => {
    e.stopPropagation?.();
    // If user has multiple variants in cart, open variant modal to review and adjust
    if (hasMultipleVariantsInCart) {
      soundService.playTap();
      onPress();
      return;
    }

    if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
      try {
        (navigator as any).vibrate(8);
      } catch {}
    }
    soundService.playTap();

    Animated.sequence([
      Animated.spring(addBtnScaleAnim, {
        toValue: 0.88,
        friction: 4,
        tension: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(addBtnScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    if (matchingCartItems.length > 0) {
      const target = matchingCartItems[0];
      if (target.quantity <= 1) {
        removeFromCart(target.id);
        showToast(`Removed "${displayTitle}" from Cart`, 'info');
      } else {
        updateQuantity(target.id, target.quantity - 1);
      }
    }
  };

  const handleSafeAction = (callback?: () => void) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 100) {
      return; // prevent ghost multi-touch
    }
    lastClickTimeRef.current = now;
    if (callback) {
      callback();
    }
  };

  const { copy } = useClipboard();

  const handleShareProduct = async (e: any) => {
    e.stopPropagation?.();
    const itemName = title || item?.name || 'Urbanico Material';
    const shareText = `Check out ${itemName} on Urbanico Direct Yard Supplies: High-Grade Tested Construction Materials.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: itemName, text: shareText }).catch(() => {});
    } else {
      await copy(shareText);
    }
  };

  const displayTitle = title || item?.name || '';
  const displaySubtitle = subtitle || item?.subtitle || 'Direct Yard Supply';
  const displayImage = image || item?.image || '';
  const displayTag = tag || (item?.categoryId ? item.categoryId : 'MATERIALS');

  // Highlighted Title Segments
  const titleSegments = searchQuery ? getHighlightedSegments(displayTitle, searchQuery) : [];

  const renderHighlightedTitle = (baseStyle: any, numberOfLines: number) => {
    if (!searchQuery || titleSegments.length === 0) {
      return (
        <Text style={baseStyle} numberOfLines={numberOfLines}>
          {displayTitle}
        </Text>
      );
    }
    return (
      <Text style={baseStyle} numberOfLines={numberOfLines}>
        {titleSegments.map((segment, idx) => (
          <Text
            key={idx}
            style={
              segment.isMatch
                ? {
                    backgroundColor: '#FEF08A',
                    color: '#854D0E',
                    fontWeight: '800',
                  }
                : undefined
            }
          >
            {segment.text}
          </Text>
        ))}
      </Text>
    );
  };

  // Format price safely using sanitized number logic
  let displayPrice = priceLabel;
  if (!displayPrice) {
    if (item?.defaultPrice) {
      displayPrice = formatInr(parseSanitizedPrice(item.defaultPrice));
    } else if (item?.options?.[0]?.price !== undefined) {
      displayPrice = formatInr(parseSanitizedPrice(item.options[0].price));
    } else {
      displayPrice = '₹0';
    }
  }

  const AnimatedView = Animated.View as any;

  if (viewMode === 'list') {
    return (
      <AnimatedView
        style={[
          styles.productCardList,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderLight,
            transform: [{ scale: cardScaleAnim }],
          },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={() => handleSafeAction(onPress)}
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          activeOpacity={0.85}
          style={styles.listInnerPressable}
        >
          <View style={[styles.imageBoxList, { backgroundColor: theme.surfaceSecondary }]}>
            {displayImage ? (
              <ShimmerImage
                source={{ uri: displayImage }}
                style={styles.productImageList}
                resizeMode="cover"
                preset="card_list"
                borderRadius={10}
              />
            ) : null}
          </View>

          <View style={styles.listTextWrapper}>
            <View style={styles.tagEtaRow}>
              <Text style={[styles.productTag, { color: theme.textSecondary }]}>
                {(displayTag || 'MATERIALS').toUpperCase()}
              </Text>
              {hasMultipleVariants && (
                <View style={styles.optionsBadge}>
                  <Text style={styles.optionsBadgeText}>OPTIONS</Text>
                </View>
              )}
              {isLowStock && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockBadgeText}>Only {item?.stock} left</Text>
                </View>
              )}
              {isOutOfStock && (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockBadgeText}>OUT OF STOCK</Text>
                </View>
              )}
            </View>
            {renderHighlightedTitle([styles.productTitleList, { color: theme.textPrimary }], 1)}
            <Text style={[styles.productSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {displaySubtitle}
            </Text>
            <Text style={[styles.productPriceList, { color: theme.textPrimary }]} numberOfLines={1}>
              {displayPrice}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.listActionCol}>
          <View style={styles.actionTopRow}>
            {Boolean(onToggleFavorite) && (
              <TouchableOpacity
                onPress={handleFavoritePress}
                activeOpacity={0.7}
                style={[styles.favButtonList, { backgroundColor: theme.surfaceSecondary }]}
                accessibilityLabel="Toggle Favorite"
              >
                <AnimatedView style={{ transform: [{ scale: favScaleAnim }] }}>
                  <Heart
                    size={14}
                    color={isFavorite ? theme.textPrimary : theme.textPrimary}
                    fill={isFavorite ? theme.textPrimary : 'transparent'}
                  />
                </AnimatedView>
              </TouchableOpacity>
            )}
          </View>

          {isCategory ? (
            <TouchableOpacity
              onPress={() => handleSafeAction(onPress)}
              style={[
                styles.explorePill,
                {
                  backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                  borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                },
              ]}
              activeOpacity={0.75}
              accessibilityLabel="Explore Category"
            >
              <Text
                style={[
                  styles.explorePillText,
                  { color: theme.primary, fontFamily: typography.fontFamily },
                ]}
              >
                Explore
              </Text>
              <ChevronRight size={13} color={theme.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : isOutOfStock ? (
            <TouchableOpacity
              onPress={handleAddPress}
              style={[styles.notifyMePill, { borderColor: theme.border }]}
              activeOpacity={0.8}
              accessibilityLabel="Notify Me when back in stock"
            >
              <Text style={[styles.notifyMePillText, { color: theme.textSecondary }]}>Notify Me</Text>
            </TouchableOpacity>
          ) : showAddButton ? (
            hasMultipleVariantsInCart ? (
              <TouchableOpacity
                onPress={() => handleSafeAction(onPress)}
                style={[styles.variantsInCartPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}
                activeOpacity={0.8}
                accessibilityLabel="Configure Variants in Cart"
              >
                <Text style={[styles.variantsInCartText, { color: theme.textPrimary }]}>
                  {matchingCartItems.length} Variants ({currentQuantity})
                </Text>
              </TouchableOpacity>
            ) : currentQuantity > 0 ? (
              <AnimatedView
                style={[
                  styles.stepperContainer,
                  { backgroundColor: theme.buttonBg || theme.primary },
                  { transform: [{ scale: addBtnScaleAnim }] },
                ]}
              >
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={styles.stepperBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Decrease Quantity"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                >
                  <Minus size={13} color={theme.buttonText || '#18181B'} strokeWidth={2.8} />
                </TouchableOpacity>

                <Text
                  style={[
                    styles.stepperQtyText,
                    { color: theme.buttonText || '#18181B', fontFamily: typography.fontFamilyHeading },
                  ]}
                >
                  {currentQuantity}
                </Text>

                <TouchableOpacity
                  onPress={handleIncrement}
                  style={styles.stepperBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Increase Quantity"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Plus size={13} color={theme.buttonText || '#18181B'} strokeWidth={2.8} />
                </TouchableOpacity>
              </AnimatedView>
            ) : hasMultipleVariants ? (
              <TouchableOpacity
                onPress={handleAddPress}
                style={[styles.addWithOptionsPill, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.8}
                accessibilityLabel="Choose Options and Add to Cart"
              >
                <Text style={[styles.addPillText, { color: theme.buttonText || '#18181B', fontFamily: typography.fontFamily }]}>
                  + Options
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleAddPress}
                style={[styles.addPill, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.8}
                accessibilityLabel="Add to Cart"
              >
                <AnimatedView style={{ flexDirection: 'row', alignItems: 'center', gap: 4, transform: [{ scale: addBtnScaleAnim }] }}>
                  <Plus size={14} color={theme.buttonText || '#18181B'} />
                  <Text style={[styles.addPillText, { color: theme.buttonText || '#18181B', fontFamily: typography.fontFamily }]}>Add</Text>
                </AnimatedView>
              </TouchableOpacity>
            )
          ) : null}
        </View>
      </AnimatedView>
    );
  }

  /* Default Grid Layout */
  return (
    <AnimatedView
      style={[
        styles.productCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderLight,
          transform: [{ scale: cardScaleAnim }],
        },
        width ? { width } : styles.defaultGridWidth,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={() => handleSafeAction(onPress)}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        activeOpacity={0.85}
        style={{ flex: 1 }}
      >
        <View style={[styles.productImageWrapper, { backgroundColor: theme.surfaceSecondary }]}>
          {displayImage ? (
            <ShimmerImage
              source={{ uri: displayImage }}
              style={styles.productImage}
              resizeMode="cover"
              preset="card"
              borderRadius={12}
            />
          ) : null}

          {/* Top Right: Favorite Icon */}
          <View style={styles.gridTopOverlayRow}>
            <View style={{ flex: 1 }} />

            <View style={styles.gridRightIcons}>
              {Boolean(onToggleFavorite) && (
                <TouchableOpacity
                  onPress={handleFavoritePress}
                  style={[styles.gridMiniBtn, { backgroundColor: theme.surface }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Toggle Favorite"
                >
                  <AnimatedView style={{ transform: [{ scale: favScaleAnim }] }}>
                    <Heart
                      size={14}
                      color={isFavorite ? theme.primary : theme.textMuted}
                      fill={isFavorite ? theme.primary : 'transparent'}
                    />
                  </AnimatedView>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.productInfo}>
          <View style={styles.gridTagRow}>
            <Text style={[styles.productTag, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
              {(displayTag || 'MATERIALS').toUpperCase()}
            </Text>
            {hasMultipleVariants && (
              <View style={styles.optionsBadge}>
                <Text style={styles.optionsBadgeText}>OPTIONS</Text>
              </View>
            )}
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockBadgeText}>Only {item?.stock} left</Text>
              </View>
            )}
            {isOutOfStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockBadgeText}>OUT OF STOCK</Text>
              </View>
            )}
          </View>
          {renderHighlightedTitle([styles.productTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }], 2)}
          <Text style={[styles.productSubtitle, { color: theme.textSecondary, fontFamily: typography.fontFamily }]} numberOfLines={1}>
            {displaySubtitle}
          </Text>

          <View style={[styles.cardFooter, { borderTopColor: theme.borderLight }]}>
            <View style={styles.priceContainer}>
              <Text style={[styles.productPrice, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                {displayPrice}
              </Text>
            </View>
            {isCategory ? (
              <TouchableOpacity
                onPress={() => handleSafeAction(onPress)}
                style={[
                  styles.explorePill,
                  {
                    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                  },
                ]}
                activeOpacity={0.75}
                accessibilityLabel="Explore Category"
              >
                <Text
                  style={[
                    styles.explorePillText,
                    { color: theme.primary, fontFamily: typography.fontFamily },
                  ]}
                >
                  Explore
                </Text>
                <ChevronRight size={13} color={theme.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : isOutOfStock ? (
              <TouchableOpacity
                onPress={handleAddPress}
                style={[styles.notifyMePill, { borderColor: theme.border }]}
                activeOpacity={0.8}
                accessibilityLabel="Notify Me when back in stock"
              >
                <Text style={[styles.notifyMePillText, { color: theme.textSecondary }]}>Notify Me</Text>
              </TouchableOpacity>
            ) : showAddButton ? (
              hasMultipleVariantsInCart ? (
                <TouchableOpacity
                  onPress={() => handleSafeAction(onPress)}
                  style={[styles.variantsInCartPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Configure Variants in Cart"
                >
                  <Text style={[styles.variantsInCartText, { color: theme.textPrimary }]}>
                    {matchingCartItems.length} Variants ({currentQuantity})
                  </Text>
                </TouchableOpacity>
              ) : currentQuantity > 0 ? (
                <AnimatedView
                  style={[
                    styles.stepperContainer,
                    { backgroundColor: theme.buttonBg || theme.primary },
                    { transform: [{ scale: addBtnScaleAnim }] },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleDecrement}
                    style={styles.stepperBtn}
                    activeOpacity={0.7}
                    accessibilityLabel="Decrease Quantity"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                  >
                    <Minus size={13} color={theme.buttonText || '#18181B'} strokeWidth={2.8} />
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.stepperQtyText,
                      { color: theme.buttonText || '#18181B', fontFamily: typography.fontFamilyHeading },
                    ]}
                  >
                    {currentQuantity}
                  </Text>

                  <TouchableOpacity
                    onPress={handleIncrement}
                    style={styles.stepperBtn}
                    activeOpacity={0.7}
                    accessibilityLabel="Increase Quantity"
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  >
                    <Plus size={13} color={theme.buttonText || '#18181B'} strokeWidth={2.8} />
                  </TouchableOpacity>
                </AnimatedView>
              ) : hasMultipleVariants ? (
                <TouchableOpacity
                  onPress={handleAddPress}
                  style={[styles.addWithOptionsPill, { backgroundColor: theme.buttonBg || theme.primary }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Choose Options and Add to Cart"
                >
                  <Text style={[styles.addPillText, { color: theme.buttonText || '#18181B', fontFamily: typography.fontFamily }]}>
                    + Options
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleAddPress}
                  style={[styles.addPill, { backgroundColor: theme.buttonBg || theme.primary }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Add to Cart"
                >
                  <AnimatedView style={{ flexDirection: 'row', alignItems: 'center', gap: 4, transform: [{ scale: addBtnScaleAnim }] }}>
                    <Plus size={14} color={theme.buttonText || '#18181B'} />
                    <Text style={[styles.addPillText, { color: theme.buttonText || '#18181B', fontFamily: typography.fontFamily }]}>Add</Text>
                  </AnimatedView>
                </TouchableOpacity>
              )
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
};

export const ProductCard = React.memo(ProductCardComponent);

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  defaultGridWidth: {
    width: '48%',
    maxWidth: '48%',
  },
  productImageWrapper: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  gridTopOverlayRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridEtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gridEtaText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  gridRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridMiniBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 10,
    gap: 2,
  },
  productTag: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  productSubtitle: {
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  priceContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  productPrice: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  productPriceList: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexShrink: 0,
  },
  addPillText: {
    color: '#18181B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  productCardList: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  listInnerPressable: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  imageBoxList: {
    width: 86,
    height: 86,
    borderRadius: 10,
    overflow: 'hidden',
  },
  productImageList: {
    width: '100%',
    height: '100%',
  },
  listTextWrapper: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
    justifyContent: 'center',
    gap: 2,
  },
  tagEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  etaBadgeText: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '700',
  },
  productTitleList: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  listActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 2,
    flexShrink: 0,
  },
  actionTopRow: {
    flexDirection: 'row',
    gap: 6,
  },
  favButtonList: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 78,
    height: 28,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 3,
    minWidth: 16,
    textAlign: 'center',
  },
  explorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  explorePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gridTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  optionsBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  optionsBadgeText: {
    color: '#2563EB',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  lowStockBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lowStockBadgeText: {
    color: '#B45309',
    fontSize: 8.5,
    fontWeight: '700',
  },
  outOfStockBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  outOfStockBadgeText: {
    color: '#6B7280',
    fontSize: 8.5,
    fontWeight: '700',
  },
  notifyMePill: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  notifyMePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  variantsInCartPill: {
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  variantsInCartText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  addWithOptionsPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
