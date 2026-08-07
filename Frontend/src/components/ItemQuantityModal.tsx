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
  ShoppingCart,
  ShieldCheck,
  Truck,
  Award,
  CheckCircle2,
  Heart,
} from 'lucide-react-native';
import { MaterialItem, UnitOption } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ShimmerImage } from './common/ShimmerImage';
import { LoadingButton } from './common/LoadingButton';

interface ItemQuantityModalProps {
  item: MaterialItem | null;
  onClose: () => void;
  onAddToCart: (
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
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const { theme, typography } = useTheme();

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT TOP LEVEL
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [selectedRadioOptionId, setSelectedRadioOptionId] = useState<string>('');
  const [globalQuantity, setGlobalQuantity] = useState<number>(2);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const galleryScrollRef = useRef<ScrollView>(null);

  // Sync state whenever the selected item changes
  useEffect(() => {
    if (!item) return;

    const isRadio = item.options.some((o) => o.type === 'radio');
    
    // Find the option with the lowest price
    let lowestOpt = item.options[0];
    if (item.options && item.options.length > 0) {
      lowestOpt = item.options.reduce((prev, curr) => (curr.price < prev.price ? curr : prev), item.options[0]);
    }

    const initialQtyMap: Record<string, number> = {};
    item.options.forEach((opt) => {
      initialQtyMap[opt.id] = (!isRadio && opt.id === lowestOpt?.id) ? 1 : 0;
    });

    setOptionQuantities(initialQtyMap);
    setSelectedRadioOptionId(lowestOpt?.id || item.options[0]?.id || '');
    setGlobalQuantity(1);
    setActiveGalleryIndex(0);
  }, [item]);

  if (!item) return null;

  // Build a realistic 3-image gallery for the product
  const galleryImages = item.galleryImages && item.galleryImages.length > 0
    ? item.galleryImages
    : [
        item.image,
        'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
        'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477602/Gemini_Generated_Image_krt598krt598krt5_uqgizg.jpg',
      ];

  const isFav = favoriteIds.includes(item.id);
  const isRadioType = item.options.some((o) => o.type === 'radio');

  const handleUpdateOptionQty = (optId: string, delta: number) => {
    setOptionQuantities((prev) => {
      const current = prev[optId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [optId]: next };
    });
  };

  const handleGalleryScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const viewWidth = e?.nativeEvent?.layoutMeasurement?.width || 1;
    if (viewWidth > 0) {
      const idx = Math.round(contentOffsetX / viewWidth);
      setActiveGalleryIndex(idx);
    }
  };

  let calculatedTotal = 0;

  if (isRadioType) {
    const selectedOpt = item.options.find((o) => o.id === selectedRadioOptionId) || item.options[0];
    calculatedTotal = (selectedOpt?.price || 0) * globalQuantity;
  } else {
    item.options.forEach((opt) => {
      const qty = optionQuantities[opt.id] || 0;
      calculatedTotal += opt.price * qty;
    });
  }

