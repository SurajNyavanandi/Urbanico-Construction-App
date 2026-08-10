import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { MaterialItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ShimmerImage } from './ShimmerImage';

export interface ProductCardProps {
  item?: MaterialItem;
  title?: string;
  subtitle?: string;
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
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  title,
  subtitle,
  priceLabel,
  image,
  viewMode = 'grid',
  onPress,
  onAddToCartPress,
  isFavorite = false,
  onToggleFavorite,
  cartQuantity = 0,
  width,
  style,
}) => {
  const { theme, typography } = useTheme();

  const displayTitle = title || item?.name || '';
  const displaySubtitle = subtitle || item?.subtitle || '';
  const displayImage = image || item?.image || '';
  const displayPrice =
    priceLabel ||
    (item?.defaultPrice
      ? `₹${item.defaultPrice.toLocaleString('en-IN')}`
      : item?.options?.[0]?.price
      ? `₹${item.options[0].price.toLocaleString('en-IN')}`
      : '');

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.productCardList,
          { backgroundColor: theme.surface, borderColor: theme.border },
          style,
        ]}
      >
        <View
          style={[
            styles.imageBoxList,
            { backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F4F4F5' },
          ]}
        >
          {displayImage ? (
            <ShimmerImage
              source={{ uri: displayImage }}
              style={styles.productImage}
              resizeMode="cover"
              borderRadius={14}
            />
          ) : null}
        </View>

        <View style={styles.listTextWrapper}>
          <Text
            style={[
              styles.productTitle,
              { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
            ]}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>

          {Boolean(displaySubtitle) && (
            <Text
              style={[styles.productSubtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {displaySubtitle}
            </Text>
          )}

          {Boolean(displayPrice) && (
            <Text
              style={[styles.productPrice, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {displayPrice}
            </Text>
          )}
        </View>

        <View style={styles.listActionCol}>
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleFavorite();
              }}
              activeOpacity={0.7}
              style={styles.listFavBtn}
            >
              <Heart
                size={15}
                color={isFavorite ? '#EF4444' : '#64748B'}
                fill={isFavorite ? '#EF4444' : 'none'}
              />
            </TouchableOpacity>
          )}

          {onAddToCartPress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onAddToCartPress();
              }}
              activeOpacity={0.8}
              style={[
                styles.addBtnGrid,
                cartQuantity > 0 ? styles.addBtnActive : styles.addBtnOutline,
              ]}
            >
              {cartQuantity > 0 ? (
                <Text style={styles.addBtnTextActive}>{cartQuantity} ADDED</Text>
              ) : (
                <Text style={styles.addBtnText}>ADD</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  /* Default Grid Layout */
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.productCardGrid,
        width ? { width } : styles.defaultGridWidth,
        style,
      ]}
    >
      <View
        style={[
          styles.imageBoxGrid,
          { backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F4F4F5' },
        ]}
      >
        {displayImage ? (
          <ShimmerImage
            source={{ uri: displayImage }}
            style={styles.productImage}
            resizeMode="cover"
            borderRadius={14}
          />
        ) : null}

        {onToggleFavorite && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite();
            }}
            activeOpacity={0.7}
            style={styles.gridFavBtn}
          >
            <Heart
              size={14}
              color={isFavorite ? '#EF4444' : '#64748B'}
              fill={isFavorite ? '#EF4444' : 'none'}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.productTextWrapper}>
        <Text
          style={[
            styles.productTitle,
            { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
          ]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>

        {Boolean(displaySubtitle) && (
          <Text
            style={[styles.productSubtitle, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {displaySubtitle}
          </Text>
        )}

        <View style={styles.priceRowGrid}>
          {Boolean(displayPrice) && (
            <Text style={[styles.productPrice, { color: theme.textPrimary }]} numberOfLines={1}>
              {displayPrice}
            </Text>
          )}

          {onAddToCartPress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onAddToCartPress();
              }}
              activeOpacity={0.8}
              style={[
                styles.addBtnGrid,
                cartQuantity > 0 ? styles.addBtnActive : styles.addBtnOutline,
              ]}
            >
              {cartQuantity > 0 ? (
                <Text style={styles.addBtnTextActive}>{cartQuantity} ADDED</Text>
              ) : (
                <Text style={styles.addBtnText}>ADD</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  /* Grid Card Styles */
  productCardGrid: {
    gap: 8,
    marginBottom: 12,
  },
  defaultGridWidth: {
    width: '48%',
  },
  imageBoxGrid: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridFavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productTextWrapper: {
    gap: 3,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  productSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  priceRowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  addBtnGrid: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  addBtnActive: {
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  addBtnTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* List Card Styles */
  productCardList: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    gap: 12,
  },
  imageBoxList: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTextWrapper: {
    flex: 1,
    gap: 2,
  },
  listActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 72,
    paddingVertical: 2,
  },
  listFavBtn: {
    padding: 2,
  },
});
