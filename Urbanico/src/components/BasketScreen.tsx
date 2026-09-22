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
  ActivityIndicator,
} from 'react-native';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Truck,
  Package,
  Check,
  Clock,
  Tag,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
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
  Users,
  Mail,
  CheckCircle2,
  FileText,
  Lock,
  Smartphone,
  ExternalLink,
  CreditCard,
  Building,
  Wallet,
  Percent,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react-native';
import {
  GooglePayIcon,
  PhonePeIcon,
  PaytmIcon,
  CredIcon,
  BhimIcon,
  VisaIcon,
  MastercardIcon,
  RupayIcon,
  AmazonPayIcon,
  MobikwikIcon,
  AirtelIcon,
  FreechargeIcon,
  BankPillIcon,
} from './common/PaymentBrandIcons';
import { CartItem, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { lookupCityStateFromPincode, formatSiteAddress } from '../utils/addressHelper';
import { RazorpayPaymentResult } from './RazorpayModal';
import {
  openRazorpayStandardCheckout,
} from '../services/razorpayService';
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
  evaluateSmartVehicleRecommendation,
  PINCODE_REGISTRY,
} from '../utils/freightCalculator';
import { validateGSTIN, GstinValidationResult } from '../utils/gstinValidator';
import { buildTaxInvoiceData, sendTaxInvoiceEmail } from '../utils/invoiceHelper';
import { openProformaQuotationPrint } from '../utils/proformaQuotationHelper';
import { LiveDispatcherChatModal } from './common/LiveDispatcherChatModal';
import { SupervisorHandoffModal } from './common/SupervisorHandoffModal';

export type PaymentMethodType = 'online' | 'pod' | 'upi_app' | 'upi_vpa' | 'card' | 'netbanking' | 'wallet' | 'emi';

export const POPULAR_BANKS = [
  { code: 'HDFC', name: 'HDFC Bank', color: '#004C8F' },
  { code: 'SBIN', name: 'SBI', color: '#280071' },
  { code: 'ICIC', name: 'ICICI Bank', color: '#F58220' },
  { code: 'UTIB', name: 'Axis Bank', color: '#97144D' },
  { code: 'KKBK', name: 'Kotak Bank', color: '#ED1C24' },
  { code: 'PUNB', name: 'PNB', color: '#A21D22' },
];

export const OTHER_BANKS = [
  { code: 'BARB_R', name: 'Bank of Baroda' },
  { code: 'CNRB', name: 'Canara Bank' },
  { code: 'UBIN', name: 'Union Bank of India' },
  { code: 'INDB', name: 'IndusInd Bank' },
  { code: 'FDRL', name: 'Federal Bank' },
  { code: 'IDFB', name: 'IDFC FIRST Bank' },
  { code: 'YESB', name: 'Yes Bank' },
  { code: 'CBIN', name: 'Central Bank of India' },
  { code: 'IDIB', name: 'Indian Bank' },
  { code: 'BKID', name: 'Bank of India' },
];

export const WALLET_OPTIONS = [
  { code: 'paytm', name: 'Paytm' },
  { code: 'phonepe', name: 'PhonePe' },
  { code: 'amazonpay', name: 'Amazon Pay' },
  { code: 'mobikwik', name: 'MobiKwik' },
  { code: 'freecharge', name: 'Freecharge' },
  { code: 'airtelmoney', name: 'Airtel Money' },
];

