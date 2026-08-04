import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Star, Heart, Plus, Check } from 'lucide-react-native';
import { MaterialItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ProductCardProps {
  item: MaterialItem;
  viewMode?: 'list' | 'grid';
  onPress: () => void;
  onAddToCartPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  cartQuantity?: number;
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  viewMode = 'grid',
  onPress,
  onAddToCartPress,
  isFavorite = false,
  onToggleFavorite,
  cartQuantity = 0,
  style,
}) => {
  const { theme, typography } = useTheme();

  // Generate realistic rating and original price for reference display
  const rating = item.id.length % 2 === 0 ? '4.8' : '4.5';
  const reviewsCount = (item.id.length * 37 + 12) % 350 + 45;
  const originalMrp = item.defaultPrice ? Math.round(item.defaultPrice * 1.15) : undefined;
  const isBestseller = item.id.includes('ultratech') || item.id.includes('river') || item.id.includes('red-clay') || item.id.includes('mason');

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[
          styles.listCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          style,
        ]}
      >
        {/* Left Thumbnail */}
        <View style={[styles.listImageWrapper, { backgroundColor: theme.surfaceSecondary }]}>
          <Image source={{ uri: item.image }} style={styles.listImage} resizeMode="cover" />
          {isBestseller && (
            <View style={styles.bestsellerCornerBadge}>
              <Text style={styles.bestsellerCornerText}>BESTSELLER</Text>
            </View>
          )}
        </View>

        {/* Center Details */}
        <View style={styles.listInfoCol}>
          {/* Top Rating & Tag */}
          <View style={styles.ratingRow}>
            <View style={styles.greenRatingPill}>
              <Star size={10} color="#15803D" fill="#15803D" />
              <Text style={styles.ratingText}>{rating} ({reviewsCount})</Text>
            </View>
            <Text style={[styles.isCertifiedTag, { color: theme.textMuted }]}>IS Certified</Text>
          </View>

          <Text style={[styles.listTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
            {item.name}
          </Text>

          {item.subtitle && (
            <Text style={[styles.listSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}

          {/* Price & Discount */}
          <View style={styles.priceRow}>
            {originalMrp && (
              <Text style={styles.mrpStrikethrough}>₹{originalMrp.toLocaleString('en-IN')}</Text>
            )}
            {item.defaultPrice && (
              <View style={styles.priceTagHighlight}>
                <Text style={styles.priceTagText}>₹{item.defaultPrice.toLocaleString('en-IN')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Action Button (ADD Dropdown Trigger) */}
        <View style={styles.listActionCol}>
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={onToggleFavorite}
              activeOpacity={0.7}
              style={styles.favCircleBtn}
            >
              <Heart
                size={15}
                color={isFavorite ? '#EF4444' : theme.textMuted}
                fill={isFavorite ? '#EF4444' : 'none'}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onAddToCartPress}
            activeOpacity={0.8}
            style={[
              styles.addBtn,
              cartQuantity > 0 ? styles.addBtnActive : styles.addBtnOutline,
            ]}
          >
            {cartQuantity > 0 ? (
              <View style={styles.addedStateRow}>
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.addBtnTextActive}>{cartQuantity} ADDED</Text>
              </View>
            ) : (
              <Text style={styles.addBtnText}>ADD</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  /* Grid View Mode (2 items per row, reference image 1) */
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[
        styles.gridCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      {/* Product Image & Badges */}
      <View style={[styles.gridImageWrapper, { backgroundColor: theme.surfaceSecondary }]}>
        <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />

        {/* Favorite Heart Button */}
        {onToggleFavorite && (
          <TouchableOpacity
            onPress={onToggleFavorite}
            activeOpacity={0.7}
            style={styles.gridFavBtn}
          >
            <Heart
              size={14}
              color={isFavorite ? '#EF4444' : theme.textMuted}
              fill={isFavorite ? '#EF4444' : 'none'}
            />
          </TouchableOpacity>
        )}

        {/* Bottom Image Rating & Bestseller Overlay */}
        <View style={styles.gridImageOverlayRow}>
          {isBestseller ? (
            <View style={styles.bestsellerTag}>
              <Text style={styles.bestsellerText}>Bestseller</Text>
            </View>
          ) : (
            <View style={styles.certifiedTag}>
              <Text style={styles.certifiedText}>IS Certified</Text>
            </View>
          )}

          <View style={styles.greenRatingPill}>
            <Star size={10} color="#15803D" fill="#15803D" />
            <Text style={styles.ratingText}>{rating} ({reviewsCount})</Text>
          </View>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.gridCardBody}>
        <Text
          style={[
            styles.gridTitle,
            { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {item.subtitle && (
          <Text style={[styles.gridSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}

        {/* Price Row & ADD Button */}
        <View style={styles.gridFooterRow}>
          <View style={styles.gridPriceCol}>
            {originalMrp && (
              <Text style={styles.mrpStrikethrough}>₹{originalMrp.toLocaleString('en-IN')}</Text>
            )}
            {item.defaultPrice && (
              <View style={styles.priceTagHighlight}>
                <Text style={styles.priceTagText}>₹{item.defaultPrice.toLocaleString('en-IN')}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={onAddToCartPress}
            activeOpacity={0.8}
            style={[
              styles.addBtn,
              cartQuantity > 0 ? styles.addBtnActive : styles.addBtnOutline,
            ]}
          >
            {cartQuantity > 0 ? (
              <Text style={styles.addBtnTextActive}>{cartQuantity} ADDED</Text>
            ) : (
              <Text style={styles.addBtnText}>ADD</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  /* Grid View Styles */
  gridCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gridImageWrapper: {
    width: '100%',
    height: 135,
    position: 'relative',
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridFavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridImageOverlayRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bestsellerTag: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestsellerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  certifiedTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  certifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  greenRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  gridCardBody: {
    padding: 10,
    justifyContent: 'space-between',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  gridSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  gridFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  gridPriceCol: {
    flexDirection: 'column',
  },
  mrpStrikethrough: {
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  priceTagHighlight: {
    backgroundColor: '#FEF08A', // Swiggy yellow price badge highlight!
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A', // Swiggy Green ADD button!
  },
  addBtnActive: {
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  addBtnTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addedStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  /* List View Styles */
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  listImageWrapper: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  bestsellerCornerBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626',
    paddingVertical: 1.5,
    alignItems: 'center',
  },
  bestsellerCornerText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  listInfoCol: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  isCertifiedTag: {
    fontSize: 10,
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  listSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  listActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  favCircleBtn: {
    padding: 4,
  },
});
