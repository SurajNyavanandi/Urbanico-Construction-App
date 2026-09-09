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
  TextInput,
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
  ChevronDown,
  ChevronUp,
  X,
  FileCheck2,
  PhoneCall,
  MessageSquare,
  Camera,
  ShoppingBag,
  Building2,
  Home,
  Briefcase,
  FileSpreadsheet,
  Download,
} from 'lucide-react-native';
import { CartItem, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { lookupCityStateFromPincode } from '../utils/addressHelper';
import { RazorpayModal, RazorpayPaymentResult } from './RazorpayModal';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { EmptyState } from './common/EmptyState';
import { ShimmerImage } from './common/ShimmerImage';
import { useToast } from '../context/ToastContext';
import { syncManager } from '../utils/syncManager';
import { safeStorage } from '../utils/safeStorage';
import { soundService } from '../utils/soundHelper';
import { OrderHistorySkeleton } from './common/SkeletonLoader';
import { calculateCartTotals, isCartItemService } from '../utils/cartCalculations';
import { apiService } from '../services/apiService';
import {
  estimateTotalWeightTons,
  calculateDynamicFreight,
  recommendVehicle,
  PINCODE_REGISTRY,
} from '../utils/freightCalculator';
import { validateGSTIN } from '../utils/gstinValidator';
import { openProformaQuotationPrint } from '../utils/proformaQuotationHelper';
import { LiveDispatcherChatModal } from './common/LiveDispatcherChatModal';
import { WeighbridgeScanModal } from './common/WeighbridgeScanModal';
import { SupervisorHandoffModal } from './common/SupervisorHandoffModal';

interface BasketScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onAddToCart?: (item: CartItem) => void;
  selectedLocation?: string;
  onNavigateScreen: (screen: ScreenType) => void;
  deliveries?: ActivityDelivery[];
  onOrderCreated?: (order: ActivityDelivery) => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onChangeAddressRedirect?: () => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
  user?: any;
}

