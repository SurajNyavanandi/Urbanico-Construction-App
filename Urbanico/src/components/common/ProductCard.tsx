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
import { Heart, Plus, Share2, Truck } from 'lucide-react-native';
import { MaterialItem } from '../../types';
import { ShimmerImage } from './ShimmerImage';
import { useTheme } from '../../context/ThemeContext';
import { parseSanitizedPrice, formatInr } from '../../utils/priceHelper';
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
}

export const ProductCard: React.FC<ProductCardProps> = ({
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
  width,
  style,
  showAddButton = true,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const lastClickTimeRef = React.useRef<number>(0);

  // Micro-interaction animation references (Animations 1, 2, 4)
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const favScaleAnim = useRef(new Animated.Value(1)).current;
  const addBtnScaleAnim = useRef(new Animated.Value(1)).current;

  const handleCardPressIn = () => {
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
      } else {
        onPress();
      }
    });
  };

  const handleSafeAction = (callback?: () => void) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 450) {
      return; // prevent rapid double dispatch
    }
    lastClickTimeRef.current = now;
    if (callback) {
      callback();
    }
  };

  const handleShareProduct = (e: any) => {
    e.stopPropagation?.();
    const itemName = title || item?.name || 'Urbanico Material';
    const shareText = `Check out ${itemName} on Urbanico Direct Yard Supplies: High-Grade Tested Construction Materials.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: itemName, text: shareText }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
      showToast('Product details copied for sharing', 'info');
    }
  };

  const displayTitle = title || item?.name || '';
  const displaySubtitle = subtitle || item?.subtitle || 'Direct Yard Supply';
  const displayImage = image || item?.image || '';
  const displayTag = tag || (item?.categoryId ? item.categoryId : 'MATERIALS');

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
                {displayTag.toUpperCase()}
              </Text>
              <View style={styles.etaBadge}>
                <Text style={styles.etaBadgeText}>2-3h ETA</Text>
              </View>
            </View>
            <Text style={[styles.productTitleList, { color: theme.textPrimary }]} numberOfLines={1}>
              {displayTitle}
            </Text>
            <Text style={[styles.productSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {displaySubtitle}
            </Text>
            <Text style={[styles.productPrice, { color: theme.textPrimary }]}>
              {displayPrice}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.listActionCol}>
          <View style={styles.actionTopRow}>
            <TouchableOpacity
              onPress={handleShareProduct}
              activeOpacity={0.7}
              style={[styles.favButtonList, { backgroundColor: theme.surfaceSecondary }]}
              accessibilityLabel="Share Product"
            >
              <Share2 size={13} color={theme.textPrimary} />
            </TouchableOpacity>

            {onToggleFavorite && (
              <TouchableOpacity
                onPress={handleFavoritePress}
                activeOpacity={0.7}
                style={[styles.favButtonList, { backgroundColor: theme.surfaceSecondary }]}
                accessibilityLabel="Toggle Favorite"
              >
                <AnimatedView style={{ transform: [{ scale: favScaleAnim }] }}>
                  <Heart
                    size={14}
                    color={isFavorite ? '#E11D48' : theme.textPrimary}
                    fill={isFavorite ? '#E11D48' : 'transparent'}
                  />
                </AnimatedView>
              </TouchableOpacity>
            )}
          </View>

          {showAddButton && (
            <TouchableOpacity
              onPress={handleAddPress}
              style={[styles.addPill, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              accessibilityLabel="Add to Cart"
            >
              <AnimatedView style={{ flexDirection: 'row', alignItems: 'center', gap: 4, transform: [{ scale: addBtnScaleAnim }] }}>
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.addPillText}>Add</Text>
              </AnimatedView>
            </TouchableOpacity>
          )}
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

          {/* Top Badges: Express Dispatch ETA & Share / Favorite */}
          <View style={styles.gridTopOverlayRow}>
            <View style={styles.gridEtaPill}>
              <Truck size={10} color="#FFFFFF" />
              <Text style={styles.gridEtaText}>2-3 Hr Dispatch</Text>
            </View>

            <View style={styles.gridRightIcons}>
              <TouchableOpacity
                onPress={handleShareProduct}
                style={[styles.gridMiniBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                activeOpacity={0.7}
              >
                <Share2 size={12} color="#FFFFFF" />
              </TouchableOpacity>

              {onToggleFavorite && (
                <TouchableOpacity
                  onPress={handleFavoritePress}
                  style={[styles.gridMiniBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Toggle Favorite"
                >
                  <AnimatedView style={{ transform: [{ scale: favScaleAnim }] }}>
                    <Heart
                      size={13}
                      color={isFavorite ? '#E11D48' : '#FFFFFF'}
                      fill={isFavorite ? '#E11D48' : 'transparent'}
                    />
                  </AnimatedView>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={[styles.productTag, { color: theme.textSecondary }]}>
            {displayTag.toUpperCase()}
          </Text>
          <Text style={[styles.productTitle, { color: theme.textPrimary }]} numberOfLines={2}>
            {displayTitle}
          </Text>
          <Text style={[styles.productSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {displaySubtitle}
          </Text>

          <View style={[styles.cardFooter, { borderTopColor: theme.borderLight }]}>
            <Text style={[styles.productPrice, { color: theme.textPrimary }]}>
              {displayPrice}
            </Text>
            {showAddButton && (
              <TouchableOpacity
                onPress={handleAddPress}
                style={[styles.addPill, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
                accessibilityLabel="Add to Cart"
              >
                <AnimatedView style={{ flexDirection: 'row', alignItems: 'center', gap: 4, transform: [{ scale: addBtnScaleAnim }] }}>
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.addPillText}>Add</Text>
                </AnimatedView>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  defaultGridWidth: {
    width: '48%',
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
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  productPrice: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  addPillText: {
    color: '#FFFFFF',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
});