export const EMI_PLANS = [
  { tenure: 3, label: '3 Months', interestRate: 0, tag: '' },
  { tenure: 6, label: '6 Months', interestRate: 13, tag: '' },
  { tenure: 9, label: '9 Months', interestRate: 14, tag: '' },
  { tenure: 12, label: '12 Months', interestRate: 15, tag: '' },
];

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
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart');
  const [refreshing, setRefreshing] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const createdOrderRef = React.useRef<ActivityDelivery | null>(null);
  const scrollViewRef = React.useRef<any>(null);

  // Checkout Delivery Address Selection Modal (Flipkart / Amazon Style)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCheckoutAddress, setSelectedCheckoutAddress] = useState<string>(activeLocation);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isChangingAddress, setIsChangingAddress] = useState(false);

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
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cartItems.length]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Coupons & Promo state
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [promoInput, setPromoInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  // Modals for live dispatcher, supervisor handoff
  const [showDispatcherChat, setShowDispatcherChat] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [activeSupervisor, setActiveSupervisor] = useState({
    name: user?.name || 'Site Incharge',
    phone: user?.phone?.replace(/\D/g, '').slice(-10) || '',
  });

  // Extract active pincode from delivery address dynamically (defaults to 500081)
  const currentAddressStr = selectedCheckoutAddress || activeLocation || '';
  const detectedPincodeMatch = currentAddressStr.match(/\b(50[0-9]{4})\b/);
  const activePincode = detectedPincodeMatch ? detectedPincodeMatch[1] : '500081';

  // Dynamic Freight from Central Hub with smart vehicle tiering & recommendation
  const totalWeightTons = estimateTotalWeightTons(cartItems);
  const freightInfo = calculateDynamicFreight(activePincode, totalWeightTons);
  const smartRecommendation = evaluateSmartVehicleRecommendation(cartItems, totalWeightTons);

  // Optional Labor Assistance for Unloading Materials
  const [optInLaborAssistance, setOptInLaborAssistance] = useState(false);
  const unloadingLaborFee = optInLaborAssistance ? smartRecommendation.unloadingAssistance.fee : 0;

  // Amazon/Flipkart Multi-Method Payment States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [latestPaymentResult, setLatestPaymentResult] = useState<RazorpayPaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentFailure, setPaymentFailure] = useState<{
    status: 'failed' | 'cancelled' | 'error';
    reason: string;
    timestamp: string;
    attemptCount: number;
  } | null>(null);
  const [retryAttemptCount, setRetryAttemptCount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('online');

  // Check URL query parameters for payment status callback (redirection flow)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment_status');
      const errorMsg = params.get('error') || params.get('error_description');
      if (paymentStatus === 'failed' || paymentStatus === 'error') {
        setCheckoutStep('payment');
        setPaymentFailure({
          status: 'failed',
          reason: errorMsg || 'Transaction was declined or interrupted by the bank gateway.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          attemptCount: 1,
        });
      } else if (paymentStatus === 'cancelled') {
        setCheckoutStep('payment');
        setPaymentFailure({
          status: 'cancelled',
          reason: 'Payment process was cancelled or closed. Your cart and delivery details remain safely saved.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          attemptCount: 1,
        });
      }
    } catch (e) {
      console.warn('URL payment status parser log:', e);
    }
  }, []);
  const [selectedUpiApp, setSelectedUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'cred' | 'bhim'>('phonepe');
  const [customUpiId, setCustomUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [saveCardSecurely, setSaveCardSecurely] = useState(true);
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [showOtherBanksPicker, setShowOtherBanksPicker] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('paytm');
  const [selectedEmiTenure, setSelectedEmiTenure] = useState(3);

  const handleCardNumberChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleCardExpiryChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const detectedCardBrand = (() => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^(60|65|81|82|508)/.test(clean)) return 'rupay';
    return 'generic';
  })();

  // B2B GSTIN input for Tax Invoicing & 18% Input Tax Credit
  const hasProfileGstin = Boolean(user?.gstin && user.gstin.trim().length === 15);
  const [isB2BOpted, setIsB2BOpted] = useState(hasProfileGstin);
  const [checkoutGstin, setCheckoutGstin] = useState(user?.gstin || '');
  const [checkoutBusinessName, setCheckoutBusinessName] = useState(user?.companyName || '');
  const [checkoutInvoiceEmail, setCheckoutInvoiceEmail] = useState(user?.email || '');
  const [isEditingCustomGstin, setIsEditingCustomGstin] = useState(false);
  const [gstinValidation, setGstinValidation] = useState<GstinValidationResult | null>(() => {
    return user?.gstin ? validateGSTIN(user.gstin) : null;
  });
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Synchronize if user profile updates
  useEffect(() => {
    if (user?.gstin && user.gstin.trim().length === 15) {
      setCheckoutGstin(user.gstin.trim().toUpperCase());
      setIsB2BOpted(true);
      setGstinValidation(validateGSTIN(user.gstin.trim()));
      setGstinError(null);
    }
  }, [user?.gstin]);

  const handleGstinInputChange = (text: string) => {
    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setCheckoutGstin(clean);
    if (clean.length === 15) {
      const res = validateGSTIN(clean);
      setGstinValidation(res);
      if (res.isValid) {
        setGstinError(null);
        if (res.info?.tradeName && !checkoutBusinessName) {
          setCheckoutBusinessName(res.info.tradeName);
        }
      } else {
        setGstinError(res.errorMessage || 'Invalid GST number');
      }
    } else {
      setGstinValidation(null);
      if (clean.length > 0) {
        setGstinError(`${15 - clean.length} characters remaining`);
      } else {
        setGstinError(null);
      }
    }
  };

  const renderAddressSelectionSection = () => {
    const currentAddr = selectedCheckoutAddress || availableAddresses[0] || activeLocation;
    const parts = currentAddr.split(',');
    const primaryLine = parts[0]?.trim() || 'Site Location';
    const secondaryLine = parts.slice(1).join(',').trim();

    return (
      <View
        style={[
          styles.addressSelectionCardContainer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            marginBottom: 10,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color={theme.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
              Delivery Destination
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              soundService.playTap();
              setIsChangingAddress(!isChangingAddress);
            }}
            activeOpacity={0.7}
            style={{
              paddingVertical: 3,
              paddingHorizontal: 9,
              borderRadius: 6,
              backgroundColor: isChangingAddress ? theme.primary : theme.surfaceSecondary,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: isChangingAddress ? '#FFFFFF' : theme.primary,
              }}
            >
              {isChangingAddress ? 'Done' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected / Default Address Summary Card */}
        <View
          style={[
            styles.addressSelectCard,
            {
              backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F0F9FF',
              borderColor: theme.primary,
              marginBottom: isChangingAddress ? 10 : 0,
            },
          ]}
        >
          <View style={styles.addressCardRadioRow}>
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
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.addressTypeBadgeText,
                      { color: '#FFFFFF' },
                    ]}
                  >
                    DELIVERY SITE
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
        </View>

        {/* Alternate addresses list when user taps Change */}
        {isChangingAddress && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, marginBottom: 8, letterSpacing: 0.5 }}>
              SELECT AN ALTERNATE ADDRESS
            </Text>
            <View style={styles.addressesListContainer}>
              {availableAddresses.map((addr, idx) => {
                const isSelected = selectedCheckoutAddress === addr;
                const aParts = addr.split(',');
                const aPrimaryLine = aParts[0]?.trim() || 'Site Location';
                const aSecondaryLine = aParts.slice(1).join(',').trim();

                return (
                  <TouchableOpacity
                    key={`cart-inline-addr-${idx}`}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedCheckoutAddress(addr);
                      setSelectedLocation(addr);
                      setIsChangingAddress(false);
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
                            {aPrimaryLine}
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

                        {aSecondaryLine ? (
                          <Text
                            style={[styles.addressSecondaryText, { color: theme.textSecondary }]}
                            numberOfLines={2}
                          >
                            {aSecondaryLine}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add New Address Button inside Inline section */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsAddingNewAddress(!isAddingNewAddress)}
              style={[
                styles.addNewAddressToggleBtn,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: isAddingNewAddress ? theme.primary : theme.border,
                  marginTop: 8,
                },
              ]}
            >
              <View style={styles.addNewAddressToggleLeft}>
                <Plus size={15} color={theme.primary} strokeWidth={2.5} />
                <Text style={[styles.addNewAddressToggleText, { color: theme.primary, fontSize: 12.5 }]}>
                  Add New Delivery Site Address
                </Text>
              </View>
              {isAddingNewAddress ? (
                <ChevronUp size={16} color={theme.primary} />
              ) : (
                <ChevronDown size={16} color={theme.textSecondary} />
              )}
            </TouchableOpacity>

            {isAddingNewAddress && (
              <View style={[styles.newAddressFormBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 8 }]}>
                {Boolean(addrFormError) && (
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
                          backgroundColor: theme.surface,
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
                          backgroundColor: theme.surface,
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
                          backgroundColor: theme.surface,
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
                          backgroundColor: theme.surface,
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
                        backgroundColor: theme.surface,
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
                        backgroundColor: theme.surface,
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
                              newAddrType === typ ? theme.primary : theme.surface,
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
                  style={[styles.saveNewAddressBtn, { backgroundColor: theme.primary, marginTop: 4 }]}
                >
                  <Text style={styles.saveNewAddressBtnText}>
                    Save & Deliver to this Address
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderB2BGstinCard = (isModalView: boolean = false) => {
    // If user has a saved GSTIN in their profile, show minimal saved-state view unless they explicitly choose to change it
    if (hasProfileGstin && !isEditingCustomGstin) {
      return (
        <View
          style={[
            styles.laborAssistanceCard,
            {
              backgroundColor: isB2BOpted
                ? (theme.mode === 'dark' ? '#064E3B20' : '#ECFDF5')
                : (isModalView ? theme.surfaceSecondary : theme.surface),
              borderColor: isB2BOpted ? '#10B981' : theme.border,
              marginTop: isModalView ? 8 : 4,
              marginBottom: isModalView ? 8 : 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                soundService.playTap();
                setIsB2BOpted(!isB2BOpted);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10, marginRight: 8 }}
            >
              <View
                style={[
                  styles.laborCheckboxCircle,
                  {
                    backgroundColor: isB2BOpted ? '#10B981' : 'transparent',
                    borderColor: isB2BOpted ? '#10B981' : theme.textMuted,
                  },
                ]}
              >
                {isB2BOpted ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                    GSTIN: <Text style={{ fontFamily: typography.fontFamilyMono || 'monospace', color: isB2BOpted ? '#059669' : theme.textPrimary }}>{user?.gstin}</Text>
                  </Text>
                  {isB2BOpted && (
                    <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#065F46' }}>Profile Saved</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }} numberOfLines={1}>
                  {isB2BOpted ? 'Using Profile GSTIN • 18% Tax Invoice' : 'Tap to apply GSTIN for tax invoice'}
                </Text>
              </View>
            </TouchableOpacity>

            {isB2BOpted && (
              <TouchableOpacity
                onPress={() => {
                  soundService.playTap();
                  setIsEditingCustomGstin(true);
                }}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: theme.primary }}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // Otherwise (or when customer tapped Change): Minimalist 15-digit GSTIN input
    return (
      <View
        style={[
          styles.laborAssistanceCard,
          {
            backgroundColor: isB2BOpted
              ? (theme.mode === 'dark' ? '#064E3B20' : '#ECFDF5')
              : (isModalView ? theme.surfaceSecondary : theme.surface),
            borderColor: isB2BOpted ? '#10B981' : theme.border,
            marginTop: isModalView ? 8 : 4,
            marginBottom: isModalView ? 8 : 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            soundService.playTap();
            setIsB2BOpted(!isB2BOpted);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
            <View
              style={[
                styles.laborCheckboxCircle,
                {
                  backgroundColor: isB2BOpted ? '#10B981' : 'transparent',
                  borderColor: isB2BOpted ? '#10B981' : theme.textMuted,
                },
              ]}
            >
              {isB2BOpted ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                  Business GSTIN
                </Text>
                <View
                  style={[
                    styles.laborBadgePill,
                    { backgroundColor: isB2BOpted ? '#D1FAE5' : '#F1F5F9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.laborBadgePillText,
                      { color: isB2BOpted ? '#065F46' : '#475569' },
                    ]}
                  >
                    Optional
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }} numberOfLines={1}>
                {isB2BOpted && gstinValidation?.isValid
                  ? `✓ Valid (${gstinValidation.stateName}) • 18% Tax Invoice`
                  : 'Enter 15-digit GSTIN for company billing'}
              </Text>
            </View>
          </View>

          {hasProfileGstin && isEditingCustomGstin && (
            <TouchableOpacity
              onPress={() => {
                soundService.playTap();
                setIsEditingCustomGstin(false);
                setCheckoutGstin(user?.gstin || '');
                setGstinValidation(user?.gstin ? validateGSTIN(user.gstin) : null);
                setGstinError(null);
              }}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.primary }}>Use Profile</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {isB2BOpted && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
            <TextInput
              value={checkoutGstin}
              onChangeText={handleGstinInputChange}
              placeholder="Enter 15-digit GSTIN (e.g. 36AAACU9812A1Z4)"
              placeholderTextColor={theme.textMuted}
              maxLength={15}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[
                styles.formTextInput,
                {
                  height: 38,
                  backgroundColor: theme.mode === 'dark' ? '#0F172A' : '#FFFFFF',
                  borderColor: gstinError
                    ? '#EF4444'
                    : gstinValidation?.isValid
                    ? '#10B981'
                    : theme.border,
                  color: theme.textPrimary,
                  fontFamily: typography.fontFamilyMono || 'monospace',
                  letterSpacing: 1.1,
                  fontWeight: '700',
                  fontSize: 12.5,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                },
              ]}
            />
            {gstinError ? (
              <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: '600' }}>
                ⚠️ {gstinError}
              </Text>
            ) : gstinValidation?.isValid ? (
              <Text style={{ fontSize: 11, color: '#059669', marginTop: 4, fontWeight: '600' }}>
                ✓ Valid GSTIN ({gstinValidation.stateName}) • 18% Input Tax Credit
              </Text>
            ) : checkoutGstin.length > 0 ? (
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                {15 - checkoutGstin.length} characters remaining
              </Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const renderPromoCard = (isModalView: boolean = false) => {
    if (isServicesOnly) return null;

    return (
      <View
        style={[
          styles.couponCard,
          {
            backgroundColor: appliedCoupon
              ? (theme.mode === 'dark' ? '#064E3B20' : '#ECFDF5')
              : (isModalView ? theme.surfaceSecondary : theme.surface),
            borderColor: appliedCoupon ? '#10B981' : (couponError ? '#EF4444' : theme.border),
            marginTop: isModalView ? 8 : 4,
            marginBottom: isModalView ? 8 : 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
          },
        ]}
      >
        {appliedCoupon ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={13} color="#16A34A" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }} numberOfLines={1}>
                    {appliedCoupon}
                  </Text>
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#15803D' }}>VALID</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600', marginTop: 1 }} numberOfLines={1}>
                  ₹{couponDiscount.toLocaleString('en-IN')} discount applied
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleRemoveCoupon}
              style={{ padding: 6, borderRadius: 6, backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}
              activeOpacity={0.7}
              accessibilityLabel="Remove coupon"
            >
              <X size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Tag size={13} color={theme.textSecondary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary }}>
                  Apply Coupon
                </Text>
              </View>
              {couponError ? (
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#EF4444' }}>
                  Invalid
                </Text>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <TextInput
                value={promoInput}
                onChangeText={(val) => {
                  setPromoInput(val.toUpperCase());
                  if (couponError) setCouponError(null);
                }}
                placeholder="Enter coupon code"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                style={{
                  flex: 1,
                  height: 36,
                  borderWidth: 1,
                  borderColor: couponError ? '#EF4444' : theme.border,
                  backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  fontSize: 12,
                  fontFamily: typography.fontFamilyMono || 'monospace',
                  color: theme.textPrimary,
                }}
              />
              <TouchableOpacity
                onPress={() => handleApplyCoupon(promoInput)}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: promoInput.trim() ? '#111111' : (theme.mode === 'dark' ? '#334155' : '#E2E8F0'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={!promoInput.trim()}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: promoInput.trim() ? '#FFFFFF' : theme.textMuted,
                  }}
                >
                  Apply
                </Text>
              </TouchableOpacity>
            </View>

            {couponError && (
              <Text style={{ fontSize: 10.5, color: '#EF4444', marginTop: 1 }}>
                ⚠️ Invalid coupon code
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

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
    unloadingCharge,
    grandTotal,
  } = calculateCartTotals(
    cartItems,
    couponDiscount,
    deliveryDistanceKm,
    freightInfo.deliveryCharge,
    unloadingLaborFee
  );

  const payableAmount = grandTotal;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleSaveForLater = (item: CartItem) => {
    onRemoveItem(item.id);
    const updated = [...savedForLaterItems.filter((i) => i.id !== item.id), item];
    setSavedForLaterItems(updated);
    try {
      safeStorage.setItem('urbanico_saved_for_later', JSON.stringify(updated));
      syncManager.broadcast('SAVED_FOR_LATER_UPDATED', updated);
    } catch {}
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
  };

  // Saved Delivery Addresses list (E-commerce Flipkart / Amazon style)
  const availableAddresses: string[] = Array.from(
    new Set([
      activeLocation,
      ...(isLoggedIn ? savedLocations : []),
    ].filter((l) => Boolean(l) && !l.includes('Miyapur Site, Phase 2') && !l.includes('Gachibowli Site 4') && !l.includes('Hitech City Commercial Tower')))
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
    setIsChangingAddress(false);
    setAddrFormError(null);
    showToast('New delivery address added and selected!', 'success');
  };

  const handleConfirmCancelOrder = () => {
    if (!orderToCancel) return;
    setCancelledOrderIds((prev) => [...prev, orderToCancel.id]);
    showToast(`Order #${orderToCancel.orderNumber} cancelled. Refund of ₹${orderToCancel.totalAmount.toLocaleString('en-IN')} initiated to your source account.`, 'info');
    setShowCancelConfirmModal(false);
    setOrderToCancel(null);
  };

  const handleStartCheckout = async () => {
    if (isB2BOpted) {
      const activeGstin = checkoutGstin.trim() || (user?.gstin || '').trim();
      if (!activeGstin) {
        setGstinError('Please enter a valid 15-digit GSTIN or uncheck GSTIN');
        showToast('Please enter your 15-digit GSTIN or uncheck GSTIN', 'error');
        return;
      }
      const validation = validateGSTIN(activeGstin);
      if (!validation.isValid) {
        setGstinError(validation.errorMessage || 'Invalid GST number');
        showToast(validation.errorMessage || 'Please enter a valid 15-digit GSTIN', 'error');
        return;
      }
    }

    setShowSupervisorModal(false);
    setShowDispatcherChat(false);
    setPaymentError(null);
    const chosenAddress = selectedCheckoutAddress || availableAddresses[0] || activeLocation;
    setSelectedLocation(chosenAddress);

    // Extract clean contact information from user profile, address or default (Amazon/Flipkart flow)
    let rawDigits = (
      user?.phone ||
      newAddrPhone ||
      activeSupervisor.phone ||
      '9848012345'
    ).replace(/\D/g, '');
    if (rawDigits.length > 10) rawDigits = rawDigits.slice(-10);
    const cleanPhone = rawDigits.length === 10 ? rawDigits : '9848012345';

    const cleanName = (
      user?.name ||
      newAddrName ||
      activeSupervisor.name ||
      'Site Incharge'
    ).trim();

    const cleanEmail = (
      user?.email ||
      checkoutInvoiceEmail ||
      'customer@urbanico.in'
    ).trim();

    // 1. Pay on Site / Delivery
    if (selectedPaymentMethod === 'pod') {
      setIsPlacingOrder(true);
      setPaymentFailure(null);
      const podPaymentResult: RazorpayPaymentResult = {
        razorpay_payment_id: `pay_pod_${Date.now()}`,
        razorpay_order_id: `ord_pod_${Date.now()}`,
        razorpay_signature: `sig_pod_${Date.now()}`,
        amount: payableAmount,
        method: 'Pay on Site (Cash / RTGS)',
        status: 'success',
      };
      setTimeout(() => {
        setIsPlacingOrder(false);
        handlePaymentSuccess(podPaymentResult);
        showToast('Order confirmed! Pay upon material delivery at site.', 'success');
      }, 500);
      return;
    }

    // 2. Seamless Online Payment via Razorpay Gateway (UPI, Cards, Net Banking, Wallets, EMI)
    setIsPlacingOrder(true);
    try {
      await openRazorpayStandardCheckout({
        amount: payableAmount,
        userName: cleanName,
        userPhone: cleanPhone,
        userEmail: cleanEmail,
        orderDescription: isServicesOnly
          ? `${serviceItems[0]?.itemName || 'Trade Service'} Booking - Urbanico`
          : `Order (${cartItems.length} items) - Urbanico Direct`,
        onSuccess: (result: any) => {
          setIsPlacingOrder(false);
          setPaymentFailure(null);
          handlePaymentSuccess(result);
        },
        onFailure: (err: any) => {
          setIsPlacingOrder(false);
          const rawErr = typeof err === 'string' ? err : (err?.message || 'Payment was declined or failed.');
          setPaymentError(rawErr);
          setRetryAttemptCount((prev) => prev + 1);
          setPaymentFailure({
            status: 'failed',
            reason: rawErr,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            attemptCount: retryAttemptCount + 1,
          });
          showToast(rawErr || 'Payment was not completed. You can retry immediately.', 'error');
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
        },
        onDismiss: () => {
          setIsPlacingOrder(false);
          setRetryAttemptCount((prev) => prev + 1);
          setPaymentFailure({
            status: 'cancelled',
            reason: 'Payment gateway window was closed before completion. Your materials cart is safely preserved.',
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            attemptCount: retryAttemptCount + 1,
          });
          showToast('Payment window closed. Tap "Retry Payment" when ready.', 'info');
        },
      });
    } catch (err: any) {
      setIsPlacingOrder(false);
      const msg = err?.message || 'Unable to open payment gateway';
      setPaymentError(msg);
      setPaymentFailure({
        status: 'error',
        reason: msg,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        attemptCount: retryAttemptCount + 1,
      });
      showToast(msg, 'error');
    }
  };

  const handleConfirmAddressAndProceedToPay = () => {
    setShowCheckoutModal(false);
    handleStartCheckout();
  };

  const handleApplyCoupon = (code: string) => {
    if (isServicesOnly) {
      setCouponError('Coupons are not applicable on trade service visits');
      showToast('Coupons are not applicable on trade service visits', 'error');
      return;
    }

    const clean = code.trim().toUpperCase();
    if (!clean) {
      setCouponError('Please enter a coupon code');
      showToast('Please enter a coupon code', 'error');
      return;
    }

    if (clean === 'URBAN10' || clean === 'SAVE10' || clean === 'DISCOUNT10') {
      const rawDisc = Math.round(subtotal * 0.1);
      const disc = Math.min(2500, Math.min(Math.max(1, subtotal - 1), Math.max(100, rawDisc)));
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      setCouponError(null);
      showToast(`Coupon applied! Saved ₹${disc.toLocaleString('en-IN')}`, 'success');
    } else if (clean === 'URBAN500' || clean === 'SUPER500' || clean === 'SITE500') {
      const disc = Math.min(Math.max(1, subtotal - 1), 500);
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      setCouponError(null);
      showToast(`Coupon applied! Saved ₹${disc.toLocaleString('en-IN')}`, 'success');
    } else if (clean === 'URBAN50' || clean === 'SAVE50') {
      const disc = Math.min(subtotal, 250);
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      setCouponError(null);
      showToast(`Coupon applied! Saved ₹${disc.toLocaleString('en-IN')}`, 'success');
    } else if (clean === 'MEGA2026' || clean === 'OFFER12') {
      const disc = Math.min(5000, Math.max(1, Math.round(subtotal * 0.12)));
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      setCouponError(null);
      showToast(`Coupon applied! Saved ₹${disc.toLocaleString('en-IN')}`, 'success');
    } else if (clean === 'URBANICO' || clean === 'WELCOME') {
      const disc = Math.min(1000, Math.min(Math.max(1, subtotal - 1), Math.max(150, Math.round(subtotal * 0.1))));
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      setCouponError(null);
      showToast(`Coupon applied! Saved ₹${disc.toLocaleString('en-IN')}`, 'success');
    } else {
      setCouponError('Invalid coupon code');
      showToast('Invalid coupon code', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setPromoInput('');
    setCouponError(null);
  };

  const handlePlaceOrder = () => {
    handleStartCheckout();
  };

  const handlePaymentSuccess = (result: RazorpayPaymentResult) => {
    console.log(`[Order Payment Success] Received payment confirmation from gateway!`, {
      amount: result.amount,
      paymentId: result.razorpay_payment_id,
      orderId: result.razorpay_order_id,
      method: result.method,
      isLiveMode: result.isLiveMode,
      status: result.status,
    });

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
      ? `${smartRecommendation.vehicle.shortName} & Trade Unit`
      : smartRecommendation.vehicle.name;

    const isHeavyBulk = totalWeightTons >= 3.5;
    const isMediumLoad = totalWeightTons > 0.25 && totalWeightTons < 3.5;
    const isSmallLoad = !isServicesOnly && totalWeightTons <= 0.25;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const finalVehicleNum = isServicesOnly
      ? 'Field Service Unit'
      : isMixedCart
      ? `TS 09 UB ${randomSuffix} (${smartRecommendation.vehicle.shortName})`
      : `TS 09 UB ${randomSuffix} (${smartRecommendation.vehicle.shortName})`;

    const finalDriverName = isServicesOnly
      ? 'Assigned Trade Specialist'
      : isMixedCart
      ? 'Assigned Fleet Partner & Trade Specialist'
      : isSmallLoad
      ? 'Assigned Auto Courier Partner'
      : 'Assigned Heavy Fleet Driver';

    const assignedDriverPhone = 'Central Dispatch Desk';
    const deliveryDestination = formatSiteAddress(selectedCheckoutAddress || activeLocation);
    const effectiveGstin = isB2BOpted
      ? (checkoutGstin.trim() || (user?.gstin ? user.gstin.trim() : '')).toUpperCase() || undefined
      : undefined;
    const effectiveBusinessName = isB2BOpted
      ? (checkoutBusinessName.trim() || gstinValidation?.info?.tradeName || user?.companyName || undefined)
      : undefined;
    const effectiveInvoiceEmail = (checkoutInvoiceEmail.trim() || user?.email || 'accounts@urbanico.in');

    const newOrder: ActivityDelivery = {
      id: `del-${Date.now()}`,
      orderNumber: generatedOrderNum,
      materialName: finalMaterialName,
      quantity: isServicesOnly ? '1 Site Visit' : `${cartItems.reduce((acc, c) => acc + c.quantity, 0)} Items`,
      driverName: finalDriverName,
      driverPhone: assignedDriverPhone,
      vehicleType: finalVehicleType,
      vehicleNumber: finalVehicleNum,
      estimatedArrival: isMixedCart
        ? `Materials: ${isSmallLoad ? '25-30 mins' : '35-45 mins'} | Trade Visit: Today within 2 hrs`
        : isServicesOnly
        ? 'Today within 2 hrs'
        : isSmallLoad
        ? '25 mins'
        : '35 mins',
      status: 'En Route',
      siteAddress: deliveryDestination,
      siteSupervisorName: activeSupervisor.name,
      siteSupervisorPhone: activeSupervisor.phone,
      timestamp: `Today, ${formattedTime}`,
      totalAmount: grandTotal,
      deliveryOtp: '261125',
      ewayBillNumber: `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
      unloadingCharges: optInLaborAssistance ? unloadingLaborFee : 0,
      laborAssistanceOpted: optInLaborAssistance,
      laborAssistanceDetails: optInLaborAssistance ? smartRecommendation.unloadingAssistance.label : undefined,
      recommendedVehicle: smartRecommendation.vehicle.shortName,
      cartItemsSnapshot: [...cartItems],
      gstin: effectiveGstin,
      businessName: effectiveBusinessName,
      customerEmail: effectiveInvoiceEmail,
      invoiceEmailStatus: 'sent',
      invoiceEmailedTo: effectiveInvoiceEmail,
      invoiceEmailedAt: new Date().toISOString(),
    };

    createdOrderRef.current = newOrder;

    // Auto-generate and email professional GST Tax Invoice immediately after order success
    try {
      const taxInvoiceData = buildTaxInvoiceData(newOrder, user);
      sendTaxInvoiceEmail(taxInvoiceData, effectiveInvoiceEmail).then((res) => {
        if (res.success) {
          showToast(`Tax invoice emailed to ${effectiveInvoiceEmail}`, 'success');
        }
      }).catch((e) => console.warn('Invoice email dispatch log:', e));
    } catch (e) {
      console.warn('Tax invoice construction log:', e);
    }

    const cleanCustomerPhone = (
      user?.phone?.replace(/\D/g, '') ||
      newAddrPhone?.replace(/\D/g, '') ||
      activeSupervisor.phone?.replace(/\D/g, '') ||
      '9848012345'
    ).slice(-10);

    const cleanCustomerName = (
      user?.name ||
      newAddrName ||
      activeSupervisor.name ||
      'Customer'
    ).trim();

    // Send real order data to the backend API with customer profile
    apiService.createOrder({
      orderNumber: generatedOrderNum,
      customerName: effectiveBusinessName || cleanCustomerName,
      customerPhone: `+91 ${cleanCustomerPhone}`,
      customerEmail: effectiveInvoiceEmail,
      gstin: effectiveGstin,
      businessName: effectiveBusinessName,
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
      unloadingCharges: optInLaborAssistance ? unloadingLaborFee : 0,
      totalAmount: grandTotal,
      paymentMethod: result.method || (selectedPaymentMethod === 'pod' ? 'Pay on Site (Cash / RTGS)' : 'Razorpay Gateway'),
      paymentStatus: selectedPaymentMethod === 'pod' ? 'pending_site_verification' : 'paid',
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

    // Auto-save guest session continuity (Amazon/Flipkart flow)
    if (!isLoggedIn) {
      try {
        safeStorage.setItem(
          'urbanico_auth_session',
          JSON.stringify({ isLoggedIn: true, phone: `+91 ${cleanCustomerPhone}`, name: cleanCustomerName })
        );
      } catch {}
    }

    try {
      const existingUserOrdersRaw = safeStorage.getItem(`urbanico_user_orders_${cleanCustomerPhone}`);
      const existingUserOrders = existingUserOrdersRaw ? JSON.parse(existingUserOrdersRaw) : [];
      safeStorage.setItem(`urbanico_user_orders_${cleanCustomerPhone}`, JSON.stringify([newOrder, ...existingUserOrders]));
    } catch {}

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
      customerName: user?.name || 'Valued Client',
      customerPhone: user?.phone ? (user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`) : '',
      customerEmail: user?.email || '',
      customerGstin: checkoutGstin.trim() || user?.gstin || undefined,
    });
    if (!success) {
      showToast('Please enable popups to print/download quotation PDF', 'error');
    }
  };

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route' && !cancelledOrderIds.includes(d.id));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
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
              numberOfLines={1}
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
              numberOfLines={1}
            >
              Tracking & Orders
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
                {checkoutStep === 'cart' ? (
                  <>
                    {/* Retry Notice Banner on Cart Step if previous payment attempt failed */}
                    {paymentFailure && cartItems.length > 0 && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: theme.mode === 'dark' ? '#1F1315' : '#FFF5F5',
                          borderWidth: 1,
                          borderColor: '#EF4444',
                          borderRadius: 10,
                          padding: 12,
                          marginBottom: 12,
                          gap: 10,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <AlertTriangle size={18} color="#DC2626" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                              Payment {paymentFailure.status === 'cancelled' ? 'was cancelled' : 'failed'}
                            </Text>
                            <Text style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 1 }} numberOfLines={1}>
                              Your items are saved. Ready to complete checkout?
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            soundService.playTap();
                            setCheckoutStep('payment');
                          }}
                          style={{
                            backgroundColor: '#DC2626',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Retry Payment</Text>
                        </TouchableOpacity>
                      </View>
                    )}

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
                          <Text style={[styles.itemOptionLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                            {item.selectedOptionLabel}
                          </Text>
                          <Text style={[styles.itemUnitPrice, { color: theme.textPrimary, fontWeight: '700' }]} numberOfLines={1}>
                            ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                            {item.quantity > 1 ? (
                              <Text style={{ fontSize: 11, fontWeight: '400', color: theme.textSecondary }}>
                                {' '}(₹{item.unitPrice.toLocaleString('en-IN')} × {item.quantity})
                              </Text>
                            ) : null}
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

                        {/* Stepper + Delete (Locked to 1 for Services) */}
                        {(item as any).categoryId === 'services' || item.unitPrice === 99 || (item.selectedOptionLabel && item.selectedOptionLabel.toLowerCase().includes('demo')) ? (
                          <View style={styles.stepperActionRow}>
                            <View style={[styles.serviceFixedPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                              <ShieldCheck size={13} color="#059669" strokeWidth={2.4} />
                              <Text style={[styles.serviceFixedPillText, { color: theme.textPrimary }]}>
                                1 Demo Visit
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                soundService.playAlert();
                                onRemoveItem(item.id);
                              }}
                              style={styles.deleteBtn}
                              activeOpacity={0.7}
                              accessibilityLabel="Remove demo visit"
                            >
                              <Trash2 size={15} color={theme.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        ) : (
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
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Vehicle Arrangement Matching Site Unloading Labor Layout */}
                {materialItems.length > 0 && (
                  <View
                    style={[
                      styles.laborAssistanceCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.laborAssistanceTopRow}>
                      <View style={styles.laborAssistanceLeft}>
                        <View
                          style={[
                            styles.laborCheckboxCircle,
                            {
                              backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Truck size={12} color={theme.textPrimary} strokeWidth={2.2} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                          <View style={styles.laborTitleWithBadgeRow}>
                            <Text style={[styles.laborAssistanceTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                              {smartRecommendation.vehicle.shortName || smartRecommendation.vehicle.name.split('(')[0].trim()}
                            </Text>
                            <View
                              style={[
                                styles.laborBadgePill,
                                { backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F1F5F9' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.laborBadgePillText,
                                  { color: theme.textSecondary },
                                ]}
                                numberOfLines={1}
                              >
                                {smartRecommendation.vehicle.maxTons} MT
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.laborAssistanceSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {smartRecommendation.reason}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.laborPriceBox}>
                        <Text
                          style={[
                            styles.laborPriceText,
                            { color: deliveryCharge === 0 ? '#059669' : theme.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                        </Text>
                        <Text
                          style={[
                            styles.laborStatusTag,
                            { color: '#059669' },
                          ]}
                          numberOfLines={1}
                        >
                          Allocated
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Selectable Labor Assistance for Material Unloading (Optional) */}
                {materialItems.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      soundService.playTap();
                      setOptInLaborAssistance(!optInLaborAssistance);
                    }}
                    style={[
                      styles.laborAssistanceCard,
                      {
                        backgroundColor: optInLaborAssistance ? (theme.mode === 'dark' ? '#064E3B' : '#ECFDF5') : theme.surface,
                        borderColor: optInLaborAssistance ? '#10B981' : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.laborAssistanceTopRow}>
                      <View style={styles.laborAssistanceLeft}>
                        <View
                          style={[
                            styles.laborCheckboxCircle,
                            {
                              backgroundColor: optInLaborAssistance ? '#10B981' : 'transparent',
                              borderColor: optInLaborAssistance ? '#10B981' : theme.textMuted,
                            },
                          ]}
                        >
                          {optInLaborAssistance ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                        </View>
                        <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                          <View style={styles.laborTitleWithBadgeRow}>
                            <Text style={[styles.laborAssistanceTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                              Site Unloading Labor
                            </Text>
                            <View
                              style={[
                                styles.laborBadgePill,
                                { backgroundColor: optInLaborAssistance ? '#D1FAE5' : '#F1F5F9' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.laborBadgePillText,
                                  { color: optInLaborAssistance ? '#065F46' : '#475569' },
                                ]}
                                numberOfLines={1}
                              >
                                Optional
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.laborAssistanceSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {smartRecommendation.unloadingAssistance.label} • {smartRecommendation.unloadingAssistance.description}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.laborPriceBox}>
                        <Text
                          style={[
                            styles.laborPriceText,
                            { color: optInLaborAssistance ? '#059669' : theme.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          +₹{smartRecommendation.unloadingAssistance.fee}
                        </Text>
                        <Text
                          style={[
                            styles.laborStatusTag,
                            { color: optInLaborAssistance ? '#059669' : theme.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {optInLaborAssistance ? 'Included' : 'Tap to Add'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Delivery Site Address Selection (Inline above GSTIN & Promo Coupon) */}
                {cartItems.length > 0 && renderAddressSelectionSection()}

                {/* B2B Tax Invoice & GSTIN Section (Only for materials, hidden for single/pure service orders) */}
                {cartItems.length > 0 && !isServicesOnly && renderB2BGstinCard(false)}

                {/* Apply Contractor Promo Code / Coupon (Positioned directly below GSTIN) */}
                {cartItems.length > 0 && renderPromoCard(false)}

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
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                          Delivery ({deliveryDistanceKm} km)
                        </Text>
                        <Text style={[styles.summaryValue, { color: theme.textPrimary, fontWeight: '700' }]}>
                          {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                        </Text>
                      </View>
                    )}

                    {materialItems.length > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                          Site Unloading Labor
                        </Text>
                        <Text
                          style={[
                            styles.summaryValue,
                            {
                              color: optInLaborAssistance ? '#059669' : theme.textMuted,
                              fontWeight: optInLaborAssistance ? '700' : '500',
                            },
                          ]}
                        >
                          {optInLaborAssistance
                            ? `+₹${unloadingLaborFee.toLocaleString('en-IN')}`
                            : 'Self-Unloading (₹0)'}
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

                {/* Primary Pay Button - Only till Total Payable in Cart */}
                {cartItems.length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={() => {
                        soundService.playTap();
                        setCheckoutStep('payment');
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({ y: 0, animated: true });
                        }
                      }}
                      activeOpacity={0.88}
                      style={[
                        styles.nikeCheckoutPill,
                        {
                          backgroundColor: '#0F172A',
                          height: 52,
                          borderRadius: 26,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 22,
                          gap: 10,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Lock size={15} color="#FFFFFF" />
                        <Text style={[styles.nikeCheckoutPillText, { fontSize: 15.5, fontWeight: '700', letterSpacing: 0.2, textAlign: 'center' }]}>
                          Pay ₹{payableAmount.toLocaleString('en-IN')}
                        </Text>
                        <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
                      </View>
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
              </>
            ) : (
              /* Payment Options Screen (Step 2) */
              <View style={{ marginTop: 2 }}>
                {/* Top Navigation */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      soundService.playTap();
                      setCheckoutStep('cart');
                      if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ y: 0, animated: true });
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: theme.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <ArrowLeft size={16} color={theme.textPrimary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>Back to Cart</Text>
                  </TouchableOpacity>
                </View>

                {/* Sleek Minimalist Payment Notice Banner */}
                {paymentFailure && cartItems.length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: paymentFailure.status === 'cancelled'
                        ? (theme.mode === 'dark' ? '#2A1F0D' : '#FFFBEB')
                        : (theme.mode === 'dark' ? '#2A1417' : '#FEF2F2'),
                      borderWidth: 1,
                      borderColor: paymentFailure.status === 'cancelled' ? '#F59E0B' : '#EF4444',
                      borderRadius: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      {paymentFailure.status === 'cancelled' ? (
                        <AlertTriangle size={16} color="#D97706" />
                      ) : (
                        <AlertCircle size={16} color="#DC2626" />
                      )}
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: '600',
                          color: paymentFailure.status === 'cancelled'
                            ? (theme.mode === 'dark' ? '#FDE68A' : '#92400E')
                            : (theme.mode === 'dark' ? '#FECACA' : '#991B1B'),
                          flex: 1,
                        }}
                        numberOfLines={2}
                      >
                        {paymentFailure.status === 'cancelled'
                          ? 'Payment was cancelled. Select a method below to retry.'
                          : 'Payment was declined or incomplete. Please retry or choose another method.'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        soundService.playTap();
                        setPaymentFailure(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        padding: 4,
                        borderRadius: 12,
                      }}
                    >
                      <X size={14} color={paymentFailure.status === 'cancelled' ? '#D97706' : '#DC2626'} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Payment Options */}
                {cartItems.length > 0 && (
                  <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 0 }]}>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.borderLight, paddingBottom: 10, marginBottom: 12 }}>
                      <Text style={[styles.summaryTitle, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0, color: theme.textPrimary }]}>
                        Select Payment Method
                      </Text>
                    </View>

                    {/* Method 1: Seamless Online Payment */}
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => {
                        soundService.playTap();
                        setSelectedPaymentMethod('online');
                      }}
                      style={[
                        styles.paymentOptionCard,
                        {
                          backgroundColor: selectedPaymentMethod === 'online'
                            ? (theme.mode === 'dark' ? '#1E293B' : '#F0FDF4')
                            : theme.surfaceSecondary,
                          borderColor: selectedPaymentMethod === 'online' ? '#16A34A' : theme.border,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: selectedPaymentMethod === 'online' ? '#16A34A' : theme.textMuted,
                            },
                          ]}
                        >
                          {selectedPaymentMethod === 'online' && (
                            <View style={[styles.radioCircleInner, { backgroundColor: '#16A34A' }]} />
                          )}
                        </View>
                        <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.textPrimary, flex: 1 }}>
                          Online Payment (UPI / Cards)
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Method 2: Pay on Site / Delivery */}
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => {
                        soundService.playTap();
                        setSelectedPaymentMethod('pod');
                      }}
                      style={[
                        styles.paymentOptionCard,
                        {
                          backgroundColor: selectedPaymentMethod === 'pod'
                            ? (theme.mode === 'dark' ? '#1E293B' : '#F0F9FF')
                            : theme.surfaceSecondary,
                          borderColor: selectedPaymentMethod === 'pod' ? theme.primary : theme.border,
                          marginTop: 10,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: selectedPaymentMethod === 'pod' ? theme.primary : theme.textMuted,
                            },
                          ]}
                        >
                          {selectedPaymentMethod === 'pod' && (
                            <View style={[styles.radioCircleInner, { backgroundColor: theme.primary }]} />
                          )}
                        </View>
                        <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.textPrimary, flex: 1 }}>
                          Pay on Delivery (POD)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Single Minimalist Pay / Retry Button */}
                {cartItems.length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={handleStartCheckout}
                      disabled={isPlacingOrder}
                      activeOpacity={0.88}
                      style={[
                        styles.nikeCheckoutPill,
                        {
                          backgroundColor: paymentFailure && selectedPaymentMethod === 'online' ? '#DC2626' : '#0F172A',
                          height: 52,
                          borderRadius: 26,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 24,
                        },
                      ]}
                    >
                      {isPlacingOrder ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={[styles.nikeCheckoutPillText, { fontSize: 15, fontWeight: '600', textAlign: 'center' }]}>
                            {selectedPaymentMethod === 'pod'
                              ? 'Confirming Site Order...'
                              : 'Connecting to Payment Gateway...'}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            width: '100%',
                            paddingHorizontal: 8,
                          }}
                        >
                          {paymentFailure && selectedPaymentMethod === 'online' ? (
                            <>
                              <RotateCcw size={16} color="#FFFFFF" strokeWidth={2.4} />
                              <Text
                                style={[
                                  styles.nikeCheckoutPillText,
                                  {
                                    fontSize: 15,
                                    fontWeight: '700',
                                    letterSpacing: 0.1,
                                    textAlign: 'center',
                                    flexShrink: 1,
                                  },
                                ]}
                              >
                                Retry Payment (₹{payableAmount.toLocaleString('en-IN')})
                              </Text>
                              <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
                            </>
                          ) : (
                            <>
                              <Lock size={15} color="#FFFFFF" />
                              <Text
                                style={[
                                  styles.nikeCheckoutPillText,
                                  {
                                    fontSize: 15,
                                    fontWeight: '700',
                                    letterSpacing: 0.1,
                                    textAlign: 'center',
                                    flexShrink: 1,
                                  },
                                ]}
                              >
                                {selectedPaymentMethod === 'pod'
                                  ? `Place Order (Pay on Site ₹${payableAmount.toLocaleString('en-IN')})`
                                  : `Pay ₹${payableAmount.toLocaleString('en-IN')}`}
                              </Text>
                              <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
                            </>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
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
                  <Package size={34} color={theme.textPrimary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.nikeEmptyBagTitle, { color: theme.textPrimary }]}>No active orders.</Text>
                <Text style={[styles.nikeEmptyBagSub, { color: theme.textSecondary }]}>
                  When you place an order, dispatch lifecycle stages and invoices will appear here.
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
                {/* Active Order Vertical Lifecycle Card */}
                {activeEnRoute && (
                  <View style={[styles.trackingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.trackingCardHeader, { borderBottomColor: theme.borderLight }]}>
                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Text style={[styles.trackingOrderNumber, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                            Order #{activeEnRoute.orderNumber}
                          </Text>
                          <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#15803D' }}>IN TRANSIT</Text>
                          </View>
                        </View>
                        <Text style={[styles.trackingMaterialName, { color: theme.textSecondary }]} numberOfLines={1}>
                          {activeEnRoute.materialName}
                        </Text>
                      </View>
                      <View style={[styles.etaPill, { backgroundColor: '#DCFCE7' }]}>
                        <Clock size={11} color="#15803D" />
                        <Text style={[styles.etaPillText, { color: '#15803D' }]} numberOfLines={1}>
                          {activeEnRoute.estimatedArrival || 'Within 3 hrs'}
                        </Text>
                      </View>
                    </View>

                    {/* Delivery Site Destination & OTP */}
                    <View style={{ backgroundColor: theme.surfaceSecondary, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.border, gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <MapPin size={15} color={theme.primary} style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: 0.5 }}>
                            Site Destination
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary, lineHeight: 16 }} numberOfLines={2}>
                            {formatSiteAddress(activeEnRoute.siteAddress)}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderLight, paddingTop: 8 }}>
                        <View>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textSecondary }}>Gate Verification OTP</Text>
                          <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: 2, color: theme.textPrimary }}>
                            {activeEnRoute.deliveryOtp || '8842'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setShowSupervisorModal(true)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textPrimary }}>Delegate</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Action Bar (GST Invoice + Supervisor + Cancel Icon) */}
                    <View style={styles.activeActionBar}>
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
                        onPress={() => setShowSupervisorModal(true)}
                        style={[styles.actionChipBtn, { backgroundColor: '#111111' }]}
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={13} color="#FFFFFF" />
                        <Text style={[styles.actionChipBtnText, { color: '#FFFFFF' }]}>Supervisor</Text>
                      </TouchableOpacity>

                      {/* Cancel button */}
                      <TouchableOpacity
                        onPress={() => {
                          setOrderToCancel(activeEnRoute);
                          setShowCancelConfirmModal(true);
                        }}
                        style={[styles.cancelIconButton, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                        activeOpacity={0.8}
                        accessibilityLabel="Cancel order"
                      >
                        <X size={15} color="#DC2626" strokeWidth={2.4} />
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
                          <View style={[styles.deliveryLeftInfo, { flex: 1, minWidth: 0, marginRight: 10 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={[styles.delMaterialName, { color: theme.textPrimary }]} numberOfLines={1}>
                                {del.orderNumber ? `Order #${del.orderNumber}` : 'Standard Order'}
                              </Text>
                              {isCancelled && (
                                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#DC2626' }}>CANCELLED</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2, marginBottom: 2 }} numberOfLines={1}>
                              {del.materialName}
                            </Text>
                            <Text style={[styles.timestampText, { color: theme.textSecondary }]} numberOfLines={1}>
                              {del.timestamp}{isCancelled ? ' • Refund Issued' : ''}
                            </Text>
                          </View>

                          <View style={[styles.deliveryRightInfo, { alignItems: 'flex-end', flexShrink: 0 }]}>
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


        {/* Payment Success Confirmation Receipt Screen */}
        {showSuccessModal && (
          <PaymentSuccessModal
            visible={showSuccessModal}
            paymentResult={latestPaymentResult}
            selectedLocation={selectedCheckoutAddress || activeLocation}
            delivery={createdOrderRef.current || deliveries[0]}
            user={user}
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
                Are you sure you want to cancel Dispatch #{orderToCancel?.orderNumber}? A refund of ₹{orderToCancel?.totalAmount?.toLocaleString('en-IN')} will be credited back to your payment source.
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
    minWidth: 0,
    marginRight: 6,
  },
  locationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationTextContainer: {
    flex: 1,
    minWidth: 0,
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
    minWidth: 0,
    marginRight: 6,
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
  serviceFixedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  serviceFixedPillText: {
    fontSize: 12,
    fontWeight: '700',
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
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  openCouponText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
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
  vehicleRecCard: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 3,
  },
  vehicleRecHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  vehicleRecTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  vehicleRecHeading: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  vehicleRecBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 0,
  },
  vehicleBadgePillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  vehicleRecReason: {
    fontSize: 11,
    lineHeight: 14,
  },
  laborAssistanceCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  laborAssistanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  laborAssistanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  laborCheckboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  laborTitleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  laborAssistanceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  laborBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  laborBadgePillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  laborAssistanceSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  laborPriceBox: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  laborPriceText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  laborStatusTag: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  paymentOptionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
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
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12.5,
    flex: 1,
    minWidth: 0,
  },
  summaryValue: {
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 0,
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
    textAlign: 'center',
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
  cancelIconButton: {
    width: 38,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  b2bCardContainer: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  b2bHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  b2bHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  b2bIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  b2bTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  itcBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itcBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  b2bSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  b2bCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  b2bBody: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  b2bFieldGroup: {
    gap: 3,
  },
  b2bErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  b2bErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
  },
  b2bVerifiedBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  b2bVerifiedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  b2bVerifiedTitle: {
    color: '#065F46',
    fontSize: 11.5,
    fontWeight: '700',
  },
  b2bVerifiedTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  b2bVerifiedTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  b2bVerifiedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  b2bVerifiedCol: {
    flex: 1,
    minWidth: 90,
  },
  b2bVerifiedLabel: {
    fontSize: 9,
    color: '#047857',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  b2bVerifiedVal: {
    fontSize: 11,
    color: '#064E3B',
    fontWeight: '600',
    marginTop: 1,
  },
});