export const BasketScreen: React.FC<BasketScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCart,
  selectedLocation: propLocation,
  onNavigateScreen,
  deliveries = INITIAL_DELIVERIES,
  onOrderCreated,
  onViewInvoice,
  onChangeAddressRedirect,
  isLoggedIn = false,
  onOpenLoginModal,
  user,
}) => {
  const { theme, typography } = useTheme();
  const {
    selectedLocation: globalLocation,
    savedLocations,
    setSelectedLocation,
    addLocation,
  } = useLocation();
  const { showToast } = useToast();
  const activeLocation = globalLocation || propLocation || 'Miyapur Site, Phase 2, Hyderabad';
  const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');
  const [refreshing, setRefreshing] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const createdOrderRef = React.useRef<ActivityDelivery | null>(null);

  // Checkout Delivery Address Selection Modal (Flipkart / Amazon Style)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCheckoutAddress, setSelectedCheckoutAddress] = useState<string>(activeLocation);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New Address Form State
  const [newAddrName, setNewAddrName] = useState(user?.name || '');
  const [newAddrPhone, setNewAddrPhone] = useState(user?.phone?.replace(/\D/g, '') || '');
  const [newAddrPincode, setNewAddrPincode] = useState('500081');
  const [newAddrFlat, setNewAddrFlat] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('Hyderabad');
  const [newAddrState, setNewAddrState] = useState('Telangana');
  const [newAddrType, setNewAddrType] = useState<'Site' | 'Home' | 'Office' | 'Warehouse'>('Site');
  const [addrFormError, setAddrFormError] = useState<string | null>(null);

  useEffect(() => {
    if (activeLocation && !selectedCheckoutAddress) {
      setSelectedCheckoutAddress(activeLocation);
    }
  }, [activeLocation]);

  useEffect(() => {
    if (user?.name && !newAddrName) setNewAddrName(user.name);
    if (user?.phone && !newAddrPhone) setNewAddrPhone(user.phone.replace(/\D/g, ''));
  }, [user]);

  // Saved for Later state
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>(() => {
    try {
      const saved = safeStorage.getItem('urbanico_saved_for_later');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => ({
            ...item,
            id: item.id || `saved-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          }));
        }
      }
      return [];
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

  // Modals for live dispatcher, OCR weighbridge, supervisor handoff
  const [showDispatcherChat, setShowDispatcherChat] = useState(false);
  const [showWeighbridgeScan, setShowWeighbridgeScan] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [activeSupervisor, setActiveSupervisor] = useState({
    name: 'Anand Verma',
    phone: '9876543210',
  });

  // Extract active pincode from delivery address dynamically (defaults to 500081)
  const currentAddressStr = selectedCheckoutAddress || activeLocation || '';
  const detectedPincodeMatch = currentAddressStr.match(/\b(50[0-9]{4})\b/);
  const activePincode = detectedPincodeMatch ? detectedPincodeMatch[1] : '500081';

  // Dynamic Freight from Hyderabad Central Hub at ₹5/km
  const totalWeightTons = estimateTotalWeightTons(cartItems);
  const freightInfo = calculateDynamicFreight(activePincode, totalWeightTons);

  // Razorpay Payment States
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [latestPaymentResult, setLatestPaymentResult] = useState<RazorpayPaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // B2B GSTIN input for Tax Invoicing & 18% Input Tax Credit
  const [checkoutGstin, setCheckoutGstin] = useState(user?.gstin || '');
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Order Cancellation Guard & Status State
  const [cancelledOrderIds, setCancelledOrderIds] = useState<string[]>([]);
  const [orderToCancel, setOrderToCancel] = useState<ActivityDelivery | null>(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  const deliveryDistanceKm = freightInfo.distanceKm || 10;
  const {
    serviceItems,
    materialItems,
    isServicesOnly,
    hasServices,
    hasMaterials,
    totalQuantity: totalUnitQuantity,
    servicesSubtotal,
    materialsSubtotal,
    subtotal,
    gstTax,
    deliveryCharge,
    grandTotal,
  } = calculateCartTotals(cartItems, couponDiscount, deliveryDistanceKm);

  const payableAmount = grandTotal;

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
      safeStorage.setItem('urbanico_saved_for_later', JSON.stringify(updated));
      syncManager.broadcast('SAVED_FOR_LATER_UPDATED', updated);
    } catch {}
    showToast(`Saved "${item.itemName}" for later`, 'info');
  };

  const handleMoveToCart = (item: CartItem) => {
    const updatedSaved = savedForLaterItems.filter((i) => i.id !== item.id);
    setSavedForLaterItems(updatedSaved);
    try {
      safeStorage.setItem('urbanico_saved_for_later', JSON.stringify(updatedSaved));
      syncManager.broadcast('SAVED_FOR_LATER_UPDATED', updatedSaved);
    } catch {}
    // trigger adding back to cart
    if (onAddToCart) {
      onAddToCart(item);
    } else {
      onUpdateQuantity(item.id, 1);
    }
    showToast(`Moved "${item.itemName}" back to cart`, 'success');
  };

  const handleRemoveSavedItem = (id: string) => {
    const updated = savedForLaterItems.filter((i) => i.id !== id);
    setSavedForLaterItems(updated);
    try {
      safeStorage.setItem('urbanico_saved_for_later', JSON.stringify(updated));
      syncManager.broadcast('SAVED_FOR_LATER_UPDATED', updated);
    } catch {}
    showToast('Removed item from saved list', 'info');
  };

  // Saved Delivery Addresses list (E-commerce Flipkart / Amazon style)
  const availableAddresses: string[] = Array.from(
    new Set([
      activeLocation,
      ...savedLocations,
      'Miyapur Site, Phase 2, Hyderabad - 500049',
      'Gachibowli Site 4, Financial District, Hyderabad - 500032',
      'Hitech City Commercial Tower, Madhapur, Hyderabad - 500081',
    ].filter(Boolean))
  );

  const handlePincodeChange = (pin: string) => {
    const cleaned = pin.replace(/\D/g, '').slice(0, 6);
    setNewAddrPincode(cleaned);
    if (cleaned.length >= 3) {
      const lookup = lookupCityStateFromPincode(cleaned);
      if (lookup.city) setNewAddrCity(lookup.city);
      if (lookup.state) setNewAddrState(lookup.state);
    }
    if (cleaned.length === 6) {
      const prefix = parseInt(cleaned.slice(0, 3), 10);
      if (prefix < 500 || prefix > 509) {
        setAddrFormError('Currently delivering exclusively across Hyderabad & Telangana regions (PIN: 500xxx - 509xxx). Out-of-zone freight is not yet serviceable.');
      } else {
        setAddrFormError(null);
      }
    }
  };

  const handlePincodeBlur = () => {
    if (newAddrPincode.length >= 3) {
      const lookup = lookupCityStateFromPincode(newAddrPincode);
      if (lookup.city) setNewAddrCity(lookup.city);
      if (lookup.state) setNewAddrState(lookup.state);
    }
  };

  const handleSaveAndSelectNewAddress = () => {
    if (!newAddrName.trim()) {
      setAddrFormError('Please enter full name or site incharge');
      return;
    }
    if (!newAddrPhone.trim() || newAddrPhone.trim().length < 10) {
      setAddrFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!newAddrPincode.trim() || newAddrPincode.trim().length !== 6) {
      setAddrFormError('Please enter a valid 6-digit Indian pincode');
      return;
    }
    const pinPrefix = parseInt(newAddrPincode.trim().slice(0, 3), 10);
    if (pinPrefix < 500 || pinPrefix > 509) {
      setAddrFormError('Currently delivering exclusively across Hyderabad & Telangana regions (PIN: 500xxx - 509xxx). Out-of-zone freight is unavailable.');
      return;
    }
    if (!newAddrFlat.trim()) {
      setAddrFormError('Please enter flat/plot/building or site name');
      return;
    }
    if (!newAddrStreet.trim()) {
      setAddrFormError('Please enter street or area name');
      return;
    }

    const fullFormatted = `${newAddrFlat.trim()}, ${newAddrStreet.trim()}${newAddrLandmark.trim() ? `, Near ${newAddrLandmark.trim()}` : ''}, ${newAddrCity.trim()} - ${newAddrPincode.trim()}, ${newAddrState.trim()}`;

    addLocation(fullFormatted);
    setSelectedCheckoutAddress(fullFormatted);
    setSelectedLocation(fullFormatted);
    setIsAddingNewAddress(false);
    setAddrFormError(null);
    showToast('New delivery address added and selected!', 'success');
  };

  const handleConfirmCancelOrder = () => {
    if (!orderToCancel) return;
    setCancelledOrderIds((prev) => [...prev, orderToCancel.id]);
    showToast(`Order #${orderToCancel.orderNumber} cancelled. 100% refund of ₹${orderToCancel.totalAmount.toLocaleString('en-IN')} initiated to your source account.`, 'info');
    setShowCancelConfirmModal(false);
    setOrderToCancel(null);
  };

  const handleStartCheckout = () => {
    if (!isLoggedIn) {
      showToast('Please log in or sign up to proceed to checkout', 'info');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

    setShowCouponModal(false);
    setShowSupervisorModal(false);
    setShowDispatcherChat(false);
    setShowWeighbridgeScan(false);
    setPaymentError(null);
    setSelectedCheckoutAddress(activeLocation);
    setIsAddingNewAddress(false);
    setAddrFormError(null);
    setShowCheckoutModal(true);
  };

  const handleConfirmAddressAndProceedToPay = () => {
    const chosenAddress = selectedCheckoutAddress || activeLocation;
    setSelectedLocation(chosenAddress);
    setShowCheckoutModal(false);
    setIsPlacingOrder(true);
    setTimeout(() => {
      setIsPlacingOrder(false);
      setShowRazorpayModal(true);
    }, 200);
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
    console.log(`[Order] Paid: ₹${result.amount} | PayID: ${result.razorpay_payment_id}`);

    setShowRazorpayModal(false);
    setLatestPaymentResult(result);
    setShowSuccessModal(true);
    setActiveTab('history');

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const generatedOrderNum = `URB-${Math.floor(10000 + Math.random() * 90000)}`;

    const isMixedCart = hasMaterials && hasServices;
    const materialSummary = materialItems.map((c) => `${c.itemName} (${c.selectedOptionLabel})`).join(', ');
    const serviceSummary = serviceItems.map((c) => `${c.itemName}`).join(', ');

    const finalMaterialName = isServicesOnly
      ? `${serviceItems[0]?.itemName || 'Skilled Trade'} Service Booking`
      : isMixedCart
      ? `${materialSummary} + [Service: ${serviceSummary}]`
      : materialSummary || 'Direct Supply Order';

    const finalVehicleType = isServicesOnly
      ? 'Service Inspection Vehicle'
      : isMixedCart
      ? `${freightInfo.vehicle.name} & Trade Service Unit`
      : freightInfo.vehicle.name;

    const finalVehicleNum = isServicesOnly
      ? 'TS 09 SV 4182'
      : isMixedCart
      ? 'TS 08 UB 6742 (Truck) & TS 09 SV 4182 (Service)'
      : 'TS 08 UB 6742';

    const finalDriverName = isServicesOnly
      ? 'Vijay Kumar (Verified Specialist)'
      : isMixedCart
      ? 'Ramesh Goud (Yard Dispatch) & Vijay Kumar (Specialist)'
      : 'Ramesh Goud';

    const assignedDriverPhone = '+91 98480 22341';
    const deliveryDestination = selectedCheckoutAddress || activeLocation;
    const effectiveGstin = checkoutGstin.trim() || user?.gstin || (isServicesOnly ? undefined : '36AABCU12341ZV');

    const newOrder: ActivityDelivery = {
      id: `del-${Date.now()}`,
      orderNumber: generatedOrderNum,
      materialName: finalMaterialName,
      quantity: isServicesOnly ? '1 Site Visit' : `${cartItems.reduce((acc, c) => acc + c.quantity, 0)} Items`,
      driverName: finalDriverName,
      driverPhone: assignedDriverPhone,
      vehicleType: finalVehicleType,
      vehicleNumber: finalVehicleNum,
      estimatedArrival: isServicesOnly ? 'Today within 2 hrs' : '35 mins',
      status: 'En Route',
      siteAddress: deliveryDestination,
      siteSupervisorName: activeSupervisor.name,
      siteSupervisorPhone: activeSupervisor.phone,
      timestamp: `Today, ${formattedTime}`,
      totalAmount: grandTotal,
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
      ewayBillNumber: `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
      weighmentSlipId: `WB-HYD-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    createdOrderRef.current = newOrder;

    // Send real order data to the backend API with customer profile
    apiService.createOrder({
      orderNumber: generatedOrderNum,
      customerName: user?.name || 'Urbanico Builder',
      customerPhone: user?.phone ? (user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`) : '+91 98480 12345',
      customerEmail: user?.email || 'builder@urbanico.in',
      gstin: effectiveGstin,
      siteAddress: {
        siteName: 'Site Delivery Location',
        street: deliveryDestination,
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: activePincode || '500081',
      },
      items: cartItems.map((item) => ({
        name: item.itemName,
        category: item.categoryName || 'General',
        quantity: item.quantity,
        unit: item.selectedOptionLabel || 'Unit',
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        gstAmount: isCartItemService(item) ? 0 : Math.round(item.unitPrice * item.quantity * 0.18),
      })),
      subtotal,
      taxAmount: gstTax,
      deliveryCharges: deliveryCharge,
      unloadingCharges: 0,
      totalAmount: grandTotal,
      paymentMethod: result.method || 'Razorpay Gateway',
      paymentStatus: 'paid',
      paymentDetails: {
        razorpayPaymentId: result.razorpay_payment_id,
        razorpayOrderId: result.razorpay_order_id,
        paymentMethod: result.method,
        amount: payableAmount,
        timestamp: new Date().toISOString(),
      },
      vehicleNumber: finalVehicleNum,
      driverName: finalDriverName,
      driverPhone: assignedDriverPhone,
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

  const handleDownloadProformaQuotation = () => {
    if (cartItems.length === 0) {
      showToast('Add materials to cart to generate a proforma quotation', 'info');
      return;
    }
    soundService.playTap();
    const success = openProformaQuotationPrint({
      cartItems,
      subtotal,
      gstTax,
      freightCharge: deliveryCharge,
      freightVehicleName: freightInfo.vehicle.name,
      totalPayable: payableAmount,
      deliveryAddress: selectedCheckoutAddress || activeLocation,
      customerName: user?.name || 'Valued Builder / Contractor',
      customerPhone: user?.phone ? (user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`) : '+91 98480 12345',
      customerEmail: user?.email || 'builder@urbanico.in',
      customerGstin: checkoutGstin.trim() || user?.gstin || undefined,
    });
    if (success) {
      showToast('Opening Proforma Quotation PDF for print/save...', 'success');
    } else {
      showToast('Please enable popups to print/download quotation PDF', 'error');
    }
  };

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route' && !cancelledOrderIds.includes(d.id));

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
              Cart {totalUnitQuantity > 0 ? `(${totalUnitQuantity})` : ''}
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
                    {cartItems.map((item, idx) => (
                      <View
                        key={item.id ? `${item.id}-${idx}` : `cart-item-${item.itemId || 'item'}-${idx}`}
                        style={[styles.cartItemRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
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
                          <Text style={[styles.itemUnitPrice, { color: theme.textPrimary, fontWeight: '700' }]}>
                            ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}{' '}
                            <Text style={{ fontSize: 11, fontWeight: '400', color: theme.textSecondary }}>
                              (₹{item.unitPrice.toLocaleString('en-IN')} × {item.quantity})
                            </Text>
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
                              onPress={() => {
                                soundService.playTap();
                                onUpdateQuantity(item.id, item.quantity - 1);
                              }}
                              style={[styles.stepperBtn, { backgroundColor: theme.surface }]}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.7}
                            >
                              <Minus size={13} color={theme.textPrimary} />
                            </TouchableOpacity>
                            <Text style={[styles.stepperQtyText, { color: theme.textPrimary }]}>{item.quantity}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                soundService.playTap();
                                onUpdateQuantity(item.id, item.quantity + 1);
                              }}
                              style={[styles.stepperBtn, { backgroundColor: theme.surface }]}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.7}
                            >
                              <Plus size={13} color={theme.textPrimary} />
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              soundService.playAlert();
                              onRemoveItem(item.id);
                            }}
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

                {/* Contractor Promo Code Card */}
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

                {/* Price Summary Breakdown */}
                {cartItems.length > 0 && (
                  <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.summaryTitle, { color: theme.textPrimary, borderBottomColor: theme.borderLight }]}>
                      Order Summary
                    </Text>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                        Subtotal ({totalUnitQuantity} {totalUnitQuantity === 1 ? 'item' : 'items'})
                      </Text>
                      <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                        ₹{subtotal.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {isServicesOnly && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                          Technician Site Conveyance
                        </Text>
                        <Text style={[styles.summaryValue, { color: '#16A34A', fontWeight: '700' }]}>
                          FREE (Included in ₹99)
                        </Text>
                      </View>
                    )}

                    {materialItems.length > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>GST (18%)</Text>
                        <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                          ₹{gstTax.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}
                    {materialItems.length > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                          Direct Yard Freight ({deliveryDistanceKm} km)
                        </Text>
                        <Text style={[styles.summaryValue, { color: theme.textPrimary, fontWeight: '700' }]}>
                          {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                        </Text>
                      </View>
                    )}

                    {couponDiscount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: '#16A34A' }]}>Contractor Discount ({appliedCoupon})</Text>
                        <Text style={[styles.summaryValue, { color: '#16A34A', fontWeight: '700' }]}>
                          -₹{couponDiscount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.summaryRow, styles.grandTotalRow, { borderTopColor: theme.borderLight }]}>
                      <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>
                        Total Payable
                      </Text>
                      <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>
                        ₹{grandTotal.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Checkout CTA */}
                {cartItems.length > 0 && (
                  <View style={{ gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                      onPress={handleStartCheckout}
                      disabled={isPlacingOrder}
                      activeOpacity={0.85}
                      style={[styles.nikeCheckoutPill, { backgroundColor: theme.primary }]}
                    >
                      <Text style={styles.nikeCheckoutPillText}>
                        {isPlacingOrder
                          ? 'Processing...'
                          : isServicesOnly
                          ? `Book Service • ₹${payableAmount.toLocaleString('en-IN')}`
                          : `Place Order • ₹${payableAmount.toLocaleString('en-IN')}`}
                      </Text>
                      <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.2} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDownloadProformaQuotation}
                      style={[styles.proformaQuoteBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      activeOpacity={0.8}
                    >
                      <FileSpreadsheet size={15} color={theme.textPrimary} strokeWidth={2} />
                      <Text style={[styles.proformaQuoteBtnText, { color: theme.textPrimary }]}>
                        Export Proforma Quotation (PDF)
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                      {savedForLaterItems.map((item, idx) => (
                        <View
                          key={item.id ? `saved-${item.id}-${idx}` : `saved-item-${item.itemId || 'item'}-${idx}`}
                          style={[styles.savedItemRow, { borderTopColor: theme.borderLight }]}
                        >
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
                              <Text style={[styles.moveToCartText, { color: theme.textPrimary }]}>Move to Cart</Text>
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
            {refreshing ? (
              <OrderHistorySkeleton />
            ) : !isLoggedIn ? (
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
              <View style={{ gap: 14 }}>
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

                    {/* Action Bar (Live Dispatcher Chat + GST Invoice + Cancel) */}
                    <View style={styles.activeActionBar}>
                      <TouchableOpacity
                        onPress={() => setShowDispatcherChat(true)}
                        style={[styles.actionChipBtn, { backgroundColor: '#111111' }]}
                        activeOpacity={0.8}
                      >
                        <MessageSquare size={13} color="#FFFFFF" />
                        <Text style={styles.actionChipBtnText}>Live Dispatch Chat</Text>
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

                      <TouchableOpacity
                        onPress={() => {
                          setOrderToCancel(activeEnRoute);
                          setShowCancelConfirmModal(true);
                        }}
                        style={[styles.actionChipBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1 }]}
                        activeOpacity={0.8}
                      >
                        <X size={13} color="#DC2626" />
                        <Text style={[styles.actionChipBtnText, { color: '#DC2626' }]}>Cancel Dispatch</Text>
                      </TouchableOpacity>
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
                    {deliveries.map((del, idx) => {
                      const isCancelled = cancelledOrderIds.includes(del.id) || del.status === 'Cancelled';
                      return (
                        <View
                          key={del.id ? `${del.id}-${idx}` : (del.orderNumber ? `${del.orderNumber}-${idx}` : `delivery-${idx}`)}
                          style={[styles.deliveryRow, idx > 0 && { borderTopColor: theme.borderLight, borderTopWidth: 1 }]}
                        >
                          <View style={styles.deliveryLeftInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.delMaterialName, { color: theme.textPrimary }]} numberOfLines={1}>
                                {del.materialName}
                              </Text>
                              {isCancelled && (
                                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>CANCELLED</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
                              {del.timestamp} • {isCancelled ? '100% Refund Issued' : del.vehicleNumber}
                            </Text>
                          </View>

                          <View style={styles.deliveryRightInfo}>
                            <Text style={[styles.delAmountText, { color: theme.textPrimary, textDecorationLine: isCancelled ? 'line-through' : 'none' }]}>
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
                      );
                    })}
                  </View>
                </View>
              </View>
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
                  <TextInput
                    value={promoInput}
                    onChangeText={(val) => setPromoInput(val.toUpperCase())}
                    placeholder="Enter coupon code (e.g. BUILD10)"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    style={[
                      styles.promoTextInput,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                      },
                    ]}
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
                  ].map((c, idx) => (
                    <View
                      key={`coupon-${c.code}-${idx}`}
                      style={[styles.offerCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                    >
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

        {/* Order Checkout: Delivery Address & Order Review Modal (Flipkart / Amazon Style) */}
        <Modal
          visible={showCheckoutModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCheckoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowCheckoutModal(false)}
            />
            <View style={[styles.checkoutModalCard, { backgroundColor: theme.surface }]}>
              {/* Header */}
              <View style={[styles.checkoutModalHeader, { borderBottomColor: theme.border }]}>
                <View style={styles.checkoutModalHeaderLeft}>
                  <Text style={[styles.checkoutModalTitle, { color: theme.textPrimary }]}>
                    Select Delivery Address
                  </Text>
                  <Text style={[styles.checkoutModalSubtitle, { color: theme.textSecondary }]}>
                    Step 1 of 2: Confirm Site Destination
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCheckoutModal(false)}
                  style={[styles.checkoutCloseBtn, { backgroundColor: theme.surfaceSecondary }]}
                  accessibilityLabel="Close Checkout"
                >
                  <X size={18} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Progress Stepper Bar */}
              <View style={[styles.checkoutStepperBar, { backgroundColor: theme.surfaceSecondary, borderBottomColor: theme.borderLight }]}>
                <View style={styles.checkoutStepItem}>
                  <View style={[styles.checkoutStepDotActive, { backgroundColor: theme.primary }]}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.checkoutStepTextActive, { color: theme.primary }]}>
                    1. Address
                  </Text>
                </View>
                <View style={[styles.checkoutStepLine, { backgroundColor: theme.border }]} />
                <View style={styles.checkoutStepItem}>
                  <View style={[styles.checkoutStepDotPending, { borderColor: theme.textMuted }]}>
                    <Text style={[styles.checkoutStepNumText, { color: theme.textMuted }]}>2</Text>
                  </View>
                  <Text style={[styles.checkoutStepTextPending, { color: theme.textMuted }]}>
                    2. Payment
                  </Text>
                </View>
              </View>

              <ScrollView
                style={styles.checkoutModalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 160 }}
              >
                {/* Saved Addresses Section */}
                <View style={styles.checkoutSection}>
                  <View style={styles.sectionHeaderRow}>
                    <MapPin size={16} color={theme.primary} />
                    <Text style={[styles.checkoutSectionTitle, { color: theme.textPrimary }]}>
                      Saved Site Addresses
                    </Text>
                  </View>

                  <View style={styles.addressesListContainer}>
                    {availableAddresses.map((addr, idx) => {
                      const isSelected = selectedCheckoutAddress === addr;
                      const parts = addr.split(',');
                      const primaryLine = parts[0]?.trim() || 'Site Location';
                      const secondaryLine = parts.slice(1).join(',').trim();

                      return (
                        <TouchableOpacity
                          key={`checkout-addr-${idx}`}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedCheckoutAddress(addr);
                            soundService.playTap();
                          }}
                          style={[
                            styles.addressSelectCard,
                            {
                              backgroundColor: isSelected
                                ? (theme.mode === 'dark' ? '#1E293B' : '#F0F9FF')
                                : theme.surfaceSecondary,
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <View style={styles.addressCardRadioRow}>
                            <View
                              style={[
                                styles.radioCircle,
                                {
                                  borderColor: isSelected ? theme.primary : theme.textMuted,
                                },
                              ]}
                            >
                              {isSelected && (
                                <View
                                  style={[
                                    styles.radioCircleInner,
                                    { backgroundColor: theme.primary },
                                  ]}
                                />
                              )}
                            </View>

                            <View style={styles.addressInfoCol}>
                              <View style={styles.addressNameTagRow}>
                                <Text
                                  style={[
                                    styles.addressPrimaryName,
                                    { color: theme.textPrimary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {primaryLine}
                                </Text>
                                <View
                                  style={[
                                    styles.addressTypeBadge,
                                    {
                                      backgroundColor: isSelected
                                        ? theme.primary
                                        : (theme.mode === 'dark' ? '#334155' : '#E2E8F0'),
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.addressTypeBadgeText,
                                      {
                                        color: isSelected ? '#FFFFFF' : theme.textSecondary,
                                      },
                                    ]}
                                  >
                                    {idx === 0 ? 'DEFAULT SITE' : 'CONSTRUCTION SITE'}
                                  </Text>
                                </View>
                              </View>

                              {secondaryLine ? (
                                <Text
                                  style={[styles.addressSecondaryText, { color: theme.textSecondary }]}
                                  numberOfLines={2}
                                >
                                  {secondaryLine}
                                </Text>
                              ) : null}

                              <View style={styles.contactDetailsRow}>
                                <Text style={[styles.contactName, { color: theme.textSecondary }]}>
                                  Recipient: <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{user?.name || 'Site Incharge'}</Text>
                                </Text>
                                <Text style={[styles.contactDot, { color: theme.textMuted }]}>•</Text>
                                <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                                  +91 {user?.phone?.replace(/\D/g, '') || '98480 12345'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Add New Delivery Address Toggle & Form */}
                <View style={styles.checkoutSection}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setIsAddingNewAddress(!isAddingNewAddress)}
                    style={[
                      styles.addNewAddressToggleBtn,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: isAddingNewAddress ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.addNewAddressToggleLeft}>
                      <Plus size={16} color={theme.primary} strokeWidth={2.5} />
                      <Text style={[styles.addNewAddressToggleText, { color: theme.primary }]}>
                        Add New Delivery Address
                      </Text>
                    </View>
                    {isAddingNewAddress ? (
                      <ChevronUp size={18} color={theme.primary} />
                    ) : (
                      <ChevronDown size={18} color={theme.textSecondary} />
                    )}
                  </TouchableOpacity>

                  {isAddingNewAddress && (
                    <View style={[styles.newAddressFormBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      {addrFormError && (
                        <View style={styles.formErrorBox}>
                          <AlertTriangle size={14} color="#EF4444" />
                          <Text style={styles.formErrorText}>{addrFormError}</Text>
                        </View>
                      )}

                      <View style={styles.formRow}>
                        <View style={styles.formCol}>
                          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                            Full Name / Site Incharge *
                          </Text>
                          <TextInput
                            value={newAddrName}
                            onChangeText={(t) => {
                              setNewAddrName(t);
                              setAddrFormError(null);
                            }}
                            placeholder="e.g. Ramesh Reddy"
                            placeholderTextColor={theme.textMuted}
                            style={[
                              styles.formTextInput,
                              {
                                backgroundColor: theme.surfaceSecondary,
                                borderColor: theme.border,
                                color: theme.textPrimary,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.formCol}>
                          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                            10-Digit Mobile *
                          </Text>
                          <TextInput
                            value={newAddrPhone}
                            onChangeText={(t) => {
                              setNewAddrPhone(t.replace(/\D/g, '').slice(0, 10));
                              setAddrFormError(null);
                            }}
                            placeholder="98480 12345"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="phone-pad"
                            maxLength={10}
                            style={[
                              styles.formTextInput,
                              {
                                backgroundColor: theme.surfaceSecondary,
                                borderColor: theme.border,
                                color: theme.textPrimary,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.formCol}>
                          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                            Pincode (6-Digit) *
                          </Text>
                          <TextInput
                            value={newAddrPincode}
                            onChangeText={handlePincodeChange}
                            onBlur={handlePincodeBlur}
                            placeholder="500081"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            maxLength={6}
                            style={[
                              styles.formTextInput,
                              {
                                backgroundColor: theme.surfaceSecondary,
                                borderColor: theme.border,
                                color: theme.textPrimary,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.formCol}>
                          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                            City & State
                          </Text>
                          <TextInput
                            value={`${newAddrCity}, ${newAddrState}`}
                            editable={false}
                            style={[
                              styles.formTextInput,
                              {
                                backgroundColor: theme.surfaceSecondary,
                                borderColor: theme.border,
                                color: theme.textSecondary,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      <View style={styles.formColSingle}>
                        <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                          Plot / Flat / Building / Site Name *
                        </Text>
                        <TextInput
                          value={newAddrFlat}
                          onChangeText={(t) => {
                            setNewAddrFlat(t);
                            setAddrFormError(null);
                          }}
                          placeholder="Plot 42, Skyview Enclave"
                          placeholderTextColor={theme.textMuted}
                          style={[
                            styles.formTextInput,
                            {
                              backgroundColor: theme.surfaceSecondary,
                              borderColor: theme.border,
                              color: theme.textPrimary,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.formColSingle}>
                        <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                          Street / Colony / Landmark *
                        </Text>
                        <TextInput
                          value={newAddrStreet}
                          onChangeText={(t) => {
                            setNewAddrStreet(t);
                            setAddrFormError(null);
                          }}
                          placeholder="Financial District Main Road, Near ORR Exit"
                          placeholderTextColor={theme.textMuted}
                          style={[
                            styles.formTextInput,
                            {
                              backgroundColor: theme.surfaceSecondary,
                              borderColor: theme.border,
                              color: theme.textPrimary,
                            },
                          ]}
                        />
                      </View>

                      {/* Address Type Chips */}
                      <View style={styles.formColSingle}>
                        <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                          Address Type
                        </Text>
                        <View style={styles.typeChipsRow}>
                          {(['Site', 'Home', 'Office', 'Warehouse'] as const).map((typ) => (
                            <TouchableOpacity
                              key={typ}
                              onPress={() => setNewAddrType(typ)}
                              style={[
                                styles.typeChip,
                                {
                                  backgroundColor:
                                    newAddrType === typ ? theme.primary : theme.surfaceSecondary,
                                  borderColor:
                                    newAddrType === typ ? theme.primary : theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.typeChipText,
                                  {
                                    color: newAddrType === typ ? '#FFFFFF' : theme.textPrimary,
                                    fontWeight: newAddrType === typ ? '700' : '500',
                                  },
                                ]}
                              >
                                {typ === 'Site' ? 'Construction Site' : typ}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleSaveAndSelectNewAddress}
                        style={[styles.saveNewAddressBtn, { backgroundColor: theme.primary }]}
                      >
                        <Text style={styles.saveNewAddressBtnText}>
                          Save & Deliver to this Address
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* B2B GSTIN Input for Input Tax Credit (ITC) */}
                <View style={[styles.checkoutSection, { marginTop: 12 }]}>
                  <View style={styles.sectionHeaderRow}>
                    <FileCheck2 size={16} color={theme.primary} />
                    <Text style={[styles.checkoutSectionTitle, { color: theme.textPrimary }]}>
                      B2B GSTIN / Input Tax Credit (Optional)
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.newAddressFormBox,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: gstinError ? '#EF4444' : checkoutGstin.length === 15 ? '#10B981' : theme.border,
                        marginTop: 4,
                      },
                    ]}
                  >
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                      Company GSTIN (15 Characters)
                    </Text>
                    <TextInput
                      value={checkoutGstin}
                      onChangeText={(t) => {
                        const val = t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                        setCheckoutGstin(val);
                        if (val.length === 15) {
                          const res = validateGSTIN(val);
                          if (!res.isValid) {
                            setGstinError(res.errorMessage || 'Invalid Telangana GSTIN format');
                          } else {
                            setGstinError(null);
                          }
                        } else if (val.length > 0) {
                          setGstinError('GSTIN must be 15 characters (e.g. 36AAACU9812A1Z4)');
                        } else {
                          setGstinError(null);
                        }
                      }}
                      placeholder="e.g. 36AAACU9812A1Z4"
                      placeholderTextColor={theme.textMuted}
                      maxLength={15}
                      autoCapitalize="characters"
                      style={[
                        styles.formTextInput,
                        {
                          backgroundColor: theme.surface,
                          borderColor: gstinError ? '#EF4444' : checkoutGstin.length === 15 ? '#10B981' : theme.border,
                          color: theme.textPrimary,
                          fontFamily: typography.fontFamilyMono || 'monospace',
                          letterSpacing: 1,
                        },
                      ]}
                    />
                    {gstinError ? (
                      <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{gstinError}</Text>
                    ) : checkoutGstin.length === 15 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Check size={12} color="#10B981" strokeWidth={2.5} />
                        <Text style={{ fontSize: 11.5, color: '#10B981', fontWeight: '600' }}>
                          Verified Telangana GSTIN (18% ITC Eligible on Tax Invoice)
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                        Enter GSTIN to receive an official B2B GST tax invoice with full ITC credit.
                      </Text>
                    )}
                  </View>
                </View>

                {/* Order Summary Preview (Flipkart / Amazon Style) */}
                <View
                  style={[
                    styles.checkoutOrderSummaryCard,
                    { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.checkoutSummaryTitle, { color: theme.textPrimary }]}>
                    Order Price Breakdown ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                  </Text>

                  <View style={styles.checkoutSummaryRow}>
                    <Text style={[styles.checkoutSummaryLabel, { color: theme.textSecondary }]}>
                      Subtotal
                    </Text>
                    <Text style={[styles.checkoutSummaryVal, { color: theme.textPrimary }]}>
                      ₹{subtotal.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.checkoutSummaryRow}>
                    <Text style={[styles.checkoutSummaryLabel, { color: theme.textSecondary }]}>
                      Direct Yard Freight ({deliveryDistanceKm} km)
                    </Text>
                    <Text
                      style={[
                        styles.checkoutSummaryVal,
                        { color: deliveryCharge === 0 ? '#10B981' : theme.textPrimary },
                      ]}
                    >
                      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                    </Text>
                  </View>

                  {couponDiscount > 0 && (
                    <View style={styles.checkoutSummaryRow}>
                      <Text style={[styles.checkoutSummaryLabel, { color: '#10B981' }]}>
                        Contractor Coupon ({appliedCoupon})
                      </Text>
                      <Text style={[styles.checkoutSummaryVal, { color: '#10B981' }]}>
                        -₹{couponDiscount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.checkoutSummaryRow}>
                    <Text style={[styles.checkoutSummaryLabel, { color: theme.textSecondary }]}>
                      GST Tax (18% Input Tax Credit)
                    </Text>
                    <Text style={[styles.checkoutSummaryVal, { color: theme.textPrimary }]}>
                      ₹{gstTax.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={[styles.checkoutTotalRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.checkoutTotalLabel, { color: theme.textPrimary }]}>
                      Total Payable
                    </Text>
                    <Text style={[styles.checkoutTotalVal, { color: theme.primary }]}>
                      ₹{payableAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Proforma Quotation PDF Export Option */}
                  <TouchableOpacity
                    onPress={handleDownloadProformaQuotation}
                    style={[
                      styles.checkoutProformaBtn,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    ]}
                    activeOpacity={0.8}
                  >
                    <FileSpreadsheet size={14} color={theme.textPrimary} strokeWidth={2} />
                    <Text style={[styles.checkoutProformaBtnText, { color: theme.textPrimary }]}>
                      Export Formal Proforma Quotation (PDF)
                    </Text>
                    <Download size={13} color={theme.textSecondary} />
                  </TouchableOpacity>

                  <View style={styles.trustBadgeRow}>
                    <ShieldCheck size={14} color="#10B981" />
                    <Text style={[styles.trustBadgeText, { color: theme.textSecondary }]}>
                      100% Secure Checkout • Verified Yard Dispatch
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Sticky Action Footer */}
              <View style={[styles.checkoutModalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <View style={styles.checkoutFooterLeft}>
                  <Text style={[styles.checkoutFooterTotalLabel, { color: theme.textSecondary }]}>
                    Total Amount
                  </Text>
                  <Text style={[styles.checkoutFooterAmount, { color: theme.textPrimary }]}>
                    ₹{payableAmount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirmAddressAndProceedToPay}
                  style={[styles.checkoutProceedBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.checkoutProceedBtnText}>
                    Deliver Here & Pay
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Razorpay Modal */}
        {showRazorpayModal && (
          <RazorpayModal
            visible={showRazorpayModal}
            onClose={() => {
              setShowRazorpayModal(false);
              setIsPlacingOrder(false);
              showToast('Payment window closed. Your items are safe in your cart.', 'info');
            }}
            amount={payableAmount}
            userName={user?.name}
            userPhone={user?.phone}
            userEmail={user?.email}
            orderDescription={
              isServicesOnly
                ? `${serviceItems[0]?.itemName || 'Trade Service'} Booking - Urbanico`
                : `Booking (${cartItems.length} items) - Urbanico Supply`
            }
            selectedLocation={selectedCheckoutAddress || activeLocation}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={(err) => {
              setPaymentError(err);
              setIsPlacingOrder(false);
              showToast(err || 'Payment was not completed. Please try again.', 'error');
            }}
          />
        )}

        {/* Payment Success Confirmation Receipt Screen */}
        {showSuccessModal && (
          <PaymentSuccessModal
            visible={showSuccessModal}
            paymentResult={latestPaymentResult}
            selectedLocation={activeLocation}
            onClose={() => {
              setShowSuccessModal(false);
              setActiveTab('history');
            }}
            onTrackOrder={() => {
              setShowSuccessModal(false);
              setActiveTab('history');
            }}
            onContinueShopping={() => {
              setShowSuccessModal(false);
              onNavigateScreen('home');
            }}
            onViewInvoice={() => {
              setShowSuccessModal(false);
              setActiveTab('history');
              const targetOrder = createdOrderRef.current || deliveries[0];
              if (onViewInvoice && targetOrder) {
                onViewInvoice(targetOrder);
              }
            }}
          />
        )}

        {/* Live Dispatcher Chat Modal */}
        {showDispatcherChat && (
          <LiveDispatcherChatModal
            visible={showDispatcherChat}
            onClose={() => setShowDispatcherChat(false)}
            orderNumber={activeEnRoute?.orderNumber}
            driverName={activeEnRoute?.driverName}
            driverPhone={activeEnRoute?.driverPhone}
          />
        )}

        {/* Weighbridge Scan Modal */}
        {showWeighbridgeScan && (
          <WeighbridgeScanModal
            visible={showWeighbridgeScan}
            onClose={() => setShowWeighbridgeScan(false)}
            orderNumber={activeEnRoute?.orderNumber}
            expectedTons={totalWeightTons || 10.0}
          />
        )}

        {/* Supervisor Handoff Modal */}
        {showSupervisorModal && (
          <SupervisorHandoffModal
            visible={showSupervisorModal}
            onClose={() => setShowSupervisorModal(false)}
            orderNumber={activeEnRoute?.orderNumber}
            currentSupervisorName={activeSupervisor.name}
            currentSupervisorPhone={activeSupervisor.phone}
            onSaveSupervisor={(name, phone) => setActiveSupervisor({ name, phone })}
          />
        )}

        {/* Order Cancellation Guard Confirmation Modal */}
        <Modal
          visible={showCancelConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCancelConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowCancelConfirmModal(false)} />
            <View style={[styles.cancelConfirmCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.cancelConfirmIconCircle}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
              <Text style={[styles.cancelConfirmTitle, { color: theme.textPrimary }]}>
                Cancel Material Dispatch?
              </Text>
              <Text style={[styles.cancelConfirmMessage, { color: theme.textSecondary }]}>
                Are you sure you want to cancel Dispatch #{orderToCancel?.orderNumber}? Materials may already be loading at the yard onto {orderToCancel?.vehicleNumber}. A 100% refund of ₹{orderToCancel?.totalAmount?.toLocaleString('en-IN')} will be credited back to your payment source within 24-48 hours.
              </Text>
              <View style={styles.cancelConfirmBtnRow}>
                <TouchableOpacity
                  onPress={() => setShowCancelConfirmModal(false)}
                  style={[styles.cancelConfirmDismissBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelConfirmDismissText, { color: theme.textPrimary }]}>Keep Dispatch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmCancelOrder}
                  style={styles.cancelConfirmExecuteBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelConfirmExecuteText}>Yes, Cancel Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
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
    paddingHorizontal: 16,
  },
  nikeCheckoutPillText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  proformaQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  proformaQuoteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  checkoutProformaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  checkoutProformaBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  promoTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 8,
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
  postOrderActionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  postOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postOrderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postOrderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  postOrderHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  postOrderHomeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  postOrderSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  continueShoppingPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  continueShoppingPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  orderSupportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  supportBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  supportBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  supportBoxPhone: {
    fontSize: 10.5,
    marginTop: 1,
  },
  supportChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  supportChatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Checkout Delivery Address Modal Styles (Flipkart / Amazon)
  checkoutModalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
    overflow: 'hidden',
  },
  checkoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  checkoutModalHeaderLeft: {
    flex: 1,
  },
  checkoutModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  checkoutModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  checkoutCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutStepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  checkoutStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkoutStepDotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutStepDotPending: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutStepNumText: {
    fontSize: 10,
    fontWeight: '700',
  },
  checkoutStepTextActive: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkoutStepTextPending: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkoutStepLine: {
    width: 32,
    height: 1.5,
  },
  checkoutModalBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  checkoutSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  checkoutSectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  addressesListContainer: {
    gap: 10,
  },
  addressSelectCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  addressCardRadioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  addressInfoCol: {
    flex: 1,
  },
  addressNameTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  addressPrimaryName: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  addressTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  addressTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  addressSecondaryText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  contactName: {
    fontSize: 11.5,
  },
  contactDot: {
    fontSize: 11,
  },
  contactPhone: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  addNewAddressToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  addNewAddressToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addNewAddressToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  newAddressFormBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
  },
  formErrorText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '500',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
  },
  formColSingle: {
    width: '100%',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  formTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 11,
  },
  saveNewAddressBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNewAddressBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  checkoutOrderSummaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
    gap: 8,
  },
  checkoutSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  checkoutSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutSummaryLabel: {
    fontSize: 12,
  },
  checkoutSummaryVal: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  checkoutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  checkoutTotalLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  checkoutTotalVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  checkoutModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  checkoutFooterLeft: {
    justifyContent: 'center',
  },
  checkoutFooterTotalLabel: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  checkoutFooterAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  checkoutProceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    flex: 1,
  },
  checkoutProceedBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cancelConfirmCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  cancelConfirmIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cancelConfirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cancelConfirmMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelConfirmBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelConfirmDismissBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmDismissText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelConfirmExecuteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmExecuteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
