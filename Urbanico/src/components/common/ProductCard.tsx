import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
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

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          styles.productCardList,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderLight,
          },
          style,
        ]}
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
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleSafeAction(onToggleFavorite);
                }}
                activeOpacity={0.7}
                style={[styles.favButtonList, { backgroundColor: theme.surfaceSecondary }]}
                accessibilityLabel="Toggle Favorite"
              >
                <Heart
                  size={14}
                  color={isFavorite ? '#E11D48' : theme.textPrimary}
                  fill={isFavorite ? '#E11D48' : 'transparent'}
                />
              </TouchableOpacity>
            )}
          </View>

          {showAddButton && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleSafeAction(() => {
                  if (onAddToCartPress) {
                    onAddToCartPress();
                  } else {
                    onPress();
                  }
                });
              }}
              style={[styles.addPill, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              accessibilityLabel="Add to Cart"
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.addPillText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  /* Default Grid Layout */
  return (
    <TouchableOpacity
      onPress={() => handleSafeAction(onPress)}
      activeOpacity={0.85}
      style={[
        styles.productCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderLight,
        },
        width ? { width } : styles.defaultGridWidth,
        style,
      ]}
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
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleSafeAction(onToggleFavorite);
                }}
                style={[styles.gridMiniBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                activeOpacity={0.7}
                accessibilityLabel="Toggle Favorite"
              >
                <Heart
                  size={13}
                  color={isFavorite ? '#E11D48' : '#FFFFFF'}
                  fill={isFavorite ? '#E11D48' : 'transparent'}
                />
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
              onPress={(e) => {
                e.stopPropagation?.();
                handleSafeAction(() => {
                  if (onAddToCartPress) {
                    onAddToCartPress();
                  } else {
                    onPress();
                  }
                });
              }}
              style={[styles.addPill, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              accessibilityLabel="Add to Cart"
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.addPillText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
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
    zIndex: 2,
  },
  gridEtaPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridEtaText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  gridRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  tagEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  etaBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  etaBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 2,
    height: 34,
  },
  productSubtitle: {
    fontSize: 11,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    minHeight: 28,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  /* List Mode Styles */
  productCardList: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    marginBottom: 10,
  },
  imageBoxList: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
  },
  productImageList: {
    width: '100%',
    height: '100%',
  },
  listTextWrapper: {
    flex: 1,
    gap: 2,
  },
  productTitleList: {
    fontSize: 13,
    fontWeight: '700',
  },
  listActionCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favButtonList: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
