import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ArrowRight,
  Truck,
  Check,
  Clock,
  Tag,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  ChevronRight,
  X,
  FileCheck2,
  PhoneCall,
  MessageSquare,
  Camera,
} from 'lucide-react-native';
import { CartItem, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { RazorpayModal, RazorpayPaymentResult } from './RazorpayModal';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { EmptyState } from './common/EmptyState';
import { ShimmerImage } from './common/ShimmerImage';
import { useToast } from '../context/ToastContext';
import { syncManager } from '../utils/syncManager';
import { apiService } from '../services/apiService';
import {
  estimateTotalWeightTons,
  calculateDynamicFreight,
  recommendVehicle,
  PINCODE_REGISTRY,
} from '../utils/freightCalculator';
import { validateGSTIN } from '../utils/gstinValidator';
import { LiveDispatcherChatModal } from './common/LiveDispatcherChatModal';
import { WeighbridgeScanModal } from './common/WeighbridgeScanModal';
import { SupervisorHandoffModal } from './common/SupervisorHandoffModal';

interface BasketScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  selectedLocation?: string;
  onNavigateScreen: (screen: ScreenType) => void;
  deliveries?: ActivityDelivery[];
  onOrderCreated?: (order: ActivityDelivery) => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onChangeAddressRedirect?: () => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

export const BasketScreen: React.FC<BasketScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedLocation: propLocation,
  onNavigateScreen,
  deliveries = INITIAL_DELIVERIES,
  onOrderCreated,
  onViewInvoice,
  onChangeAddressRedirect,
  isLoggedIn = false,
  onOpenLoginModal,
}) => {
  const { theme, typography } = useTheme();
  const { selectedLocation: globalLocation } = useLocation();
  const { showToast } = useToast();
  const activeLocation = globalLocation || propLocation || 'Miyapur Site, Phase 2, Hyderabad';
  const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');
  const [refreshing, setRefreshing] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Saved for Later state
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('urbanico_saved_for_later');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stock Reservation 10-Minute Expiry Countdown (Item 3)
  const [reservationSeconds, setReservationSeconds] = useState<number>(() => {
    return syncManager.getStockReservationRemainingSeconds();
  });

  useEffect(() => {
    if (cartItems.length === 0) return;
    const interval = setInterval(() => {
      setReservationSeconds((prev) => {
        if (prev <= 1) {
          showToast('Inventory reservation session renewed for 10 minutes.', 'info');
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cartItems.length, showToast]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Coupons & Promo state
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [promoInput, setPromoInput] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Split Payment state (100% full vs 50% booking advance)
  const [paymentMode, setPaymentMode] = useState<'100_percent' | '50_split'>('100_percent');

  // Modals for live dispatcher, OCR weighbridge, supervisor handoff
  const [showDispatcherChat, setShowDispatcherChat] = useState(false);
  const [showWeighbridgeScan, setShowWeighbridgeScan] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [activeSupervisor, setActiveSupervisor] = useState({
    name: 'Anand Verma',
    phone: '9876543210',
  });

  // Dynamic Freight & Axle-Load (Items 7, 15)
  const totalWeightTons = estimateTotalWeightTons(cartItems);
  const freightInfo = calculateDynamicFreight('500081', totalWeightTons);

  // Razorpay Payment States
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [latestPaymentResult, setLatestPaymentResult] = useState<RazorpayPaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const totalUnitQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const cgst = Math.round(subtotal * 0.09);
  const sgst = Math.round(subtotal * 0.09);
  const gstTax = cgst + sgst; // Flat 18% overall GST
  const deliveryDistanceKm = freightInfo.distanceKm || 12;
  const deliveryRatePerKm = freightInfo.ratePerKm || 25;
  const deliveryCharge = freightInfo.deliveryCharge || Math.round(deliveryDistanceKm * deliveryRatePerKm);
  const taxableTotal = subtotal + gstTax + deliveryCharge - couponDiscount;
  const grandTotal = Math.max(0, taxableTotal);

  const advancePaymentAmount = paymentMode === '50_split' ? Math.round(grandTotal * 0.5) : grandTotal;
  const balanceUponWeighment = grandTotal - advancePaymentAmount;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Cart and live delivery status refreshed', 'info');
    }, 800);
  };

  const handleSaveForLater = (item: CartItem) => {
    onRemoveItem(item.id);
    const updated = [...savedForLaterItems.filter((i) => i.id !== item.id), item];
    setSavedForLaterItems(updated);
    try {
      localStorage.setItem('urbanico_saved_for_later', JSON.stringify(updated));
      syncManager.broadcast('SAVED_FOR_LATER_UPDATED', updated);
    } catch {}
    showToast(`Saved "${item.itemName}" for later`, 'info');
  };

  const handleMoveToCart = (item: CartItem) => {
    const updatedSaved = savedForLaterItems.filter((i) => i.id !== item.id);
    setSavedForLaterItems(updatedSaved);
    try {
      localStorage.setItem('urbanico_saved_for_later', JSON.stringify(updatedSaved));
      syncManager.broadcast('SAVED_FOR_LATER_UPDATED', updatedSaved);
    } catch {}
    // trigger adding back
    onUpdateQuantity(item.id, 1);
    showToast(`Moved "${item.itemName}" back to bag`, 'success');
  };

  const handleRemoveSavedItem = (id: string) => {
    const updated = savedForLaterItems.filter((i) => i.id !== id);
    setSavedForLaterItems(updated);
    try {
      localStorage.setItem('urbanico_saved_for_later', JSON.stringify(updated));
      syncManager.broadcast('SAVED_FOR_LATER_UPDATED', updated);
    } catch {}
    showToast('Removed item from saved list', 'info');
  };

  const handleApplyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'BUILD10') {
      if (subtotal < 3000) {
        showToast('BUILD10 requires minimum order of ₹3,000', 'error');
        return;
      }
      const disc = Math.min(2500, Math.round(subtotal * 0.1));
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      setShowCouponModal(false);
      showToast(`Coupon ${clean} applied! Saved ₹${disc.toLocaleString('en-IN')}`, 'success');
    } else if (clean === 'URBAN500') {
      if (subtotal < 5000) {
        showToast('URBAN500 requires minimum order of ₹5,000', 'error');
        return;
      }
      setAppliedCoupon(clean);
      setCouponDiscount(500);
      setShowCouponModal(false);
      showToast('Coupon URBAN500 applied! Saved ₹500', 'success');
    } else if (clean === 'MEGA2026') {
      if (subtotal < 20000) {
        showToast('MEGA2026 requires minimum bulk order of ₹20,000', 'error');
        return;
      }
      const disc = Math.min(5000, Math.round(subtotal * 0.12));
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      setShowCouponModal(false);
      showToast(`Mega coupon applied! Saved ₹${disc.toLocaleString('en-IN')}`, 'success');
    } else {
      showToast('Invalid or expired contractor coupon code', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    showToast('Coupon removed', 'info');
  };

  const handlePlaceOrder = () => {
    if (!isLoggedIn) {
      showToast('Please log in or sign up to proceed to checkout', 'info');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

    if (subtotal < 1000) {
      showToast('Minimum Order Value is ₹1,000 for quarry dispatch', 'error');
      return;
    }

    setShowCouponModal(false);
    setShowSupervisorModal(false);
    setShowDispatcherChat(false);
    setShowWeighbridgeScan(false);
    setPaymentError(null);
    setIsPlacingOrder(true);
    setTimeout(() => {
      setIsPlacingOrder(false);
      setShowRazorpayModal(true);
    }, 200);
  };

  const handlePaymentSuccess = (result: RazorpayPaymentResult) => {
    setShowRazorpayModal(false);
    setLatestPaymentResult(result);
    setShowSuccessModal(true);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const generatedOrderNum = `URB-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: ActivityDelivery = {
      id: `del-${Date.now()}`,
      orderNumber: generatedOrderNum,
      materialName:
        cartItems.map((c) => `${c.itemName} (${c.selectedOptionLabel})`).join(', ') ||
        'Direct Yard Supply Order',
      quantity: `${cartItems.reduce((acc, c) => acc + c.quantity, 0)} Items (${totalWeightTons} MT)`,
      driverName: 'Ramesh Goud',
      driverPhone: '+91 98480 22341',
      vehicleType: freightInfo.vehicle.name,
      vehicleNumber: 'TS 08 UB ' + Math.floor(1000 + Math.random() * 9000),
      estimatedArrival: '38 mins (4.2 km away)',
      status: 'En Route',
      siteAddress: activeLocation,
      siteSupervisorName: activeSupervisor.name,
      siteSupervisorPhone: activeSupervisor.phone,
      timestamp: `Today, ${formattedTime}`,
      totalAmount: grandTotal,
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
      ewayBillNumber: `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
      weighmentSlipId: `WB-MYP-${Math.floor(1000 + Math.random() * 9000)}`,
      splitPayment: {
        advancePaid: advancePaymentAmount,
        balanceDue: balanceUponWeighment,
        paymentMode,
      },
    };

    // Send real order data to the backend API
    apiService.createOrder({
      orderNumber: generatedOrderNum,
      customerName: 'Suraj Nyavanandi',
      customerPhone: '+91 96666 35009',
      customerEmail: 'kanusuraj15@gmail.com',
      gstin: '36AABCU12341ZV',
      siteAddress: {
        siteName: 'Miyapur Site (Tower B)',
        street: activeLocation,
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500049',
      },
      items: cartItems.map((item) => ({
        name: item.itemName,
        category: item.itemCategory || 'General',
        quantity: item.quantity,
        unit: item.selectedOptionLabel || 'Unit',
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        gstAmount: 0.18,
      })),
      subtotal,
      taxAmount: gstTax,
      deliveryCharges: deliveryCharge,
      unloadingCharges: 800,
      totalAmount: grandTotal,
      paymentMethod: result.method || 'Razorpay Gateway',
      paymentStatus: 'paid',
      paymentDetails: {
        razorpayPaymentId: result.razorpay_payment_id,
        razorpayOrderId: result.razorpay_order_id,
        paymentMethod: result.method,
        amount: grandTotal,
        timestamp: new Date().toISOString(),
      },
      vehicleNumber: 'TS 08 UB ' + Math.floor(1000 + Math.random() * 9000),
      driverName: 'Ramesh Goud',
      driverPhone: '+91 98480 22341',
    }).catch((err) => {
      console.warn('Backend order recording notice:', err);
    });

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }
    syncManager.broadcast('ORDER_STATUS_CHANGED', newOrder);
    syncManager.playNotificationSound();
    onClearCart();
  };


  const activeEnRoute = deliveries.find((d) => d.status === 'En Route') || deliveries[0];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Top Segmented Tab */}
        <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSecondary }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('cart')}
            activeOpacity={0.8}
            style={[
              styles.tabButton,
              { backgroundColor: activeTab === 'cart' ? theme.surface : 'transparent' },
            ]}
          >
            <ShoppingCart
              size={15}
              color={activeTab === 'cart' ? theme.textPrimary : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'cart' ? theme.textPrimary : theme.textMuted,
                  fontWeight: activeTab === 'cart' ? '700' : '500',
                },
              ]}
            >
              My Bag {totalUnitQuantity > 0 ? `(${totalUnitQuantity})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
            style={[
              styles.tabButton,
              { backgroundColor: activeTab === 'history' ? theme.surface : 'transparent' },
            ]}
          >
            <Truck
              size={15}
              color={activeTab === 'history' ? theme.textPrimary : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'history' ? theme.textPrimary : theme.textMuted,
                  fontWeight: activeTab === 'history' ? '700' : '500',
                },
              ]}
            >
              Live Tracking & Orders
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'cart' ? (
          <>
            {/* Delivery Location Header */}
            <View style={[styles.locationHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.locationLeftRow}>
                <View style={[styles.locationIconBox, { backgroundColor: theme.surfaceSecondary }]}>
                  <MapPin size={16} color={theme.textPrimary} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={[styles.locationLabel, { color: theme.textSecondary }]}>Delivery Site</Text>
                  <Text style={[styles.locationValue, { color: theme.textPrimary }]} numberOfLines={1}>
                    {activeLocation}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => (onChangeAddressRedirect ? onChangeAddressRedirect() : onNavigateScreen('profile'))}>
                <Text style={[styles.changeBtnText, { color: theme.primary }]}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Stock Reservation Banner (Item 3) */}
            {cartItems.length > 0 && (
              <View style={styles.stockReservationBanner}>
                <View style={styles.reservationLeft}>
                  <Clock size={14} color="#0284C7" />
                  <Text style={styles.reservationTitle}>Quarry Stock Reserved</Text>
                </View>
                <View style={styles.timerBadge}>
                  <Text style={styles.timerBadgeText}>{formatTimer(reservationSeconds)}</Text>
                </View>
              </View>
            )}

            {cartItems.length === 0 && savedForLaterItems.length === 0 ? (
              <View style={[styles.nikeEmptyBagContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.nikeEmptyBagIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <ShoppingCart size={34} color={theme.textPrimary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.nikeEmptyBagTitle, { color: theme.textPrimary }]}>Your cart is empty.</Text>
                <Text style={[styles.nikeEmptyBagSub, { color: theme.textSecondary }]}>
                  Explore direct quarry aggregates, TMT rebars, and cement.
                </Text>
                <TouchableOpacity
                  onPress={() => onNavigateScreen('shop')}
                  style={[styles.nikeShopNowPill, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nikeShopNowPillText}>Explore Materials</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cartSection}>
                {/* Cart Items List */}
                {cartItems.length > 0 && (
                  <View style={styles.itemsCardList}>
                    {cartItems.map((item) => (
                      <View key={item.id} style={[styles.cartItemRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.itemImageWrapper, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderLight }]}>
                          <ShimmerImage
                            source={{ uri: item.image }}
                            style={styles.itemImage}
                            resizeMode="contain"
                            borderRadius={8}
                            preset="thumbnail"
                          />
                        </View>

                        <View style={styles.itemMainInfo}>
                          <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {item.itemName}
                          </Text>
                          <Text style={[styles.itemOptionLabel, { color: theme.textSecondary }]}>
                            {item.selectedOptionLabel}
                          </Text>
                          <Text style={[styles.itemUnitPrice, { color: theme.textPrimary }]}>
                            ₹{item.unitPrice.toLocaleString('en-IN')} / unit
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleSaveForLater(item)}
                            style={styles.saveForLaterBtn}
                            activeOpacity={0.7}
                          >
                            <Bookmark size={12} color={theme.textSecondary} />
                            <Text style={[styles.saveForLaterText, { color: theme.textSecondary }]}>Save for Later</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Stepper + Delete */}
                        <View style={styles.stepperActionRow}>
                          <View style={[styles.stepperContainer, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
                            <TouchableOpacity
                              onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              style={[styles.stepperBtn, { backgroundColor: theme.surface }]}
                              activeOpacity={0.7}
                            >
                              <Minus size={12} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <Text style={[styles.stepperQtyText, { color: theme.textPrimary }]}>{item.quantity}</Text>
                            <TouchableOpacity
                              onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              style={[styles.stepperBtn, { backgroundColor: theme.surface }]}
                              activeOpacity={0.7}
                            >
                              <Plus size={12} color={theme.textPrimary} />
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            onPress={() => onRemoveItem(item.id)}
                            style={styles.deleteBtn}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={15} color={theme.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Axle-Load & Tipper Vehicle Meter (Item 15) */}
                {cartItems.length > 0 && (
                  <View style={[styles.axleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.axleCardHeader}>
                      <View style={styles.axleHeaderLeft}>
                        <Scale size={16} color="#0284C7" />
                        <Text style={[styles.axleTitle, { color: theme.textPrimary }]}>Total Load & Axle Capacity</Text>
                      </View>
                      <Text style={[styles.axleWeight, { color: theme.textPrimary }]}>{totalWeightTons} Metric Tons</Text>
                    </View>

                    {/* Progress Gauge */}
                    <View style={styles.gaugeTrack}>
                      <View
                        style={[
                          styles.gaugeFill,
                          {
                            width: `${Math.min(100, (totalWeightTons / freightInfo.vehicle.maxTons) * 100)}%`,
                            backgroundColor: totalWeightTons > freightInfo.vehicle.maxTons ? '#DC2626' : '#16A34A',
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.axleMetaRow}>
                      <Text style={[styles.axleMetaText, { color: theme.textSecondary }]}>
                        Recommended: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{freightInfo.vehicle.name}</Text>
                      </Text>
                      <Text style={[styles.axleMetaText, { color: theme.textSecondary }]}>
                        Max Safe Limit: {freightInfo.vehicle.maxTons} MT
                      </Text>
                    </View>

                    {freightInfo.nightRestricted && (
                      <View style={styles.restrictionNotice}>
                        <AlertTriangle size={12} color="#D97706" />
                        <Text style={styles.restrictionText}>
                          GHMC Heavy Vehicle Entry Restriction applies ({freightInfo.nightHours || '10 PM – 7 AM'}). Night transit pass included.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Contractor Promo Code Card (Item 16) */}
                {cartItems.length > 0 && (
                  <View style={[styles.couponCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {appliedCoupon ? (
                      <View style={styles.appliedCouponRow}>
                        <View style={styles.appliedCouponLeft}>
                          <Tag size={15} color="#16A34A" />
                          <View>
                            <Text style={styles.appliedCodeText}>{appliedCoupon} Applied</Text>
                            <Text style={[styles.appliedDesc, { color: theme.textSecondary }]}>
                              Contractor discount: ₹{couponDiscount.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                          <X size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setShowCouponModal(true)}
                        style={styles.openCouponBtn}
                        activeOpacity={0.7}
                      >
                        <View style={styles.openCouponLeft}>
                          <Tag size={15} color="#0284C7" />
                          <Text style={[styles.openCouponText, { color: theme.textPrimary }]}>
                            Apply Contractor Promo / Coupon Code
                          </Text>
                        </View>
                        <ChevronRight size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Split Payment Selector (Item 12) */}
                {cartItems.length > 0 && (
                  <View style={[styles.splitCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.splitTitle, { color: theme.textPrimary }]}>Payment Schedule</Text>
                    <View style={styles.splitOptionsRow}>
                      <TouchableOpacity
                        onPress={() => setPaymentMode('100_percent')}
                        style={[
                          styles.splitOption,
                          paymentMode === '100_percent'
                            ? { backgroundColor: '#111111', borderColor: '#111111' }
                            : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.splitOptionText,
                            { color: paymentMode === '100_percent' ? '#FFFFFF' : theme.textPrimary },
                          ]}
                        >
                          100% Full Payment
                        </Text>
                        <Text
                          style={[
                            styles.splitOptionSub,
                            { color: paymentMode === '100_percent' ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                          ]}
                        >
                          ₹{grandTotal.toLocaleString('en-IN')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setPaymentMode('50_split')}
                        style={[
                          styles.splitOption,
                          paymentMode === '50_split'
                            ? { backgroundColor: '#111111', borderColor: '#111111' }
                            : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.splitOptionText,
                            { color: paymentMode === '50_split' ? '#FFFFFF' : theme.textPrimary },
                          ]}
                        >
                          50% Split Advance
                        </Text>
                        <Text
                          style={[
                            styles.splitOptionSub,
                            { color: paymentMode === '50_split' ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                          ]}
                        >
                          ₹{advancePaymentAmount.toLocaleString('en-IN')} now
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {paymentMode === '50_split' && (
                      <View style={styles.splitNotice}>
                        <ShieldCheck size={13} color="#059669" />
                        <Text style={styles.splitNoticeText}>
                          Pay ₹{advancePaymentAmount.toLocaleString('en-IN')} advance token now. Balance ₹{balanceUponWeighment.toLocaleString('en-IN')} payable via UPI/Cash upon physical weighbridge slip verification at site.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Price Summary Breakdown */}
                {cartItems.length > 0 && (
                  <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.summaryTitle, { color: theme.textPrimary, borderBottomColor: theme.borderLight }]}>
                      Commercial Tax Invoice Summary
                    </Text>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal ({totalUnitQuantity} items)</Text>
                      <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{subtotal.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Central GST (CGST 9%)</Text>
                      <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{cgst.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>State GST (SGST 9%)</Text>
                      <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{sgst.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <View>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                          Platform Delivery Fee ({deliveryDistanceKm} km @ ₹{deliveryRatePerKm}/km)
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>
                          Distance-based logistics • Sole platform revenue
                        </Text>
                      </View>
                      <Text style={[styles.summaryValue, { color: theme.textPrimary, fontWeight: '700' }]}>
                        ₹{deliveryCharge.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {couponDiscount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#16A34A' }]}>Contractor Discount ({appliedCoupon})</Text>
                        <Text style={[styles.summaryValue, { color: '#16A34A', fontWeight: '700' }]}>
                          -₹{couponDiscount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.summaryRow, styles.grandTotalRow, { borderTopColor: theme.borderLight }]}>
                      <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>Total Payable</Text>
                      <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>
                        ₹{advancePaymentAmount.toLocaleString('en-IN')}
                        {paymentMode === '50_split' && <Text style={{ fontSize: 11, color: '#64748B' }}> (Advance)</Text>}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Checkout CTA */}
                {cartItems.length > 0 && (
                  <TouchableOpacity
                    onPress={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    activeOpacity={0.85}
                    style={[styles.nikeCheckoutPill, { backgroundColor: theme.primary }]}
                  >
                    <Text style={styles.nikeCheckoutPillText}>
                      {isPlacingOrder ? 'Validating Stocks...' : `Pay ₹${advancePaymentAmount.toLocaleString('en-IN')} & Book Dispatch`}
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.2} />
                  </TouchableOpacity>
                )}

                {/* Saved for Later Section (Item 24) */}
                {savedForLaterItems.length > 0 && (
                  <View style={[styles.savedSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.savedSectionHeader}>
                      <BookmarkCheck size={16} color={theme.textPrimary} />
                      <Text style={[styles.savedSectionTitle, { color: theme.textPrimary }]}>
                        Saved for Later ({savedForLaterItems.length})
                      </Text>
                    </View>

                    <View style={styles.savedItemsList}>
                      {savedForLaterItems.map((item) => (
                        <View key={item.id} style={[styles.savedItemRow, { borderTopColor: theme.borderLight }]}>
                          <View style={styles.savedItemInfo}>
                            <Text style={[styles.savedItemName, { color: theme.textPrimary }]} numberOfLines={1}>
                              {item.itemName}
                            </Text>
                            <Text style={[styles.savedItemOption, { color: theme.textSecondary }]}>
                              {item.selectedOptionLabel} • ₹{item.unitPrice.toLocaleString('en-IN')}
                            </Text>
                          </View>

                          <View style={styles.savedItemActions}>
                            <TouchableOpacity
                              onPress={() => handleMoveToCart(item)}
                              style={[styles.moveToCartBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.moveToCartText, { color: theme.textPrimary }]}>Move to Bag</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveSavedItem(item.id)} style={styles.deleteBtn}>
                              <Trash2 size={14} color={theme.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          /* Live Tracking & Orders View */
          <View style={styles.historySection}>
            <View style={styles.historyHeaderRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('cart')}
                style={[styles.backToCartBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.backToCartBtnText, { color: theme.textPrimary }]}>← Back to Bag</Text>
              </TouchableOpacity>
            </View>

            {!isLoggedIn ? (
              <View style={[styles.nikeEmptyBagContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.nikeEmptyBagIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <Truck size={34} color={theme.textPrimary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.nikeEmptyBagTitle, { color: theme.textPrimary }]}>Log in to track orders.</Text>
                <Text style={[styles.nikeEmptyBagSub, { color: theme.textSecondary }]}>
                  Sign in or create an account to view real-time vehicle dispatches and download GST tax invoices.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onOpenLoginModal) onOpenLoginModal();
                  }}
                  style={[styles.nikeShopNowPill, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nikeShopNowPillText}>Log In or Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : deliveries.length === 0 ? (
              <View style={[styles.nikeEmptyBagContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.nikeEmptyBagIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <Truck size={34} color={theme.textPrimary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.nikeEmptyBagTitle, { color: theme.textPrimary }]}>No active orders.</Text>
                <Text style={[styles.nikeEmptyBagSub, { color: theme.textSecondary }]}>
                  When you place an order, live dispatch tracking and invoices will appear here.
                </Text>
                <TouchableOpacity
                  onPress={() => onNavigateScreen('shop')}
                  style={[styles.nikeShopNowPill, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nikeShopNowPillText}>Explore Materials</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Active Live Delivery Tracking Card with Real-Time Actions */}
                {activeEnRoute && (
                  <View style={[styles.trackingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.trackingCardHeader, { borderBottomColor: theme.borderLight }]}>
                      <View>
                        <Text style={[styles.trackingOrderNumber, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                          Order #{activeEnRoute.orderNumber}
                        </Text>
                        <Text style={[styles.trackingMaterialName, { color: theme.textSecondary }]}>
                          {activeEnRoute.materialName}
                        </Text>
                      </View>
                      <View style={[styles.etaPill, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.etaPillText, { color: '#15803D' }]}>{activeEnRoute.estimatedArrival}</Text>
                      </View>
                    </View>

                    {/* Delivery OTP Badge */}
                    <View style={styles.otpCardRow}>
                      <View style={styles.otpLeft}>
                        <Text style={styles.otpLabel}>Delivery Verification OTP</Text>
                        <Text style={styles.otpValue}>{activeEnRoute.deliveryOtp || '8842'}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowSupervisorModal(true)}
                        style={styles.delegateOtpBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.delegateOtpText}>Delegate to Foreman</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Delivery Meta */}
                    <View style={styles.deliveryMetaRow}>
                      <View style={styles.deliveryMetaCol}>
                        <Text style={[styles.metaLabelText, { color: theme.textSecondary }]}>Driver & Vehicle</Text>
                        <Text style={[styles.metaValText, { color: theme.textPrimary }]}>
                          {activeEnRoute.driverName} ({activeEnRoute.vehicleNumber})
                        </Text>
                      </View>
                      <View style={styles.deliveryMetaCol}>
                        <Text style={[styles.metaLabelText, { color: theme.textSecondary }]}>Assigned Site Supervisor</Text>
                        <Text style={[styles.metaValText, { color: theme.textPrimary }]}>
                          {activeSupervisor.name} ({activeSupervisor.phone})
                        </Text>
                      </View>
                    </View>

                    {/* Action Bar (Live Dispatcher Chat + OCR Weighbridge Scan + Call) */}
                    <View style={styles.activeActionBar}>
                      <TouchableOpacity
                        onPress={() => setShowDispatcherChat(true)}
                        style={[styles.actionChipBtn, { backgroundColor: '#111111' }]}
                        activeOpacity={0.8}
                      >
                        <MessageSquare size={13} color="#FFFFFF" />
                        <Text style={styles.actionChipBtnText}>Live Dispatch Chat</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowWeighbridgeScan(true)}
                        style={[styles.actionChipBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}
                        activeOpacity={0.8}
                      >
                        <Camera size={13} color={theme.textPrimary} />
                        <Text style={[styles.actionChipBtnText, { color: theme.textPrimary }]}>Scan Weighment</Text>
                      </TouchableOpacity>

                      {onViewInvoice && (
                        <TouchableOpacity
                          onPress={() => onViewInvoice(activeEnRoute)}
                          style={[styles.actionChipBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}
                          activeOpacity={0.8}
                        >
                          <FileCheck2 size={13} color={theme.textPrimary} />
                          <Text style={[styles.actionChipBtnText, { color: theme.textPrimary }]}>GST Invoice</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Past Orders List */}
                <View style={[styles.trackingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.trackingCardHeader, { borderBottomColor: theme.borderLight }]}>
                    <Text style={[styles.trackingOrderNumber, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                      Previous Order History
                    </Text>
                    <Text style={[styles.metaLabelText, { color: theme.textSecondary }]}>{deliveries.length} Dispatches</Text>
                  </View>

                  <View style={styles.deliveriesList}>
                    {deliveries.map((del, idx) => (
                      <View key={del.id} style={[styles.deliveryRow, idx > 0 && { borderTopColor: theme.borderLight, borderTopWidth: 1 }]}>
                        <View style={styles.deliveryLeftInfo}>
                          <Text style={[styles.delMaterialName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {del.materialName}
                          </Text>
                          <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
                            {del.timestamp} • {del.vehicleNumber}
                          </Text>
                        </View>

                        <View style={styles.deliveryRightInfo}>
                          <Text style={[styles.delAmountText, { color: theme.textPrimary }]}>
                            ₹{del.totalAmount.toLocaleString('en-IN')}
                          </Text>
                          <TouchableOpacity
                            onPress={() => onViewInvoice && onViewInvoice(del)}
                            style={styles.miniInvoiceBtn}
                          >
                            <Text style={styles.miniInvoiceText}>Invoice</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Contractor Coupon Drawer Modal */}
        <Modal visible={showCouponModal} transparent animationType="slide" onRequestClose={() => setShowCouponModal(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowCouponModal(false)} />
            <View style={[styles.couponModalCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.couponModalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.couponModalTitle, { color: theme.textPrimary }]}>Contractor Coupons & Offers</Text>
                <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.couponModalBody}>
                {/* Promo input */}
                <View style={styles.promoInputRow}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g. BUILD10)"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      fontSize: 13,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                      outline: 'none',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => handleApplyCoupon(promoInput)}
                    style={styles.promoApplyBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.promoApplyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>

                {/* Available Offers List */}
                <View style={styles.offersList}>
                  {[
                    {
                      code: 'BUILD10',
                      title: '10% Off on Orders Above ₹3,000',
                      desc: 'Save up to ₹2,500 on all cement and steel bookings.',
                      minVal: 'Min ₹3,000',
                    },
                    {
                      code: 'URBAN500',
                      title: 'Flat ₹500 Instant Discount',
                      desc: 'Applicable on aggregates, M-Sand, and stone chipping dispatches.',
                      minVal: 'Min ₹5,000',
                    },
                    {
                      code: 'MEGA2026',
                      title: '12% Bulk Contractor Rebate',
                      desc: 'Direct quarry bulk voucher for orders exceeding ₹20,000.',
                      minVal: 'Min ₹20,000',
                    },
                  ].map((c) => (
                    <View key={c.code} style={[styles.offerCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                      <View style={styles.offerLeft}>
                        <View style={styles.offerCodeBadge}>
                          <Text style={styles.offerCodeBadgeText}>{c.code}</Text>
                        </View>
                        <Text style={[styles.offerTitle, { color: theme.textPrimary }]}>{c.title}</Text>
                        <Text style={[styles.offerDesc, { color: theme.textSecondary }]}>{c.desc}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleApplyCoupon(c.code)}
                        style={styles.offerApplyBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.offerApplyBtnText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Razorpay Modal */}
        <RazorpayModal
          visible={showRazorpayModal}
          onClose={() => setShowRazorpayModal(false)}
          amount={advancePaymentAmount}
          orderDescription={`Booking (${cartItems.length} items) - Urbanico Supply`}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={(err) => setPaymentError(err)}
        />

        {/* Payment Success Confirmation Receipt Screen */}
        <PaymentSuccessModal
          visible={showSuccessModal}
          paymentResult={latestPaymentResult}
          selectedLocation={activeLocation}
          onClose={() => setShowSuccessModal(false)}
          onTrackOrder={() => setActiveTab('history')}
          onViewInvoice={() => {
            setShowSuccessModal(false);
            if (onViewInvoice && deliveries[0]) {
              onViewInvoice(deliveries[0]);
            }
          }}
        />

        {/* Live Dispatcher Chat Modal */}
        <LiveDispatcherChatModal
          visible={showDispatcherChat}
          onClose={() => setShowDispatcherChat(false)}
          orderNumber={activeEnRoute?.orderNumber}
          driverName={activeEnRoute?.driverName}
          driverPhone={activeEnRoute?.driverPhone}
        />

        {/* Weighbridge Scan Modal */}
        <WeighbridgeScanModal
          visible={showWeighbridgeScan}
          onClose={() => setShowWeighbridgeScan(false)}
          orderNumber={activeEnRoute?.orderNumber}
          expectedTons={totalWeightTons || 10.0}
        />

        {/* Supervisor Handoff Modal */}
        <SupervisorHandoffModal
          visible={showSupervisorModal}
          onClose={() => setShowSupervisorModal(false)}
          orderNumber={activeEnRoute?.orderNumber}
          currentSupervisorName={activeSupervisor.name}
          currentSupervisorPhone={activeSupervisor.phone}
          onSaveSupervisor={(name, phone) => setActiveSupervisor({ name, phone })}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 112,
    gap: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  locationHeader: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '400',
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  stockReservationBanner: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reservationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reservationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  timerBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cartSection: {
    gap: 12,
  },
  itemsCardList: {
    gap: 10,
  },
  cartItemRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemMainInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  itemOptionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  saveForLaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  saveForLaterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 2,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    width: 24,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
  axleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  axleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  axleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  axleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  axleWeight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  axleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  axleMetaText: {
    fontSize: 11,
  },
  restrictionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 2,
  },
  restrictionText: {
    fontSize: 10.5,
    color: '#92400E',
    flex: 1,
    lineHeight: 14,
  },
  couponCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  appliedDesc: {
    fontSize: 11,
  },
  removeCouponBtn: {
    padding: 4,
  },
  openCouponBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openCouponText: {
    fontSize: 13,
    fontWeight: '600',
  },
  splitCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  splitTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  splitOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  splitOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  splitOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  splitOptionSub: {
    fontSize: 11,
  },
  splitNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
  },
  splitNoticeText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 15,
  },
  summaryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12.5,
  },
  summaryValue: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  grandTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  grandTotalLabel: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  nikeCheckoutPill: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 30,
    marginTop: 4,
  },
  nikeCheckoutPillText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  savedSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 6,
  },
  savedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedSectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  savedItemsList: {
    gap: 8,
  },
  savedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  savedItemOption: {
    fontSize: 11.5,
    marginTop: 2,
  },
  savedItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moveToCartBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  moveToCartText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historySection: {
    gap: 14,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -4,
  },
  backToCartBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backToCartBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  trackingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  trackingOrderNumber: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  trackingMaterialName: {
    fontSize: 13,
    marginTop: 2,
  },
  etaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etaPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  otpCardRow: {
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpLeft: {
    gap: 2,
  },
  otpLabel: {
    fontSize: 10.5,
    color: '#71717A',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  otpValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#111111',
  },
  delegateOtpBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  delegateOtpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  deliveryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  deliveryMetaCol: {
    flex: 1,
    gap: 2,
  },
  metaLabelText: {
    fontSize: 11,
    fontWeight: '400',
  },
  metaValText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeActionBar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  actionChipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionChipBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  deliveriesList: {
    paddingTop: 4,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  deliveryLeftInfo: {
    flex: 1,
    gap: 2,
  },
  delMaterialName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 11.5,
  },
  deliveryRightInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  delAmountText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  miniInvoiceBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F4F4F5',
    borderRadius: 4,
  },
  miniInvoiceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#111111',
  },
  nikeEmptyBagContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  nikeEmptyBagIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nikeEmptyBagTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  nikeEmptyBagSub: {
    fontSize: 13.5,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  nikeShopNowPill: {
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nikeShopNowPillText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  couponModalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  couponModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  couponModalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  couponModalBody: {
    paddingTop: 12,
    gap: 12,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoApplyBtn: {
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  offersList: {
    gap: 10,
    marginTop: 4,
  },
  offerCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerLeft: {
    flex: 1,
    gap: 2,
  },
  offerCodeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offerCodeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  offerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
  offerDesc: {
    fontSize: 11,
  },
  offerApplyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0284C7',
    borderRadius: 6,
  },
  offerApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
