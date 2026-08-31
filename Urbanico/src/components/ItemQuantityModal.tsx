import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import {
  X,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Check,
  Heart,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Smartphone,
  Lock,
  Info,
  Calendar,
  Truck,
  Maximize2,
} from 'lucide-react-native';
import { MaterialItem, UnitOption } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ShimmerImage } from './common/ShimmerImage';
import { useToast } from '../context/ToastContext';
import { isServiceablePincode } from '../utils/freightCalculator';
import { soundService } from '../utils/soundHelper';

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
  const { showToast } = useToast();

  // State
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityInputStr, setQuantityInputStr] = useState<string>('1');
  const [isAdding, setIsAdding] = useState(false);
  const [pincodeInput, setPincodeInput] = useState<string>('500081');
  const [pincodeChecked, setPincodeChecked] = useState<boolean>(true);
  const [showImageLightbox, setShowImageLightbox] = useState<boolean>(false);

  // Bottom Sheet Modal Animation Values (Animation 3)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(280)).current;

  useEffect(() => {
    if (item) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 90,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [item, fadeAnim, slideAnim]);

  const handleAnimatedClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onClose();
    });
  };

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
    setQuantityInputStr('1');
  }, [item]);

  if (!item) return null;

  const isTradeService = item.categoryId === 'services' || item.id.startsWith('service-');
  const isFav = favoriteIds.includes(item.id);

  // Derive IS Code compliance standard
  const getIsStandardCode = () => {
    const nameLower = (item.name + ' ' + (item.subtitle || '')).toLowerCase();
    if (nameLower.includes('cement')) return 'IS 12269:2013 (Grade 53 OPC/PPC)';
    if (nameLower.includes('sand') || nameLower.includes('aggregate') || nameLower.includes('metal')) return 'IS 383:2016 (Zone-II Coarse/Fine)';
    if (nameLower.includes('steel') || nameLower.includes('tmt') || nameLower.includes('rebar') || nameLower.includes('iron')) return 'IS 1786:2008 (Fe 550D High Ductility)';
    if (nameLower.includes('brick') || nameLower.includes('aac') || nameLower.includes('block')) return 'IS 1077:1992 / IS 2185 (Class A)';
    return 'IS 456:2000 (Plain & Reinforced Concrete)';
  };

  const isCodeStandard = getIsStandardCode();
  const labCertNo = `LAB-TS-2026-${(item.id.length * 1421 + 8812).toString().slice(0, 5)}`;

  // Selected option & pricing with safe positive fallback
  const selectedOption: UnitOption = isTradeService
    ? (item.options && item.options[0]) || {
        id: 'demo-session',
        label: 'Expert Site Visit Demo Session',
        price: 99,
        type: 'radio',
      }
    : item.options?.find((o) => o.id === selectedOptionId) || item.options?.[0] || {
        id: 'default',
        label: 'Standard Unit',
        price: Math.max(1, item.defaultPrice || 500),
        type: 'radio',
      };

  const rawUnitPrice = isTradeService ? 99 : (selectedOption?.price && selectedOption.price > 0 ? selectedOption.price : item.defaultPrice || 500);
  const unitPrice = Math.max(1, rawUnitPrice);

  // Bulk tier discount calculation
  const bulkDiscountPercent = !isTradeService
    ? quantity >= 25
      ? 10
      : quantity >= 10
      ? 5
      : 0
    : 0;

  const grossTotal = isTradeService ? 99 : unitPrice * quantity;
  const bulkDiscountAmount = Math.round((grossTotal * bulkDiscountPercent) / 100);
  const totalPrice = Math.max(1, grossTotal - bulkDiscountAmount);

  const handleQuantityInputChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setQuantityInputStr(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setQuantity(Math.min(9999, parsed));
    }
  };

  const handleQuantityBlur = () => {
    const parsed = parseInt(quantityInputStr, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(1);
      setQuantityInputStr('1');
    } else {
      const clamped = Math.min(9999, Math.max(1, parsed));
      setQuantity(clamped);
      setQuantityInputStr(clamped.toString());
    }
  };

  const handleStepQuantity = (delta: number) => {
    soundService.playTap();
    setQuantity((prev) => {
      const next = Math.max(1, Math.min(9999, prev + delta));
      setQuantityInputStr(next.toString());
      return next;
    });
  };

  const handlePincodeKeystroke = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 6);
    setPincodeInput(clean);
    if (clean.length === 6) {
      const isServ = isServiceablePincode(clean);
      setPincodeChecked(isServ);
      if (isServ) {
        soundService.playNotification();
        showToast(`PIN ${clean} verified: Yard express dispatch available`, 'success');
      } else {
        showToast(`PIN ${clean} outside primary zone: standard 24hr transit applies`, 'info');
      }
    }
  };

  const handleCheckPincode = () => {
    if (pincodeInput.length >= 6) {
      const isServ = isServiceablePincode(pincodeInput);
      setPincodeChecked(isServ);
      if (isServ) soundService.playNotification();
      showToast(isServ ? `Pincode ${pincodeInput} is serviceable for express dispatch!` : `Standard transit to ${pincodeInput}`, isServ ? 'success' : 'info');
    } else {
      soundService.playAlert();
      showToast('Please enter a valid 6-digit site pincode', 'error');
    }
  };

  const handleAddToCartClick = () => {
    if (isAdding || !selectedOption) return;
    setIsAdding(true);
    soundService.playAddToCart();

    setTimeout(() => {
      setIsAdding(false);
      onAddToCart(item, selectedOption, isTradeService ? 1 : quantity, totalPrice);
      handleAnimatedClose();
    }, 250);
  };

  const handleBuyNowClick = () => {
    if (!selectedOption) return;
    soundService.playAddToCart();
    if (onBuyNow) {
      onBuyNow(item, selectedOption, isTradeService ? 1 : quantity, totalPrice);
    } else {
      onAddToCart(item, selectedOption, isTradeService ? 1 : quantity, totalPrice);
    }
    handleAnimatedClose();
  };

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={styles.backdrop} onPress={handleAnimatedClose} />

      {/* Floating Close Button for Ease of Navigation */}
      <TouchableOpacity
        onPress={handleAnimatedClose}
        style={styles.floatingCloseBtn}
        activeOpacity={0.8}
        accessibilityLabel="Close item options"
      >
        <X size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <AnimatedView
        style={[
          styles.sheetContainer,
          {
            backgroundColor: theme.surface,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header Summary Row */}
        <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setShowImageLightbox(true)}
            activeOpacity={0.8}
            style={styles.headerThumbnailWrapper}
          >
            <ShimmerImage
              source={{ uri: item.image }}
              style={styles.headerThumbnail}
              resizeMode="cover"
              preset="thumbnail"
              borderRadius={8}
            />
            <View style={styles.thumbnailZoomBadge}>
              <Maximize2 size={9} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <View style={styles.titleWithBadgeRow}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                {item.name}
              </Text>
              {isTradeService && (
                <View style={styles.serviceBadge}>
                  <Text style={styles.serviceBadgeText}>Service</Text>
                </View>
              )}
            </View>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {isTradeService
                ? item.subtitle || 'Expert Site Inspection & Quote'
                : `₹${unitPrice.toLocaleString('en-IN')} / ${selectedOption?.label || 'unit'}`}
            </Text>
          </View>

          {onToggleFavorite && (
            <TouchableOpacity
              onPress={() => onToggleFavorite(item.id)}
              style={[styles.favBtn, { backgroundColor: theme.surfaceSecondary }]}
              activeOpacity={0.7}
              accessibilityLabel="Toggle Favorite"
            >
              <Heart
                size={18}
                color={isFav ? '#E11D48' : theme.textPrimary}
                fill={isFav ? '#E11D48' : 'transparent'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Body Content */}
        <ScrollView
          style={[styles.modalBody, { backgroundColor: theme.surfaceSecondary }]}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ======================================================== */}
          {/* 1. TRADE SERVICES POPUP CONTENT                         */}
          {/* ======================================================== */}
          {isTradeService ? (
            <View style={styles.tradeServiceFlowWrapper}>
              {/* Highlight Banner: Rs. 99 Demo Charge & 30-Day Warranty */}
              <View style={styles.highlightsGrid}>
                {/* Highlight Card 1: Rs. 99 Demo Charge */}
                <View style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.highlightHeaderRow}>
                    <Calendar size={14} color="#111111" />
                    <Text style={styles.highlightMicroLabel}>DEMO CHARGE</Text>
                  </View>
                  <Text style={[styles.highlightMainText, { color: theme.textPrimary }]}>₹99</Text>
                  <Text style={styles.highlightSubText}>Site Visit & Assessment</Text>
                </View>

                {/* Highlight Card 2: 30-Day Warranty */}
                <View style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.highlightHeaderRow}>
                    <ShieldCheck size={14} color="#059669" />
                    <Text style={[styles.highlightMicroLabel, { color: '#059669' }]}>WARRANTY</Text>
                  </View>
                  <Text style={[styles.highlightMainText, { color: theme.textPrimary }]}>30-Day</Text>
                  <Text style={styles.highlightSubText}>Guaranteed Workmanship</Text>
                </View>
              </View>

              {/* Three-Step Flow Card */}
              <View style={[styles.stepsContainerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.stepsHeaderRow}>
                  <Text style={[styles.stepsSectionTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                    How Trade Services Work
                  </Text>
                  <Text style={styles.stepsSectionSubtitle}>3-Step Verified Flow</Text>
                </View>

                {/* Step 1: Expert Site Visit */}
                <View style={styles.stepItemRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContentCol}>
                    <View style={styles.stepTitleRow}>
                      <MapPin size={14} color="#111111" />
                      <Text style={[styles.stepItemTitle, { color: theme.textPrimary }]}>
                        1. Expert Site Visit
                      </Text>
                    </View>
                    <Text style={[styles.stepItemDesc, { color: theme.textSecondary }]}>
                      A verified trade professional visits your site to inspect conditions, evaluate scope, and take exact measurements.
                    </Text>
                  </View>
                </View>

                <View style={styles.stepConnectingLine} />

                {/* Step 2: Price Updated in-app */}
                <View style={styles.stepItemRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContentCol}>
                    <View style={styles.stepTitleRow}>
                      <Smartphone size={14} color="#111111" />
                      <Text style={[styles.stepItemTitle, { color: theme.textPrimary }]}>
                        2. Price Updated in-app
                      </Text>
                    </View>
                    <Text style={[styles.stepItemDesc, { color: theme.textSecondary }]}>
                      Transparent itemized labor and material quotation is calculated and updated directly in your app.
                    </Text>
                  </View>
                </View>

                <View style={styles.stepConnectingLine} />

                {/* Step 3: Pay Securely */}
                <View style={styles.stepItemRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContentCol}>
                    <View style={styles.stepTitleRow}>
                      <Lock size={14} color="#111111" />
                      <Text style={[styles.stepItemTitle, { color: theme.textPrimary }]}>
                        3. Pay Securely
                      </Text>
                    </View>
                    <Text style={[styles.stepItemDesc, { color: theme.textSecondary }]}>
                      Review finalized quote and pay safely via digital checkout in-app to activate your 30-day warranty.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Warning Against Direct Payments */}
              <View style={styles.warningCard}>
                <View style={styles.warningHeaderRow}>
                  <AlertTriangle size={16} color="#D97706" />
                  <Text style={styles.warningTitle}>Warning: No Direct Payments</Text>
                </View>
                <Text style={styles.warningText}>
                  Never make direct cash or offline UPI payments to workers. All payments must be completed in-app to protect your 30-day warranty and guarantee dispute assistance.
                </Text>
              </View>

              {/* Note: Site Visit & Daily Rate Estimation Note */}
              <View style={[styles.demoNoteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.demoNoteHeaderRow}>
                  <Info size={14} color="#111111" />
                  <Text style={[styles.demoNoteTitle, { color: theme.textPrimary }]}>
                    Important Note on Final Pricing
                  </Text>
                </View>
                <Text style={[styles.demoNoteText, { color: theme.textSecondary }]}>
                  This booking confirms your initial ₹99 demo session and site evaluation. After the expert site visit, final charges may vary between ₹800, ₹900, or ₹1,000 per day based on the work complexity, site conditions, and project scope.
                </Text>
              </View>
            </View>
          ) : (
            /* ======================================================== */
            /* 2. BUILDING MATERIALS CUSTOMIZATION FLOW                 */
            /* ======================================================== */
            <>
              {/* Serviceability & Pincode Checker Card */}
              <View style={[styles.pincodeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.pincodeTopRow}>
                  <View style={styles.pincodeLabelGroup}>
                    <Truck size={14} color="#111111" />
                    <Text style={[styles.pincodeLabel, { color: theme.textPrimary }]}>Delivery & Yard Hub ETA</Text>
                  </View>
                  <View style={styles.pincodeInputGroup}>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincodeInput}
                      onChange={(e) => handlePincodeKeystroke(e.target.value)}
                      placeholder="Pincode"
                      style={{
                        width: 70,
                        padding: '4px 6px',
                        fontSize: 12,
                        fontWeight: '700',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                        outline: 'none',
                      }}
                    />
                    <TouchableOpacity onPress={handleCheckPincode} style={styles.pincodeCheckBtn} activeOpacity={0.7}>
                      <Text style={styles.pincodeCheckBtnText}>Check</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {pincodeChecked && (
                  <View style={styles.serviceableBadgeRow}>
                    <Check size={13} color="#059669" strokeWidth={2.5} />
                    <Text style={styles.serviceableText}>
                      Express 2-3 Hr Dispatch available to PIN {pincodeInput}
                    </Text>
                  </View>
                )}
              </View>

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
                              backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F4F4F5',
                              borderColor: '#111111',
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
                              ? { borderColor: '#111111', backgroundColor: '#111111' }
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
                    {quantity} × {selectedOption?.label || 'unit'}
                  </Text>
                </View>

                <View style={[styles.stepperBox, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
                  <TouchableOpacity
                    onPress={() => handleStepQuantity(-1)}
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
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantityInputStr}
                    onChange={(e) => handleQuantityInputChange(e.target.value)}
                    onBlur={handleQuantityBlur}
                    style={{
                      width: 44,
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: '700',
                      border: 'none',
                      background: 'transparent',
                      color: theme.textPrimary,
                      outline: 'none',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => handleStepQuantity(1)}
                    style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={theme.textPrimary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bulk Tier Discount Savings Breakdown */}
              {bulkDiscountPercent > 0 && (
                <View style={[styles.bulkDiscountCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <View style={styles.bulkDiscountRow}>
                    <Text style={[styles.bulkDiscountTitle, { color: '#065F46' }]}>
                      🎉 {bulkDiscountPercent}% Bulk Contractor Savings Applied
                    </Text>
                    <Text style={[styles.bulkSavingsAmount, { color: '#047857' }]}>
                      -₹{bulkDiscountAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text style={[styles.bulkDiscountSub, { color: '#059669' }]}>
                    Base: ₹{grossTotal.toLocaleString('en-IN')} • Net: ₹{totalPrice.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Modal Footer with Actions */}
        <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {/* 1. Add to Cart / Add Demo Button */}
          <TouchableOpacity
            onPress={handleAddToCartClick}
            activeOpacity={0.8}
            style={[
              styles.secondaryBtn,
              {
                borderColor: theme.mode === 'dark' ? '#3F3F46' : '#111111',
                backgroundColor: 'transparent',
              },
            ]}
          >
            <ShoppingCart size={16} color={theme.textPrimary} strokeWidth={2} />
            <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
              {isAdding
                ? 'Adding...'
                : isTradeService
                ? 'Add Demo to Cart'
                : 'Add to Cart'}
            </Text>
          </TouchableOpacity>

          {/* 2. Buy Now / Book Demo Session Button */}
          <TouchableOpacity
            onPress={handleBuyNowClick}
            activeOpacity={0.85}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: '#111111',
              },
            ]}
          >
            <Zap size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.primaryBtnText}>
              {isTradeService
                ? 'Book Demo Session • ₹99'
                : `Buy Now • ₹${totalPrice.toLocaleString('en-IN')}`}
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedView>

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      <Modal
        visible={showImageLightbox}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageLightbox(false)}
      >
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity onPress={() => setShowImageLightbox(false)} style={styles.lightboxCloseBtn}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.lightboxImageContainer}>
            <ShimmerImage
              source={{ uri: item.image }}
              style={styles.lightboxImage}
              resizeMode="contain"
              preset="detail"
            />
            <Text style={styles.lightboxTitle}>{item.name}</Text>
          </View>
        </View>
      </Modal>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    backgroundColor: '#111111',
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
    maxHeight: '90%',
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
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    position: 'relative',
  },
  thumbnailZoomBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 4,
    padding: 2,
  },
  headerThumbnail: {
    width: '100%',
    height: '100%',
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 8,
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  serviceBadge: {
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  favBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    maxHeight: 460,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  pincodeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  pincodeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pincodeLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pincodeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  pincodeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pincodeCheckBtn: {
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pincodeCheckBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  serviceableBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  serviceableText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    flex: 1,
  },
  complianceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  complianceLeftCol: {
    flex: 1,
    gap: 2,
  },
  complianceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complianceTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  isCodeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  labCertSub: {
    fontSize: 11,
  },
  complianceActionBtnsCol: {
    gap: 6,
    alignItems: 'flex-end',
  },
  viewCertBtn: {
    backgroundColor: '#F4F4F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  viewCertBtnText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },
  tradeServiceFlowWrapper: {
    gap: 12,
  },
  highlightsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  highlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  highlightMicroLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  highlightMainText: {
    fontSize: 17,
    fontWeight: '800',
  },
  highlightSubText: {
    fontSize: 10.5,
    color: '#707072',
    textAlign: 'center',
    marginTop: 2,
  },
  stepsContainerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  stepsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepsSectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  stepsSectionSubtitle: {
    fontSize: 11,
    color: '#707072',
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepContentCol: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  stepItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  stepItemDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  stepConnectingLine: {
    width: 2,
    height: 12,
    backgroundColor: '#E4E4E7',
    marginLeft: 10,
    marginVertical: 4,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  warningText: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
  },
  demoNoteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  demoNoteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoNoteText: {
    fontSize: 11,
    lineHeight: 15,
  },
  customizationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectSublabel: {
    fontSize: 12,
  },
  variantContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  variantOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  variantLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  },
  variantOptionPrice: {
    fontSize: 13,
  },
  quantityRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  qtySublabel: {
    fontSize: 11,
    marginTop: 1,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkDiscountCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  bulkDiscountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkDiscountTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  bulkSavingsAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  bulkDiscountSub: {
    fontSize: 11,
    marginTop: 2,
  },
  bulkTierHintCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  bulkTierHintText: {
    fontSize: 11,
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  /* Certificate Modal Styles */
  certOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  certBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  certModalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  certModalHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  certHeaderTitleCol: {
    flex: 1,
  },
  certHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  certModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  certModalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  certCloseBtn: {
    padding: 4,
  },
  certModalBody: {
    padding: 14,
    maxHeight: 380,
  },
  certMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  certMetaCol: {
    width: '47%',
  },
  certMetaLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  certMetaVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  certParamTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  certTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  certTableColHead: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  certTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  certTableCell: {
    flex: 1,
    fontSize: 10.5,
    color: '#334155',
  },
  certTableCellBold: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  certPassPill: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  certStampBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  certStampSign: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  certStampNote: {
    fontSize: 10,
    color: '#166534',
    marginTop: 2,
  },
  certModalFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  certDownloadBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  certDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  /* Lightbox Styles */
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxImageContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  lightboxImage: {
    width: '100%',
    height: 340,
  },
  lightboxTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
