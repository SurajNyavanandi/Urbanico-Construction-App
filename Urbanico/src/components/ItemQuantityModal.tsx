import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Zap,
  Check,
  Heart,
} from 'lucide-react-native';
import { MaterialItem, UnitOption } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ShimmerImage } from './common/ShimmerImage';

interface ItemQuantityModalProps {
  item: MaterialItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MaterialItem,
    selectedOption: UnitOption,
    quantity: number,
    totalPrice: number
  ) => void;
  onBuyNow?: (
    item: MaterialItem,
    selectedOption: UnitOption,
    quantity: number,
    totalPrice: number
  ) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const ItemQuantityModal: React.FC<ItemQuantityModalProps> = ({
  item,
  onClose,
  onAddToCart,
  onBuyNow,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const { theme, typography } = useTheme();

  // State
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);

  const galleryScrollRef = useRef<ScrollView>(null);

  // Sync state whenever the selected item changes
  useEffect(() => {
    if (!item) return;

    // Find the option with lowest price or first option
    let defaultOpt = item.options?.[0];
    if (item.options && item.options.length > 0) {
      defaultOpt = item.options.reduce((prev, curr) => (curr.price < prev.price ? curr : prev), item.options[0]);
    }

    setSelectedOptionId(defaultOpt?.id || item.options?.[0]?.id || '');
    setQuantity(1);
    setActiveGalleryIndex(0);
  }, [item]);

  if (!item) return null;

  // Build gallery images
  const galleryImages = item.galleryImages && item.galleryImages.length > 0
    ? item.galleryImages
    : [
        item.image,
        'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
        'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477602/Gemini_Generated_Image_krt598krt598krt5_uqgizg.jpg',
      ];

  const isFav = favoriteIds.includes(item.id);
  const selectedOption = item.options.find((o) => o.id === selectedOptionId) || item.options[0];
  const unitPrice = selectedOption?.price || item.defaultPrice || 0;
  const totalPrice = unitPrice * quantity;

  const handleGalleryScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const viewWidth = e?.nativeEvent?.layoutMeasurement?.width || 1;
    if (viewWidth > 0) {
      const idx = Math.round(contentOffsetX / viewWidth);
      setActiveGalleryIndex(idx);
    }
  };

  const handleAddToCartClick = () => {
    if (isAdding || !selectedOption) return;
    setIsAdding(true);

    setTimeout(() => {
      setIsAdding(false);
      onAddToCart(item, selectedOption, quantity, totalPrice);
      onClose();
    }, 250);
  };

  const handleBuyNowClick = () => {
    if (!selectedOption) return;
    if (onBuyNow) {
      onBuyNow(item, selectedOption, quantity, totalPrice);
    } else {
      onAddToCart(item, selectedOption, quantity, totalPrice);
    }
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Floating Dark Circular Close Button above sheet */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.8}
        style={styles.floatingCloseBtn}
      >
        <X size={20} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
        {/* Top Product Header: Image Thumbnail + Title */}
        <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.borderLight }]}>
          <View style={styles.headerThumbnailWrapper}>
            <ShimmerImage
              source={{ uri: item.image }}
              style={styles.headerThumbnail}
              resizeMode="cover"
              borderRadius={10}
              preset="detail"
              priority="high"
            />
          </View>

          <View style={styles.headerTitleGroup}>
            <Text
              style={[
                styles.modalTitle,
                { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.subtitle && (
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
            <Text style={[styles.modalPriceTag, { color: theme.textPrimary }]}>
              ₹{unitPrice.toLocaleString('en-IN')}{' '}
              <Text style={{ fontSize: 12, fontWeight: '400', color: theme.textSecondary }}>
                / {selectedOption?.label || 'unit'}
              </Text>
            </Text>
          </View>

          {onToggleFavorite && (
            <TouchableOpacity
              onPress={() => onToggleFavorite(item.id)}
              activeOpacity={0.7}
              style={[
                styles.circleFavBtn,
                isFav
                  ? { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }
                  : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
              ]}
            >
              <Heart
                size={16}
                color={isFav ? '#EF4444' : theme.textMuted}
                fill={isFav ? '#EF4444' : 'none'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Modal Body */}
        <ScrollView
          style={[styles.modalBody, { backgroundColor: theme.surfaceSecondary }]}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Unit / Option Selection Header */}
          <View style={styles.customizationHeaderRow}>
            <Text style={[styles.selectLabel, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Select Unit / Pack Size
            </Text>
            <Text style={[styles.selectSublabel, { color: theme.textSecondary }]}>
              {item.options.length} options available
            </Text>
          </View>

          {/* Variant Selection Cards */}
          <View style={[styles.variantContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {item.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSelectedOptionId(opt.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.variantOptionRow,
                    isSelected
                      ? {
                          backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F0F9FF',
                          borderColor: theme.primary,
                        }
                      : {
                          backgroundColor: 'transparent',
                          borderColor: 'transparent',
                        },
                  ]}
                >
                  <View style={styles.variantLeftGroup}>
                    <View
                      style={[
                        styles.radioIndicator,
                        isSelected
                          ? { borderColor: theme.primary, backgroundColor: theme.primary }
                          : { borderColor: theme.border, backgroundColor: 'transparent' },
                      ]}
                    >
                      {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text
                      style={[
                        styles.variantOptionLabel,
                        {
                          color: theme.textPrimary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.variantOptionPrice,
                      {
                        color: theme.textPrimary,
                        fontWeight: isSelected ? '600' : '500',
                      },
                    ]}
                  >
                    ₹{opt.price.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quantity Selector Row */}
          <View style={[styles.quantityRowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.qtyLabel, { color: theme.textPrimary }]}>Quantity</Text>
              <Text style={[styles.qtySublabel, { color: theme.textSecondary }]}>
                {quantity} {selectedOption?.label || 'unit'}(s)
              </Text>
            </View>

            <View style={[styles.stepperBox, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={[
                  styles.stepBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: quantity <= 1 ? 0.5 : 1,
                  },
                ]}
                activeOpacity={0.7}
                disabled={quantity <= 1}
              >
                <Minus size={14} color={theme.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={[styles.stepQtyText, { color: theme.textPrimary }]}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity((q) => q + 1)}
                style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Plus size={14} color={theme.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal Footer with "Add to Cart" and "Buy Now" Side by Side */}
        <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {/* 1. Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCartClick}
            activeOpacity={0.8}
            style={[
              styles.secondaryBtn,
              {
                borderColor: theme.mode === 'dark' ? '#3F3F46' : '#1D1D1F',
                backgroundColor: 'transparent',
              },
            ]}
          >
            <ShoppingBag size={16} color={theme.textPrimary} strokeWidth={2} />
            <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>

          {/* 2. Buy Now Button */}
          <TouchableOpacity
            onPress={handleBuyNowClick}
            activeOpacity={0.85}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: theme.mode === 'dark' ? '#FFFFFF' : '#1D1D1F',
              },
            ]}
          >
            <Zap size={16} color={theme.mode === 'dark' ? '#000000' : '#FFFFFF'} strokeWidth={2} />
            <Text
              style={[
                styles.primaryBtnText,
                { color: theme.mode === 'dark' ? '#000000' : '#FFFFFF' },
              ]}
            >
              Buy Now • ₹{totalPrice.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
  },
  floatingCloseBtn: {
    alignSelf: 'center',
    marginBottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerThumbnailWrapper: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerThumbnail: {
    width: '100%',
    height: '100%',
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
    marginTop: 2,
  },
  modalPriceTag: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: -0.1,
  },
  circleFavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBody: {
    padding: 16,
  },
  bodyContent: {
    gap: 12,
    paddingBottom: 20,
  },
  customizationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  selectSublabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  variantContainer: {
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  variantOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  variantLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radioIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantOptionLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
    flex: 1,
  },
  variantOptionPrice: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  quantityRowCard: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  qtySublabel: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    padding: 3,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepQtyText: {
    width: 24,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  primaryBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