  const handlePrimaryAdd = () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);

    setTimeout(() => {
      setIsAddingToCart(false);
      if (isRadioType) {
        const selectedOpt = item.options.find((o) => o.id === selectedRadioOptionId) || item.options[0];
        if (selectedOpt && globalQuantity > 0) {
          onAddToCart(item, selectedOpt, globalQuantity, calculatedTotal);
        }
      } else {
        let addedAny = false;
        item.options.forEach((opt) => {
          const qty = optionQuantities[opt.id] || 0;
          if (qty > 0) {
            onAddToCart(item, opt, qty, opt.price * qty);
            addedAny = true;
          }
        });
        if (!addedAny && item.options[0]) {
          onAddToCart(item, item.options[0], 1, item.options[0].price);
        }
      }
      onClose();
    }, 400);
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Floating Dark Circular Close Button above sheet (Reference Image 2) */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.8}
        style={styles.floatingCloseBtn}
      >
        <X size={20} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
        {/* Swiggy-Style Top Product Header: Image Thumbnail + Title */}
        <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.borderLight }]}>
          <View style={styles.headerThumbnailWrapper}>
            <ShimmerImage
              source={{ uri: item.image }}
              style={styles.headerThumbnail}
              resizeMode="cover"
              borderRadius={10}
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
            <Text style={[styles.modalPriceTag, { color: theme.primaryDark }]}>
              Starting at ₹{item.defaultPrice ? item.defaultPrice.toLocaleString('en-IN') : item.options[0]?.price.toLocaleString('en-IN')}
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
        <ScrollView style={[styles.modalBody, { backgroundColor: theme.surfaceSecondary }]} contentContainerStyle={styles.bodyContent}>
          {/* Customization Options */}
          <View style={styles.customizationHeaderRow}>
            <View>
              <Text style={[styles.selectLabel, { color: theme.textPrimary }]}>
                {isRadioType ? 'Choose Material Unit / Quantity' : 'Custom Options & Extras'}
              </Text>
              <Text style={[styles.selectSublabel, { color: theme.textSecondary }]}>
                {isRadioType ? 'Select 1 option' : 'Select required units'}
              </Text>
            </View>
          </View>

          {isRadioType ? (
            <View style={[styles.radioContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {item.options.map((opt) => {
                const isSelected = selectedRadioOptionId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setSelectedRadioOptionId(opt.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.radioOptionRow,
                      isSelected && { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{opt.label}</Text>
                    <View style={styles.radioRightGroup}>
                      <Text style={[styles.optionPrice, { color: theme.primaryDark }]}>
                        ₹{opt.price.toLocaleString('en-IN')}
                      </Text>
                      <View
                        style={[
                          styles.outerRadioCircle,
                          isSelected
                            ? { borderColor: theme.primary }
                            : { borderColor: theme.border },
                        ]}
                      >
                        {isSelected && <View style={[styles.innerRadioCircle, { backgroundColor: theme.primary }]} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.stepperListContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {item.options.map((opt) => {
                const qty = optionQuantities[opt.id] || 0;
                return (
                  <View key={opt.id} style={[styles.stepperRow, { borderBottomColor: theme.borderLight }]}>
                    <Text style={[styles.stepperOptionLabel, { color: theme.textPrimary }]}>{opt.label}</Text>
                    <Text style={[styles.stepperOptionPrice, { color: theme.primaryDark }]}>
                      ₹{opt.price.toLocaleString('en-IN')}
                    </Text>
                    <View style={[styles.stepperBox, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
                      <TouchableOpacity
                        onPress={() => handleUpdateOptionQty(opt.id, -1)}
                        style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                      >
                        <Minus size={14} color={theme.textPrimary} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={[styles.stepQtyText, { color: theme.textPrimary }]}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => handleUpdateOptionQty(opt.id, 1)}
                        style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                      >
                        <Plus size={14} color={theme.textPrimary} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Modal Footer (Swiggy Add Item Bar) */}
        <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {/* Stepper on bottom left */}
          <View style={[styles.globalStepperBox, { borderColor: '#16A34A', backgroundColor: '#F0FDF4' }]}>
            <TouchableOpacity
              onPress={() => setGlobalQuantity((q) => Math.max(1, q - 1))}
              style={styles.globalStepBtn}
              activeOpacity={0.7}
            >
              <Minus size={16} color="#16A34A" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={[styles.globalQtyText, { color: '#16A34A' }]}>{globalQuantity}</Text>
            <TouchableOpacity
              onPress={() => setGlobalQuantity((q) => q + 1)}
              style={styles.globalStepBtn}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#16A34A" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Wide Add Button on right with Price & MRP */}
          <View style={{ flex: 1 }}>
            <LoadingButton
              title={`Add Item | ₹${calculatedTotal.toLocaleString('en-IN')}`}
              onPress={handlePrimaryAdd}
              isLoading={isAddingToCart}
              variant="primary"
              style={{ backgroundColor: '#16A34A', height: 46 }}
            />
          </View>
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
    backgroundColor: '#334155', // Floating dark circular close button (Swiggy reference image 2)
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
    width: 44,
    height: 44,
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  modalPriceTag: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleFavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 17,
  },
  modalBody: {
    padding: 16,
  },
  bodyContent: {
    gap: 14,
    paddingBottom: 24,
  },
  galleryWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  galleryScrollView: {
    height: 170,
    borderRadius: 16,
  },
  gallerySlide: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 12,
  },
  galleryDot: {
    height: 6,
    borderRadius: 3,
  },
  qualityBadgeRow: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },
  customizationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  selectSublabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  selectAllLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C', // Swiggy Orange action link!
  },
  radioContainer: {
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    gap: 4,
  },
  radioOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  outerRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRadioCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepperListContainer: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  stepperOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  stepperOptionPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 8,
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
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepQtyText: {
    width: 22,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  globalStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  globalStepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalQtyText: {
    width: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryAddCta: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryAddCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryMrpStrikethrough: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
});
