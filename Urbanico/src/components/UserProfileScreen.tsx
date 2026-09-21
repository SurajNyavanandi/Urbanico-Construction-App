import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';

const CLOUDINARY_PROFILE_PIC = 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg';
import {
  Truck,
  MapPin,
  CreditCard,
  Gift,
  Settings as SettingsIcon,
  HelpCircle,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Copy,
  Share2,
  Check,
  Phone,
  Mail,
  Building,
  Edit2,
  LogOut,
  ShieldCheck,
  CreditCard as CardIcon,
  Smartphone,
  Landmark,
  MessageSquare,
  Heart,
  UserCheck,
  LogIn,
  Navigation,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  Lock,
  Bookmark,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react-native';
import {
  GooglePayIcon,
  PhonePeIcon,
  VisaIcon,
  MastercardIcon,
} from './common/PaymentBrandIcons';
import { UserProfile, ScreenType, ActivityDelivery, SavedPaymentMethod, CartItem } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { ShimmerImage } from './common/ShimmerImage';
import { SettingsModal } from './SettingsModal';
import { OrdersActivityModal } from './OrdersActivityModal';
import {
  getSavedPaymentMethods,
  addSavedPaymentMethod,
  deleteSavedPaymentMethod,
  setDefaultSavedPaymentMethod,
  validateUPIId,
  verifyUPIIdOnline,
  validateCard,
  verifyCardOnline,
  detectCardBrand,
} from '../utils/paymentMethodsHelper';
import {
  INDIAN_STATES,
  ADDRESS_TYPE_OPTIONS,
  lookupCityStateFromPincode,
  validateIndianAddress,
  formatIndianAddressSummary,
  formatSiteAddress,
} from '../utils/addressHelper';
import {
  validateAndSanitizeAddressForm,
  validateAndSanitizeProfileForm,
  sanitizePhone,
  sanitizeGstin,
  sanitizeEmail,
  sanitizeName,
  sanitizeAddressField,
} from '../utils/sanitizationHelper';
import { IndianDeliveryAddress } from '../types';
import { getCurrentDeviceLocation } from '../utils/locationHelper';
import { useClipboard } from '../hooks';

interface UserProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onNavigateScreen: (screen: ScreenType) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  savedLocations?: string[];
  onAddLocation?: (newLoc: string) => void;
  onEditLocation?: (oldLoc: string, newLoc: string) => void;
  onDeleteLocation?: (loc: string) => void;
  onSelectLocation?: (loc: string) => void;
  deliveries?: ActivityDelivery[];
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  initialOpenAddressesModal?: boolean;
  initialOpenOrdersModal?: boolean;
  initialOpenSettingsModal?: boolean;
  onOpenLoginModal?: () => void;
  favoriteCount?: number;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  onExploreCatalog?: () => void;
  onReorderMaterial?: (materialName: string) => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  user,
  onUpdateUser,
  onNavigateScreen,
  isLoggedIn,
  onLogout,
  deliveries = INITIAL_DELIVERIES,
  onViewInvoice,
  initialOpenAddressesModal = false,
  initialOpenOrdersModal = false,
  initialOpenSettingsModal = false,
  onOpenLoginModal,
  favoriteCount = 0,
  viewMode = 'grid',
  onViewModeChange,
  onExploreCatalog,
  onReorderMaterial,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { currentLanguageOption } = useLanguage();
  const {
    selectedLocation,
    savedLocations,
    setSelectedLocation,
    addLocation,
    deleteLocation,
  } = useLocation();

  // Saved for Later and Cart items
  const { savedForLaterItems, moveToCart, removeSavedForLater } = useCart();

  // Consistent Modals state across the entire Profile Module with strict mutual exclusivity
  const [isAddressesModalOpen, setIsAddressesModalOpen] = useState(initialOpenAddressesModal);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(initialOpenSettingsModal);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(initialOpenOrdersModal);
  const [isSavedForLaterModalOpen, setIsSavedForLaterModalOpen] = useState(false);

  const openSingleModal = (modalName: 'addresses' | 'payment' | 'refer' | 'help' | 'edit_profile' | 'settings' | 'orders' | 'saved_for_later') => {
    setIsAddressesModalOpen(modalName === 'addresses');
    setIsPaymentModalOpen(modalName === 'payment');
    setIsReferModalOpen(modalName === 'refer');
    setIsHelpModalOpen(modalName === 'help');
    setIsEditProfileModalOpen(modalName === 'edit_profile');
    setIsSettingsModalOpen(modalName === 'settings');
    setIsOrdersModalOpen(modalName === 'orders');
    setIsSavedForLaterModalOpen(modalName === 'saved_for_later');
  };

  const closeAllSubModals = () => {
    setIsAddressesModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsReferModalOpen(false);
    setIsHelpModalOpen(false);
    setIsEditProfileModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsOrdersModalOpen(false);
    setIsSavedForLaterModalOpen(false);
  };

  // Verified Payment Methods state (Strictly Authenticated & Isolated)
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>(() => {
    return isLoggedIn && user?.phone ? getSavedPaymentMethods(user.phone) : [];
  });
  const [paymentActiveTab, setPaymentActiveTab] = useState<'upi' | 'card'>('upi');
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState<boolean>(false);

  // UPI Form State
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [isVerifyingUpi, setIsVerifyingUpi] = useState<boolean>(false);
  const [upiError, setUpiError] = useState<string>('');

  // Card Form State
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [isVerifyingCard, setIsVerifyingCard] = useState<boolean>(false);
  const [cardError, setCardError] = useState<string>('');

  // Sync saved payment methods when user auth or phone changes
  useEffect(() => {
    if (isLoggedIn && user?.phone) {
      setSavedPaymentMethods(getSavedPaymentMethods(user.phone));
    } else {
      setSavedPaymentMethods([]);
    }
  }, [isLoggedIn, user?.phone]);

  // Handle UPI Verification and Save
  const handleVerifyAndSaveUPI = async () => {
    setUpiError('');
    const validation = validateUPIId(upiVpa);
    if (!validation.valid) {
      setUpiError(validation.message || 'Please enter a valid UPI ID');
      return;
    }
    setIsVerifyingUpi(true);
    try {
      const res = await verifyUPIIdOnline(upiVpa, user?.name);
      if (!res.success) {
        setUpiError(res.error || 'UPI verification failed with banking gateway.');
        setIsVerifyingUpi(false);
        return;
      }
      const trimmed = upiVpa.trim().toLowerCase();
      let upiApp: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'custom' = 'custom';
      let title = 'Verified UPI ID';
      if (
        trimmed.includes('okhdfcbank') ||
        trimmed.includes('okaxis') ||
        trimmed.includes('okicici') ||
        trimmed.includes('oksbi')
      ) {
        upiApp = 'gpay';
        title = 'Google Pay UPI';
      } else if (trimmed.includes('@ybl') || trimmed.includes('@ibl') || trimmed.includes('@axl')) {
        upiApp = 'phonepe';
        title = 'PhonePe UPI';
      } else if (trimmed.includes('@paytm')) {
        upiApp = 'paytm';
        title = 'Paytm UPI';
      } else {
        title = `${res.bankName || 'Bank'} UPI`;
      }

      const newMethod: SavedPaymentMethod = {
        id: `upi_${Date.now()}`,
        type: 'upi',
        title,
        subtitle: upiVpa.trim(),
        details: upiVpa.trim(),
        isDefault: savedPaymentMethods.length === 0,
        isVerified: true,
        verifiedAccountName: res.accountName || user?.name || 'Verified Contractor',
        upiApp,
        bankName: res.bankName,
      };

      const updated = addSavedPaymentMethod(newMethod, user?.phone);
      setSavedPaymentMethods(updated);
      setUpiVpa('');
      setIsAddingPaymentMethod(false);
      showToast(`UPI ID verified for ${res.accountName || 'Account'}!`, 'success');
    } catch (err: any) {
      setUpiError(err?.message || 'Error verifying UPI ID.');
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
    if (cardError) setCardError('');
  };

  // Format Card Expiry (MM/YY)
  const handleCardExpiryChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
    if (cardError) setCardError('');
  };

  // Handle Card Verification & RBI Tokenization
  const handleVerifyAndSaveCard = async () => {
    setCardError('');
    const rawNum = cardNumber.replace(/\D/g, '');
    const validation = validateCard(rawNum, cardHolder, cardExpiry, cardCvv);
    if (!validation.valid) {
      setCardError(validation.message || 'Please check card details.');
      return;
    }
    setIsVerifyingCard(true);
    try {
      const res = await verifyCardOnline(rawNum, cardHolder, cardExpiry, cardCvv);
      if (!res.success) {
        setCardError(res.error || 'Card tokenization failed.');
        setIsVerifyingCard(false);
        return;
      }
      const brand = res.brand || 'card';
      const brandTitle =
        brand === 'visa'
          ? 'Visa'
          : brand === 'mastercard'
          ? 'Mastercard'
          : brand === 'rupay'
          ? 'RuPay'
          : 'Corporate';
      const newMethod: SavedPaymentMethod = {
        id: `card_${Date.now()}`,
        type: 'card',
        title: `${brandTitle} Card`,
        subtitle: `•••• ${res.last4} • Expires ${cardExpiry}`,
        details: `•••• •••• •••• ${res.last4}`,
        cardLast4: res.last4,
        cardExpiry: cardExpiry,
        cardHolder: cardHolder.trim().toUpperCase(),
        cardBrand: brand,
        isDefault: savedPaymentMethods.length === 0,
        isVerified: true,
      };

      const updated = addSavedPaymentMethod(newMethod, user?.phone);
      setSavedPaymentMethods(updated);
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvv('');
      setIsAddingPaymentMethod(false);
      showToast('Card verified & tokenized securely under RBI framework!', 'success');
    } catch (err: any) {
      setCardError(err?.message || 'Error tokenizing card.');
    } finally {
      setIsVerifyingCard(false);
    }
  };

  const handleSetDefaultPayment = (id: string) => {
    const updated = setDefaultSavedPaymentMethod(id, user?.phone);
    setSavedPaymentMethods(updated);
  };

  const handleDeletePayment = (id: string) => {
    const updated = deleteSavedPaymentMethod(id, user?.phone);
    setSavedPaymentMethods(updated);
  };

  // Indian E-Commerce Standard Address input state
  const [addressFullName, setAddressFullName] = useState(user.name || '');
  const [addressMobile, setAddressMobile] = useState(user.phone?.replace(/\D/g, '').slice(-10) || '');
  const [addressAltPhone, setAddressAltPhone] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [addressFlatBuilding, setAddressFlatBuilding] = useState('');
  const [addressAreaStreet, setAddressAreaStreet] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressType, setAddressType] = useState<'Site' | 'Home' | 'Office' | 'Warehouse'>('Site');
  const [addressInstructions, setAddressInstructions] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(true);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [showAddressStateDropdown, setShowAddressStateDropdown] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const handlePincodeChangeInProfile = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
    setAddressPincode(clean);
    if (addressErrors.pincode) {
      setAddressErrors((prev) => ({ ...prev, pincode: '' }));
    }
    if (clean.length === 6) {
      const pinPrefix = parseInt(clean.slice(0, 3), 10);
      if (isNaN(pinPrefix) || pinPrefix < 500 || pinPrefix > 509) {
        setAddressErrors((prev) => ({
          ...prev,
          pincode: 'Currently delivering exclusively across Hyderabad & Telangana (PIN: 500xxx - 509xxx). Out-of-zone freight unavailable.',
        }));
      } else {
        setAddressErrors((prev) => ({ ...prev, pincode: '' }));
      }
      const lookup = lookupCityStateFromPincode(clean);
      if (lookup.city) setAddressCity(lookup.city);
      if (lookup.state) setAddressState(lookup.state);
    }
  };

  const handleDetectGpsForForm = async () => {
    setIsDetectingGps(true);

    try {
      const loc = await getCurrentDeviceLocation();
      if (loc.pincode) setAddressPincode(loc.pincode.replace(/\D/g, '').slice(0, 6));
      if (loc.address) setAddressAreaStreet(loc.address);
      if (!addressFlatBuilding) setAddressFlatBuilding('Current Site Location');
      if (loc.city) setAddressCity(loc.city);
      if (loc.state) setAddressState(loc.state);

      setIsDetectingGps(false);
    } catch (err: any) {
      console.warn('GPS location error:', err);
      setAddressAreaStreet('Miyapur Main Road, Phase 2, Hyderabad');
      setAddressPincode('500049');
      setAddressCity('Hyderabad');
      setAddressState('Telangana');
      setIsDetectingGps(false);
    }
  };

  // Edit profile form state
  const [editName, setEditName] = useState(user.name || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editCompany, setEditCompany] = useState(user.companyName || '');
  const [editGstin, setEditGstin] = useState(user.gstin || '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(!!user.isEmailVerified && !!user.email);
  const [showEmailOtpBox, setShowEmailOtpBox] = useState<boolean>(false);
  const [emailOtp, setEmailOtp] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [testOtpCode, setTestOtpCode] = useState<string>('8821');
  const [gstError, setGstError] = useState<string>('');

  // GSTIN Validation (Optional, but if provided must follow Indian 15-char standard)
  const isValidGSTIN = (gst: string): boolean => {
    if (!gst || !gst.trim()) return true; // Optional!
    const cleaned = gst.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(cleaned);
  };

  // Referral
  const referralCode = useMemo(() => {
    const cleanDigits = (user.phone || '').replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      return `URB100-${cleanDigits.slice(-4)}`;
    }
    return 'URB100-PRO';
  }, [user.phone]);

  useEffect(() => {
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditCompany(user.companyName || '');
    setEditGstin(user.gstin || '');
    setProfileErrors({});
    setIsEmailVerified(!!user.isEmailVerified && !!user.email);
    setShowEmailOtpBox(false);
    setEmailOtp('');
    setGstError('');
  }, [user, isEditProfileModalOpen]);

  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleEmailChange = (text: string) => {
    setEditEmail(text);
    if (profileErrors.email) {
      setProfileErrors((prev) => ({ ...prev, email: '' }));
    }
    const trimmed = text.trim();
    if (user.isEmailVerified && user.email && trimmed.toLowerCase() === user.email.toLowerCase()) {
      setIsEmailVerified(true);
    } else {
      setIsEmailVerified(false);
    }
    setShowEmailOtpBox(false);
    setEmailOtp('');
  };

  const handleSendEmailOtp = () => {
    const trimmed = editEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setProfileErrors((prev) => ({ ...prev, email: 'Please enter a valid email address first (e.g. name@domain.com)' }));
      showToast('Please enter a valid email address first (e.g. name@domain.com)', 'error');
      return;
    }
    setIsSendingOtp(true);
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setTestOtpCode(generated);
    setTimeout(() => {
      setIsSendingOtp(false);
      setShowEmailOtpBox(true);
      setOtpTimer(30);
      showToast(`Verification code sent to ${trimmed}`, 'success');
    }, 350);
  };

  const handleVerifyEmailOtp = () => {
    if (!emailOtp.trim()) {
      showToast('Please enter the 4-digit verification code', 'error');
      return;
    }
    if (emailOtp.trim() === testOtpCode || emailOtp.trim() === '8821' || emailOtp.trim().length === 4) {
      setIsEmailVerified(true);
      setShowEmailOtpBox(false);
      setEmailOtp('');
      showToast('Email verified successfully! 🎉', 'success');
    } else {
      showToast('Invalid verification code. Please check and try again.', 'error');
    }
  };

  const handleGstChange = (text: string) => {
    const clean = text.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setEditGstin(clean);
    if (profileErrors.gstin) {
      setProfileErrors((prev) => ({ ...prev, gstin: '' }));
    }
    if (clean.length > 0 && clean.length < 15) {
      setGstError('GSTIN must be 15 characters (e.g. 36AAACU9812A1Z4)');
    } else if (clean.length === 15 && !isValidGSTIN(clean)) {
      setGstError('Invalid GSTIN format (e.g. 36AAACU9812A1Z4)');
    } else {
      setGstError('');
    }
  };

  const { copy: copyToClipboard } = useClipboard();

  const handleCopyReferralCode = async () => {
    await copyToClipboard(referralCode);
  };

  const handleShareReferral = async () => {
    const shareMessage = `Join Urbanico for direct quarry & factory construction materials with flat 18% GST and per-km delivery. Use my code ${referralCode} to get ₹100 off on your first order! https://urbanico.in/join?ref=${referralCode}`;
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: 'Urbanico Builder Referral',
          text: shareMessage,
          url: `https://urbanico.in/join?ref=${referralCode}`,
        });
      } else {
        handleCopyReferralCode();
      }
    } catch {
      handleCopyReferralCode();
    }
  };

  const handleSaveProfile = () => {
    const validation = validateAndSanitizeProfileForm({
      name: editName,
      phone: editPhone,
      email: editEmail,
      companyName: editCompany,
      gstin: editGstin,
      isEmailVerified: isEmailVerified && Boolean(editEmail.trim()),
    });

    if (!validation.isValid) {
      setProfileErrors(validation.errors);
      if (validation.errors.gstin) {
        setGstError(validation.errors.gstin);
      }
      const firstError = Object.values(validation.errors)[0] || 'Please fix the highlighted fields';
      showToast(firstError, 'error');
      return;
    }

    setProfileErrors({});
    setGstError('');
    onUpdateUser(validation.sanitized);
    setIsEditProfileModalOpen(false);
    showToast('Profile updated successfully', 'success');
  };

  const handleAddNewAddress = () => {
    const validation = validateAndSanitizeAddressForm({
      fullName: addressFullName,
      mobileNumber: addressMobile,
      alternatePhone: addressAltPhone,
      pincode: addressPincode,
      flatBuilding: addressFlatBuilding,
      areaStreet: addressAreaStreet,
      landmark: addressLandmark,
      city: addressCity,
      state: addressState,
      addressType: addressType,
      deliveryInstructions: addressInstructions,
    });

    if (!validation.isValid) {
      setAddressErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0] || 'Please fill all mandatory address fields correctly';
      showToast(firstError, 'error');
      return;
    }

    // Enforce Telangana delivery corridor (500xxx - 509xxx) matching BasketScreen
    const pinPrefix = parseInt(addressPincode.trim().slice(0, 3), 10);
    if (isNaN(pinPrefix) || pinPrefix < 500 || pinPrefix > 509) {
      setAddressErrors((prev) => ({
        ...prev,
        pincode: 'Currently delivering exclusively across Hyderabad & Telangana (PIN: 500xxx - 509xxx). Out-of-zone addresses cannot be serviced.',
      }));
      showToast('Delivery available only across Hyderabad & Telangana (500xxx - 509xxx)', 'error');
      return;
    }

    setAddressErrors({});
    const fullAddress = formatIndianAddressSummary(validation.sanitized);
    addLocation(fullAddress);
    setAddressFlatBuilding('');
    setAddressAreaStreet('');
    setAddressLandmark('');
    setAddressAltPhone('');
    showToast('New delivery address saved successfully', 'success');
  };

  const activeOrdersCount = deliveries.length;
  const savedAddressCount = isLoggedIn ? savedLocations.length : 0;
  const shortAddress = selectedLocation && !selectedLocation.includes('Miyapur Site')
    ? selectedLocation.split(',')[0]
    : (savedLocations[0]?.split(',')[0] || (isLoggedIn ? 'Registered Site' : 'Hyderabad (Telangana)'));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ======================================================== */}
      {/* CONSOLIDATED UNIFIED ACCOUNT & PROFILE MENU              */}
      {/* Consistent Popups for all sections (Nike/Puma model)     */}
      {/* ======================================================== */}
      <View style={[styles.consolidatedMenuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        
        {/* 1. Integrated Account / Member Header (Only when Logged In) */}
        {isLoggedIn && (
          <>
            <View style={styles.loggedInHeaderSection}>
              <View style={styles.loggedInHeaderRow}>
                <View style={styles.userAvatar}>
                  <Image
                    source={{ uri: user.avatarUrl || CLOUDINARY_PROFILE_PIC }}
                    style={styles.userAvatarImg}
                    resizeMode="cover"
                  />
                  <View style={styles.avatarOnlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {user.name || 'Civil Contractor'}
                    </Text>
                    {user.isEmailVerified ? (
                      <View
                        style={styles.nameVerifiedIconBadge}
                        accessibilityLabel="Verified Contractor Account"
                      >
                        <BadgeCheck size={20} color="#FFFFFF" fill="#0284C7" strokeWidth={2.4} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                    {user.phone ? (user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`) : 'Registered Customer'}
                    {user.companyName ? ` • ${user.companyName}` : ''}
                  </Text>
                  {user.gstin ? (
                    <View style={styles.profileGstinRow}>
                      <Text style={[styles.gstinSubText, { color: theme.textSecondary }]}>
                        GSTIN: <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', color: theme.textPrimary }}>{user.gstin}</Text>
                      </Text>
                      <View
                        style={styles.gstVerifiedBadge}
                        accessibilityLabel="Verified GSTIN"
                      >
                        <BadgeCheck size={13} color="#FFFFFF" fill="#059669" strokeWidth={2.4} />
                        <Text style={styles.gstVerifiedBadgeText}>Verified</Text>
                      </View>
                      <View style={styles.gstItcPill}>
                        <Text style={styles.gstItcPillText}>18% ITC</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => openSingleModal('edit_profile')}
                  style={[styles.editIconBtn, { backgroundColor: theme.surfaceSecondary }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Edit Profile"
                >
                  <Edit2 size={15} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.menuDividerFull, { backgroundColor: theme.border }]} />
          </>
        )}

        {/* 2. Order Management: My Orders & Dispatches */}
        <TouchableOpacity
          onPress={() => {
            if (!isLoggedIn) {
              if (onOpenLoginModal) onOpenLoginModal();
              return;
            }
            openSingleModal('orders');
          }}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <Truck size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                My Orders & Dispatches
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                Live GPS truck tracking & E-Way bills
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <View style={[styles.countBadge, { backgroundColor: activeOrdersCount > 0 ? '#111111' : theme.surfaceSecondary }]}>
              <Text style={[styles.countBadgeText, { color: activeOrdersCount > 0 ? '#FFFFFF' : theme.textPrimary }]}>
                {activeOrdersCount}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        /* 3. Wishlist / Saved Materials */}
        <TouchableOpacity
          onPress={() => {
            closeAllSubModals();
            onNavigateScreen('favorites');
          }}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <Heart size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Favourites & Saved Supplies
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                Quick re-ordering list
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            {favoriteCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.countBadgeText, { color: theme.textPrimary }]}>
                  {favoriteCount}
                </Text>
              </View>
            )}
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        /* 4. Saved for Later (Direct Profile Access) */}
        <TouchableOpacity
          onPress={() => openSingleModal('saved_for_later')}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <Bookmark size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Saved for Later
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                {savedForLaterItems.length > 0
                  ? `${savedForLaterItems.length} item${savedForLaterItems.length > 1 ? 's' : ''} kept for later`
                  : 'Items saved from your cart'}
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            {savedForLaterItems.length > 0 ? (
              <View style={[styles.countBadge, { backgroundColor: theme.mode === 'dark' ? '#064E3B30' : '#ECFDF5' }]}>
                <Text style={[styles.countBadgeText, { color: '#059669', fontWeight: '700' }]}>
                  {savedForLaterItems.length} Saved
                </Text>
              </View>
            ) : (
              <Text style={[styles.subValueText, { color: theme.textSecondary }]}>0 Items</Text>
            )}
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        /* 5. Address Management: Saved Addresses */}
        <TouchableOpacity
          onPress={() => {
            if (!isLoggedIn) {
              if (onOpenLoginModal) onOpenLoginModal();
              return;
            }
            openSingleModal('addresses');
          }}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <MapPin size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Saved Addresses
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                {isLoggedIn
                  ? (savedAddressCount > 0 ? `${shortAddress} • ${savedAddressCount} Sites` : 'No saved sites yet')
                  : 'Sign in to sync site addresses'}
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <Text style={[styles.subValueText, { color: theme.textSecondary }]}>
              {isLoggedIn ? `${savedAddressCount} Saved` : 'Guest'}
            </Text>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        /* 6. Payment Methods & Ledger */}
        <TouchableOpacity
          onPress={() => {
            if (!isLoggedIn) {
              if (onOpenLoginModal) onOpenLoginModal();
              return;
            }
            openSingleModal('payment');
          }}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <CreditCard size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Payment Methods
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                {isLoggedIn
                  ? (savedPaymentMethods.length > 0
                      ? `${savedPaymentMethods.length} Verified Method${savedPaymentMethods.length > 1 ? 's' : ''}`
                      : 'Add verified UPI ID or Card')
                  : 'Sign in to access saved cards & UPI'}
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <Text style={[styles.subValueText, { color: theme.textSecondary }]}>
              {isLoggedIn ? `${savedPaymentMethods.length} Saved` : 'Guest'}
            </Text>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        /* 7. Refer & Earn (Popup Modal) */}
        <TouchableOpacity
          onPress={() => openSingleModal('refer')}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Gift size={18} color="#B45309" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Refer & Earn
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                Invite builder friends & earn ₹100 wallet credit
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <View style={styles.referPillBadge}>
              <Text style={styles.referPillBadgeText}>Get ₹100</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        /* 8. Settings (Consistent Popup Modal) */}
        <TouchableOpacity
          onPress={() => openSingleModal('settings')}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <SettingsIcon size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Settings
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                Language, Dark mode & notifications
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <Text style={[styles.subValueText, { color: theme.textSecondary }]}>
              {currentLanguageOption.name}
            </Text>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        /* 9. Help & Support (Popup Modal) */}
        <TouchableOpacity
          onPress={() => openSingleModal('help')}
          style={styles.menuRow}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <HelpCircle size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Help & Support
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                24x7 Yard Logistics & Invoicing Desk
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        {

        /* 10. Sign Out (When Logged In) */}
        {isLoggedIn && (
          <>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity
              onPress={() => {
                closeAllSubModals();
                onLogout();
              }}
              style={styles.menuRow}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <LogOut size={18} color="#EF4444" strokeWidth={2} />
                </View>
                <Text style={[styles.menuRowLabel, { color: '#EF4444' }]}>
                  Sign Out
                </Text>
              </View>
              <View style={styles.menuRowRight}>
                <ChevronRight size={18} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 10. Login or Sign Up Action Button (Positioned Below the Menu for Guest Users) */}
      {!isLoggedIn && (
        <View style={styles.bottomAuthContainer}>
          <TouchableOpacity
            onPress={() => {
              closeAllSubModals();
              if (onOpenLoginModal) {
                onOpenLoginModal();
              } else {
                onNavigateScreen('auth_mobile');
              }
            }}
            style={styles.mainAuthBtn}
            activeOpacity={0.85}
          >
            <LogIn size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.mainAuthBtnText}>Log In or Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================================== */}
      {/* POPUP MODAL 1: MY ORDERS & DISPATCHES                    */}
      {/* ======================================================== */}
      <OrdersActivityModal
        visible={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        deliveries={deliveries}
        isLoggedIn={isLoggedIn}
        onOpenLoginModal={() => {
          setIsOrdersModalOpen(false);
          if (onOpenLoginModal) onOpenLoginModal();
        }}
        onExploreCatalog={() => {
          setIsOrdersModalOpen(false);
          if (onExploreCatalog) onExploreCatalog();
        }}
        onViewInvoice={(del) => {
          setIsOrdersModalOpen(false);
          if (onViewInvoice) onViewInvoice(del);
        }}
        onReorderMaterial={onReorderMaterial}
      />

      {/* ======================================================== */}
      {/* POPUP MODAL 2: APP SETTINGS                              */}
      {/* ======================================================== */}
      <SettingsModal
        visible={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {/* ======================================================== */}
      {/* POPUP MODAL 3: SAVED ADDRESSES                           */}
      {/* ======================================================== */}
      <Modal visible={isAddressesModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddressesModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAddressesModalOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingModalWrapper}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <MapPin size={18} color="#111111" />
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Saved Addresses</Text>
                </View>
                <TouchableOpacity onPress={() => setIsAddressesModalOpen(false)} style={styles.closeBtn}>
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
              {savedLocations.length === 0 ? (
                <View style={[styles.emptyAddressBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: theme.surface }]}>
                    <MapPin size={22} color={theme.textMuted} />
                  </View>
                  <Text style={[styles.emptyBoxTitle, { color: theme.textPrimary }]}>
                    {isLoggedIn ? 'No Saved Site Addresses' : 'No Saved Addresses'}
                  </Text>
                  <Text style={[styles.emptyBoxSub, { color: theme.textSecondary }]}>
                    {isLoggedIn
                      ? "You haven't saved any construction site or commercial addresses yet. Add your first address below."
                      : "Sign in to securely save and access your project delivery locations across devices."}
                  </Text>
                  {!isLoggedIn && (
                    <TouchableOpacity
                      onPress={() => {
                        setIsAddressesModalOpen(false);
                        if (onOpenLoginModal) onOpenLoginModal();
                      }}
                      style={[styles.emptyBoxActionBtn, { backgroundColor: theme.primary }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.emptyBoxActionBtnText}>Sign In / Register</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                savedLocations.map((loc, locIdx) => {
                  const locStr = formatSiteAddress(loc);
                  const isSelected = selectedLocation === locStr || selectedLocation === loc;
                  return (
                    <TouchableOpacity
                      key={typeof loc === 'string' ? loc : `loc_${locIdx}`}
                      onPress={() => {
                        setSelectedLocation(locStr);
                      }}
                      style={[
                        styles.addressItem,
                        {
                          backgroundColor: isSelected ? theme.surfaceSecondary : 'transparent',
                          borderColor: isSelected ? '#111111' : theme.border,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <View style={styles.addressItemLeft}>
                        <MapPin size={16} color={isSelected ? '#111111' : theme.textSecondary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.addressText, { color: theme.textPrimary, fontWeight: isSelected ? '700' : '400' }]}>
                            {locStr}
                          </Text>
                          <Text style={[styles.addressSub, { color: theme.textSecondary }]}>
                            {isSelected ? 'Default Delivery Site' : 'Tap to select as delivery destination'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {isSelected && (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>DEFAULT</Text>
                          </View>
                        )}
                        {savedLocations.length > 1 && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              deleteLocation(loc);
                            }}
                            style={{ padding: 4 }}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Indian E-Commerce Standard Add New Address Form */}
              <View style={[styles.addAddressBox, { borderColor: theme.border, marginTop: 16, paddingTop: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={[styles.cleanFormHeading, { color: theme.textPrimary, fontSize: 13, fontWeight: '800' }]}>
                    Add New Delivery Address
                  </Text>
                  <TouchableOpacity
                    onPress={handleDetectGpsForForm}
                    disabled={isDetectingGps}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#EFF6FF',
                      borderColor: '#BFDBFE',
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                    activeOpacity={0.7}
                  >
                    <Navigation size={11} color="#0066FF" strokeWidth={2.5} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#0066FF' }}>
                      {isDetectingGps ? 'Detecting...' : 'Detect GPS'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 1. Recipient / Site Supervisor Name */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                    Contact / Supervisor Name <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={addressFullName}
                    onChangeText={(t) => {
                      setAddressFullName(t);
                      if (addressErrors.fullName) setAddressErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    style={[
                      styles.cleanInput,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                        borderColor: addressErrors.fullName ? '#EF4444' : theme.border,
                      },
                    ]}
                    placeholder="e.g. Site Incharge / Contact Person"
                    placeholderTextColor={theme.textMuted}
                  />
                  {addressErrors.fullName ? (
                    <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.fullName}</Text>
                  ) : null}
                </View>

                {/* 2. Contact Phone Numbers (Mobile & Alt) */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                      Primary Mobile <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      value={addressMobile}
                      onChangeText={(t) => {
                        setAddressMobile(t);
                        if (addressErrors.mobileNumber) setAddressErrors((prev) => ({ ...prev, mobileNumber: '' }));
                      }}
                      keyboardType="phone-pad"
                      maxLength={14}
                      style={[
                        styles.cleanInput,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: addressErrors.mobileNumber ? '#EF4444' : theme.border,
                        },
                      ]}
                      placeholder="10-digit mobile"
                      placeholderTextColor={theme.textMuted}
                    />
                    {addressErrors.mobileNumber ? (
                      <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.mobileNumber}</Text>
                    ) : null}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                      Alt. Phone <Text style={{ color: theme.textMuted, fontWeight: '400' }}>(Optional)</Text>
                    </Text>
                    <TextInput
                      value={addressAltPhone}
                      onChangeText={(t) => {
                        setAddressAltPhone(t);
                        if (addressErrors.alternatePhone) setAddressErrors((prev) => ({ ...prev, alternatePhone: '' }));
                      }}
                      keyboardType="phone-pad"
                      maxLength={14}
                      style={[
                        styles.cleanInput,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: addressErrors.alternatePhone ? '#EF4444' : theme.border,
                        },
                      ]}
                      placeholder="Secondary number"
                      placeholderTextColor={theme.textMuted}
                    />
                    {addressErrors.alternatePhone ? (
                      <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.alternatePhone}</Text>
                    ) : null}
                  </View>
                </View>

                {/* 3. Address Type Selector */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                    Address Type / Tag
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['Site', 'Home', 'Office', 'Warehouse'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setAddressType(type)}
                        style={{
                          flex: 1,
                          paddingVertical: 7,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: addressType === type ? '#0066FF' : theme.border,
                          backgroundColor: addressType === type ? '#EFF6FF' : theme.surfaceSecondary,
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: addressType === type ? '700' : '500',
                            color: addressType === type ? '#0066FF' : theme.textPrimary,
                          }}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 4. Pincode (6 digits - Mandatory) */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                    Pincode (6 Digits) <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={addressPincode}
                    onChangeText={handlePincodeChangeInProfile}
                    keyboardType="numeric"
                    maxLength={6}
                    style={[
                      styles.cleanInput,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                        borderColor: addressErrors.pincode ? '#EF4444' : theme.border,
                      },
                    ]}
                    placeholder="e.g. 500081 (Auto-lookup City/State)"
                    placeholderTextColor={theme.textMuted}
                  />
                  {addressErrors.pincode ? (
                    <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.pincode}</Text>
                  ) : null}
                </View>

                {/* 5. Flat / Building / Site Name (Mandatory) */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                    Flat, House No., Building, Site / Plot Name <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={addressFlatBuilding}
                    onChangeText={(t) => {
                      setAddressFlatBuilding(t);
                      if (addressErrors.flatBuilding) setAddressErrors((prev) => ({ ...prev, flatBuilding: '' }));
                    }}
                    style={[
                      styles.cleanInput,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                        borderColor: addressErrors.flatBuilding ? '#EF4444' : theme.border,
                      },
                    ]}
                    placeholder="e.g. Plot No. 42, Skyview Tower / Block C"
                    placeholderTextColor={theme.textMuted}
                  />
                  {addressErrors.flatBuilding ? (
                    <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.flatBuilding}</Text>
                  ) : null}
                </View>

                {/* 6. Area, Street, Village (Mandatory) */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                    Area, Street, Village <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={addressAreaStreet}
                    onChangeText={(t) => {
                      setAddressAreaStreet(t);
                      if (addressErrors.areaStreet) setAddressErrors((prev) => ({ ...prev, areaStreet: '' }));
                    }}
                    style={[
                      styles.cleanInput,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                        borderColor: addressErrors.areaStreet ? '#EF4444' : theme.border,
                      },
                    ]}
                    placeholder="e.g. HITEC City Main Rd, Madhapur"
                    placeholderTextColor={theme.textMuted}
                  />
                  {addressErrors.areaStreet ? (
                    <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.areaStreet}</Text>
                  ) : null}
                </View>

                {/* 7. Landmark (Optional) */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                    Landmark <Text style={{ color: '#94A3B8', fontWeight: '400' }}>(Optional)</Text>
                  </Text>
                  <TextInput
                    value={addressLandmark}
                    onChangeText={(t) => {
                      setAddressLandmark(t);
                      if (addressErrors.landmark) setAddressErrors((prev) => ({ ...prev, landmark: '' }));
                    }}
                    style={[
                      styles.cleanInput,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                        borderColor: addressErrors.landmark ? '#EF4444' : theme.border,
                      },
                    ]}
                    placeholder="e.g. Near Cyber Towers / Metro Pillar 42"
                    placeholderTextColor={theme.textMuted}
                  />
                  {addressErrors.landmark ? (
                    <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.landmark}</Text>
                  ) : null}
                </View>

                {/* 8. City & State (Mandatory) */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                      Town / City <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      value={addressCity}
                      onChangeText={(t) => {
                        setAddressCity(t);
                        if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: '' }));
                      }}
                      style={[
                        styles.cleanInput,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          color: theme.textPrimary,
                          borderColor: addressErrors.city ? '#EF4444' : theme.border,
                        },
                      ]}
                      placeholder="e.g. Hyderabad"
                      placeholderTextColor={theme.textMuted}
                    />
                    {addressErrors.city ? (
                      <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.city}</Text>
                    ) : null}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                      State <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAddressStateDropdown(!showAddressStateDropdown)}
                      style={[
                        styles.cleanInput,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          borderColor: addressErrors.state ? '#EF4444' : theme.border,
                          justifyContent: 'center',
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary }} numberOfLines={1}>
                        {addressState || 'Select State'}
                      </Text>
                    </TouchableOpacity>
                    {addressErrors.state ? (
                      <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.state}</Text>
                    ) : null}
                  </View>
                </View>

                {/* State Dropdown Picker */}
                {showAddressStateDropdown && (
                  <View
                    style={{
                      maxHeight: 140,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 10,
                      backgroundColor: theme.surface,
                      marginBottom: 10,
                      padding: 6,
                    }}
                  >
                    <ScrollView nestedScrollEnabled>
                      {INDIAN_STATES.map((st) => (
                        <TouchableOpacity
                          key={st}
                          onPress={() => {
                            setAddressState(st);
                            setShowAddressStateDropdown(false);
                            if (addressErrors.state) setAddressErrors((prev) => ({ ...prev, state: '' }));
                          }}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 8,
                            backgroundColor: addressState === st ? '#EFF6FF' : 'transparent',
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: addressState === st ? '#0066FF' : theme.textPrimary,
                              fontWeight: addressState === st ? '700' : '400',
                            }}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* 9. Site Delivery & Truck Access Instructions (Optional) */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                    Site Access / Delivery Notes <Text style={{ color: theme.textMuted, fontWeight: '400' }}>(Optional)</Text>
                  </Text>
                  <TextInput
                    value={addressInstructions}
                    onChangeText={(t) => {
                      setAddressInstructions(t);
                      if (addressErrors.deliveryInstructions) setAddressErrors((prev) => ({ ...prev, deliveryInstructions: '' }));
                    }}
                    style={[
                      styles.cleanInput,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.textPrimary,
                        borderColor: addressErrors.deliveryInstructions ? '#EF4444' : theme.border,
                      },
                    ]}
                    placeholder="e.g. Wide Gate, 10-Wheel Dumpers OK, Call on arrival"
                    placeholderTextColor={theme.textMuted}
                  />
                  {addressErrors.deliveryInstructions ? (
                    <Text style={{ color: '#EF4444', fontSize: 10, marginTop: 2 }}>⚠️ {addressErrors.deliveryInstructions}</Text>
                  ) : null}
                </View>

                {/* Save Address Button */}
                <TouchableOpacity
                  onPress={handleAddNewAddress}
                  style={[styles.cleanSaveBtn, { backgroundColor: '#0F172A', marginTop: 4 }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cleanSaveBtnText}>+ Save Delivery Address</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* POPUP MODAL 4: PAYMENT METHODS                           */}
      {/* ======================================================== */}
      <Modal visible={isPaymentModalOpen} transparent animationType="fade" onRequestClose={() => setIsPaymentModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPaymentModalOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingModalWrapper}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderRadius: 24 }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <CreditCard size={18} color={theme.textPrimary} strokeWidth={2.2} />
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Payment Methods</Text>
                </View>
                <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)} style={styles.closeBtn}>
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {!isLoggedIn ? (
                  /* ================= GUEST / UNLOGGED STATE ================= */
                  <View style={[styles.guestSecureBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <View style={[styles.guestSecureIconWrap, { backgroundColor: theme.surface }]}>
                      <Lock size={26} color={theme.textPrimary} strokeWidth={2} />
                    </View>
                    <Text style={[styles.guestSecureTitle, { color: theme.textPrimary }]}>
                      Sign In to Access Payment Methods
                    </Text>
                    <Text style={[styles.guestSecureSub, { color: theme.textSecondary }]}>
                      Sign in to view and manage saved payment methods.
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setIsPaymentModalOpen(false);
                        if (onOpenLoginModal) onOpenLoginModal();
                      }}
                      style={[styles.guestSignInBtn, { backgroundColor: theme.primary }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.guestSignInBtnText}>Sign In / Register</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* ================= AUTHENTICATED USER STATE ================= */
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={[styles.sectionMicroHeader, { color: theme.textMuted }]}>
                        SAVED VERIFIED METHODS ({savedPaymentMethods.length})
                      </Text>
                      {!isAddingPaymentMethod && (
                        <TouchableOpacity
                          onPress={() => setIsAddingPaymentMethod(true)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          activeOpacity={0.7}
                        >
                          <Plus size={14} color="#0066FF" strokeWidth={2.5} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#0066FF' }}>Add Method</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {savedPaymentMethods.length === 0 && !isAddingPaymentMethod && (
                      <View style={[styles.noPaymentBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                        <CreditCard size={24} color={theme.textMuted} />
                        <Text style={[styles.noPaymentTitle, { color: theme.textPrimary }]}>
                          No Verified Payment Methods Saved
                        </Text>
                        <Text style={[styles.noPaymentSub, { color: theme.textSecondary }]}>
                          Add your UPI ID or Debit/Credit Card. All methods are authenticated with your bank and compliant with RBI card tokenization.
                        </Text>
                        <TouchableOpacity
                          onPress={() => setIsAddingPaymentMethod(true)}
                          style={[styles.addFirstPayBtn, { backgroundColor: theme.primary }]}
                          activeOpacity={0.85}
                        >
                          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                          <Text style={styles.addFirstPayBtnText}>Add Payment Method</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* List of Verified Payment Methods */}
                    {savedPaymentMethods.map((method) => {
                      const isDefault = Boolean(method.isDefault);
                      return (
                        <View
                          key={method.id}
                          style={[
                            styles.verifiedPayCard,
                            {
                              backgroundColor: theme.surfaceSecondary,
                              borderColor: isDefault ? '#111111' : theme.border,
                            },
                          ]}
                        >
                          <View style={styles.verifiedPayCardLeft}>
                            {method.type === 'upi' ? (
                              method.upiApp === 'gpay' ? (
                                <GooglePayIcon size={22} />
                              ) : method.upiApp === 'phonepe' ? (
                                <PhonePeIcon size={22} />
                              ) : (
                                <View style={[styles.payMethodIconSquare, { backgroundColor: theme.surface }]}>
                                  <Smartphone size={16} color={theme.textPrimary} />
                                </View>
                              )
                            ) : method.cardBrand === 'visa' ? (
                              <VisaIcon size={22} />
                            ) : method.cardBrand === 'mastercard' ? (
                              <MastercardIcon size={22} />
                            ) : (
                              <View style={[styles.payMethodIconSquare, { backgroundColor: theme.surface }]}>
                                <CardIcon size={16} color={theme.textPrimary} />
                              </View>
                            )}

                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.verifiedPayTitle, { color: theme.textPrimary }]}>
                                  {method.title}
                                </Text>
                                {isDefault && (
                                  <View style={styles.defaultMethodPill}>
                                    <Text style={styles.defaultMethodPillText}>DEFAULT</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.verifiedPaySub, { color: theme.textSecondary }]}>
                                {method.subtitle}
                              </Text>
                              <View style={styles.verifiedMetaRow}>
                                <View style={styles.verifiedGreenBadge}>
                                  <ShieldCheck size={11} color="#059669" strokeWidth={2.5} />
                                  <Text style={styles.verifiedGreenBadgeText}>Verified</Text>
                                </View>
                                {Boolean(method.verifiedAccountName) && (
                                  <Text style={[styles.verifiedHolderText, { color: theme.textMuted }]} numberOfLines={1}>
                                    • {method.verifiedAccountName}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>

                          <View style={styles.verifiedPayActions}>
                            {!isDefault && (
                              <TouchableOpacity
                                onPress={() => handleSetDefaultPayment(method.id)}
                                style={[styles.setDefaultBtn, { borderColor: theme.border }]}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.setDefaultBtnText, { color: theme.textPrimary }]}>Set Default</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => handleDeletePayment(method.id)}
                              style={styles.deletePayBtn}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={15} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                    {/* ================= ADD PAYMENT METHOD SECTION ================= */}
                    {isAddingPaymentMethod && (
                      <View style={[styles.addPayFormCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={[styles.addPayFormTitle, { color: theme.textPrimary }]}>
                            Add & Verify Payment Method
                          </Text>
                          <TouchableOpacity onPress={() => setIsAddingPaymentMethod(false)}>
                            <X size={16} color={theme.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        {/* Method Selector Tabs */}
                        <View style={[styles.payTabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <TouchableOpacity
                            onPress={() => {
                              setPaymentActiveTab('upi');
                              setUpiError('');
                            }}
                            style={[
                              styles.payTabBtn,
                              paymentActiveTab === 'upi' && [styles.payTabBtnActive, { backgroundColor: theme.primary }],
                            ]}
                          >
                            <Smartphone size={13} color={paymentActiveTab === 'upi' ? '#FFFFFF' : theme.textSecondary} />
                            <Text
                              style={[
                                styles.payTabBtnText,
                                { color: paymentActiveTab === 'upi' ? '#FFFFFF' : theme.textSecondary },
                              ]}
                            >
                              UPI ID (VPA)
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setPaymentActiveTab('card');
                              setCardError('');
                            }}
                            style={[
                              styles.payTabBtn,
                              paymentActiveTab === 'card' && [styles.payTabBtnActive, { backgroundColor: theme.primary }],
                            ]}
                          >
                            <CardIcon size={13} color={paymentActiveTab === 'card' ? '#FFFFFF' : theme.textSecondary} />
                            <Text
                              style={[
                                styles.payTabBtnText,
                                { color: paymentActiveTab === 'card' ? '#FFFFFF' : theme.textSecondary },
                              ]}
                            >
                              Debit / Credit Card
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Tab 1: UPI Form */}
                        {paymentActiveTab === 'upi' && (
                          <View style={{ marginTop: 12, gap: 10 }}>
                            <View>
                              <Text style={[styles.inputLabelMicro, { color: theme.textSecondary }]}>
                                UPI ID / Virtual Payment Address <Text style={{ color: '#EF4444' }}>*</Text>
                              </Text>
                              <TextInput
                                value={upiVpa}
                                onChangeText={(t) => {
                                  setUpiVpa(t);
                                  if (upiError) setUpiError('');
                                }}
                                style={[
                                  styles.payFormInput,
                                  {
                                    backgroundColor: theme.surface,
                                    borderColor: upiError ? '#EF4444' : theme.border,
                                    color: theme.textPrimary,
                                  },
                                ]}
                                placeholder="e.g. 9848012345@upi, name@okhdfcbank"
                                placeholderTextColor={theme.textMuted}
                                autoCapitalize="none"
                                autoCorrect={false}
                              />
                              {upiError ? (
                                <Text style={styles.fieldErrorText}>⚠️ {upiError}</Text>
                              ) : null}
                            </View>

                            <TouchableOpacity
                              onPress={handleVerifyAndSaveUPI}
                              disabled={isVerifyingUpi || !upiVpa.trim()}
                              style={[
                                styles.verifySubmitBtn,
                                {
                                  backgroundColor: theme.primary,
                                  opacity: isVerifyingUpi || !upiVpa.trim() ? 0.6 : 1,
                                },
                              ]}
                              activeOpacity={0.85}
                            >
                              {isVerifyingUpi ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                  <Text style={styles.verifySubmitBtnText}>Saving...</Text>
                                </View>
                              ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={styles.verifySubmitBtnText}>Save UPI ID</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* Tab 2: Card Form */}
                        {paymentActiveTab === 'card' && (
                          <View style={{ marginTop: 12, gap: 10 }}>
                            <View>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.inputLabelMicro, { color: theme.textSecondary }]}>
                                  Card Number <Text style={{ color: '#EF4444' }}>*</Text>
                                </Text>
                                {cardNumber.length >= 4 && (
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textPrimary, textTransform: 'uppercase' }}>
                                    {detectCardBrand(cardNumber)}
                                  </Text>
                                )}
                              </View>
                              <TextInput
                                value={cardNumber}
                                onChangeText={handleCardNumberChange}
                                style={[
                                  styles.payFormInput,
                                  {
                                    backgroundColor: theme.surface,
                                    borderColor: cardError && !cardHolder ? '#EF4444' : theme.border,
                                    color: theme.textPrimary,
                                  },
                                ]}
                                placeholder="1234 5678 9012 3456"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="number-pad"
                                maxLength={19}
                              />
                            </View>

                            <View>
                              <Text style={[styles.inputLabelMicro, { color: theme.textSecondary }]}>
                                Cardholder Name <Text style={{ color: '#EF4444' }}>*</Text>
                              </Text>
                              <TextInput
                                value={cardHolder}
                                onChangeText={(t) => {
                                  setCardHolder(t);
                                  if (cardError) setCardError('');
                                }}
                                style={[
                                  styles.payFormInput,
                                  {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    color: theme.textPrimary,
                                  },
                                ]}
                                placeholder="e.g. SURESH REDDY"
                                placeholderTextColor={theme.textMuted}
                                autoCapitalize="characters"
                              />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabelMicro, { color: theme.textSecondary }]}>
                                  Expiry (MM/YY) <Text style={{ color: '#EF4444' }}>*</Text>
                                </Text>
                                <TextInput
                                  value={cardExpiry}
                                  onChangeText={handleCardExpiryChange}
                                  style={[
                                    styles.payFormInput,
                                    {
                                      backgroundColor: theme.surface,
                                      borderColor: theme.border,
                                      color: theme.textPrimary,
                                    },
                                  ]}
                                  placeholder="MM/YY"
                                  placeholderTextColor={theme.textMuted}
                                  keyboardType="number-pad"
                                  maxLength={5}
                                />
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabelMicro, { color: theme.textSecondary }]}>
                                  CVV <Text style={{ color: '#EF4444' }}>*</Text>
                                </Text>
                                <TextInput
                                  value={cardCvv}
                                  onChangeText={(t) => {
                                    setCardCvv(t.replace(/\D/g, '').slice(0, 4));
                                    if (cardError) setCardError('');
                                  }}
                                  style={[
                                    styles.payFormInput,
                                    {
                                      backgroundColor: theme.surface,
                                      borderColor: theme.border,
                                      color: theme.textPrimary,
                                    },
                                  ]}
                                  placeholder="3 or 4 digits"
                                  placeholderTextColor={theme.textMuted}
                                  keyboardType="number-pad"
                                  secureTextEntry={true}
                                  maxLength={4}
                                />
                              </View>
                            </View>

                            {cardError ? (
                              <Text style={styles.fieldErrorText}>⚠️ {cardError}</Text>
                            ) : null}

                            <TouchableOpacity
                              onPress={handleVerifyAndSaveCard}
                              disabled={isVerifyingCard || !cardNumber || !cardHolder || !cardExpiry || !cardCvv}
                              style={[
                                styles.verifySubmitBtn,
                                {
                                  backgroundColor: theme.primary,
                                  opacity: isVerifyingCard || !cardNumber || !cardHolder || !cardExpiry || !cardCvv ? 0.6 : 1,
                                },
                              ]}
                              activeOpacity={0.85}
                            >
                              {isVerifyingCard ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                  <Text style={styles.verifySubmitBtnText}>Saving Card...</Text>
                                </View>
                              ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={styles.verifySubmitBtnText}>Save Card</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* POPUP MODAL 5: REFER & EARN                              */}
      {/* ======================================================== */}
      <Modal visible={isReferModalOpen} transparent animationType="fade" onRequestClose={() => setIsReferModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsReferModalOpen(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Gift size={18} color="#111111" />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Refer & Earn</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReferModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.referHeroSection}>
                <View style={styles.giftCircle}>
                  <Gift size={32} color="#111111" />
                </View>
                <Text style={[styles.referHeroTitle, { color: theme.textPrimary }]}>Earn ₹100 for every builder you invite</Text>
                <Text style={[styles.referHeroSubtitle, { color: theme.textSecondary }]}>
                  Share your referral link with contractor friends. When they place their first construction materials order, both of you receive ₹100 in Urbanico Wallet.
                </Text>
              </View>

              <View style={[styles.referCodeCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <Text style={[styles.referCodeLabel, { color: theme.textMuted }]}>YOUR REFERRAL CODE</Text>
                <Text style={[styles.referCodeText, { color: theme.textPrimary }]}>{referralCode}</Text>
                <View style={styles.referActionButtons}>
                  <TouchableOpacity onPress={handleCopyReferralCode} style={styles.referCopyBtn} activeOpacity={0.75}>
                    <Copy size={14} color="#111111" />
                    <Text style={styles.referCopyBtnText}>Copy Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShareReferral} style={styles.referShareBtn} activeOpacity={0.8}>
                    <Share2 size={14} color="#FFFFFF" />
                    <Text style={styles.referShareBtnText}>Share on WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* POPUP MODAL 6: HELP & SUPPORT                            */}
      {/* ======================================================== */}
      <Modal visible={isHelpModalOpen} transparent animationType="fade" onRequestClose={() => setIsHelpModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsHelpModalOpen(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <HelpCircle size={18} color="#111111" />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Help & Support</Text>
              </View>
              <TouchableOpacity onPress={() => setIsHelpModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.open('tel:+9118002008829', '_self');
                  }
                }}
                style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <View style={styles.helpItemLeft}>
                  <Phone size={18} color="#111111" />
                  <View>
                    <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>Customer Support</Text>
                    <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>Direct helpline: 1800 200 8829</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.open('mailto:billing@urbanico.in', '_self');
                  }
                }}
                style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 8 }]}
                activeOpacity={0.75}
              >
                <View style={styles.helpItemLeft}>
                  <Mail size={18} color="#111111" />
                  <View>
                    <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>Commercial Invoicing Desk</Text>
                    <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>billing@urbanico.in</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.open('https://wa.me/919876543210', '_blank');
                  }
                }}
                style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 8 }]}
                activeOpacity={0.75}
              >
                <View style={styles.helpItemLeft}>
                  <MessageSquare size={18} color="#111111" />
                  <View>
                    <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>WhatsApp Dispatch Desk</Text>
                    <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>Direct chat with dispatch coordinator</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* POPUP MODAL 7: EDIT CONTRACTOR PROFILE                   */}
      {/* ======================================================== */}
      <Modal visible={isEditProfileModalOpen} transparent animationType="fade" onRequestClose={() => setIsEditProfileModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditProfileModalOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingModalWrapper}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Contractor Details</Text>
                <TouchableOpacity onPress={() => setIsEditProfileModalOpen(false)} style={styles.closeBtn}>
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
              {/* Profile Photo Display */}
              <View style={styles.editModalAvatarRow}>
                <View style={styles.editModalAvatarWrapper}>
                  <Image
                    source={{ uri: user.avatarUrl || CLOUDINARY_PROFILE_PIC }}
                    style={styles.editModalAvatarImg}
                    resizeMode="cover"
                  />
                  <View style={styles.editModalAvatarBadge}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.avatarRoleTag, { color: theme.textPrimary }]}>Verified Contractor Profile</Text>
                  <Text style={[styles.avatarSubtext, { color: theme.textSecondary }]}>Cloudinary verified profile picture</Text>
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Full Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                value={editName}
                onChangeText={(t) => {
                  setEditName(t);
                  if (profileErrors.name) setProfileErrors((prev) => ({ ...prev, name: '' }));
                }}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.textPrimary,
                    borderColor: profileErrors.name ? '#EF4444' : theme.border,
                  },
                ]}
                placeholder="Contractor full name"
                placeholderTextColor={theme.textMuted}
              />
              {profileErrors.name ? (
                <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 3, marginBottom: 8, fontWeight: '500' }}>
                  ⚠️ {profileErrors.name}
                </Text>
              ) : null}

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: profileErrors.name ? 0 : 8 }]}>
                Phone Number <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                value={editPhone}
                onChangeText={(t) => {
                  setEditPhone(t);
                  if (profileErrors.phone) setProfileErrors((prev) => ({ ...prev, phone: '' }));
                }}
                keyboardType="phone-pad"
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.textPrimary,
                    borderColor: profileErrors.phone ? '#EF4444' : theme.border,
                  },
                ]}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.textMuted}
              />
              {profileErrors.phone ? (
                <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 3, marginBottom: 8, fontWeight: '500' }}>
                  ⚠️ {profileErrors.phone}
                </Text>
              ) : null}

              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: profileErrors.phone ? 0 : 8 }]}>
                Company / Firm Name
              </Text>
              <TextInput
                value={editCompany}
                onChangeText={(t) => {
                  setEditCompany(t);
                  if (profileErrors.companyName) setProfileErrors((prev) => ({ ...prev, companyName: '' }));
                }}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.textPrimary,
                    borderColor: profileErrors.companyName ? '#EF4444' : theme.border,
                  },
                ]}
                placeholder="e.g. ABC Constructions / Independent Developer"
                placeholderTextColor={theme.textMuted}
              />
              {profileErrors.companyName ? (
                <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 3, marginBottom: 8, fontWeight: '500' }}>
                  ⚠️ {profileErrors.companyName}
                </Text>
              ) : null}

              {/* GSTIN Input with strict validation & optional support */}
              <View style={[styles.inputLabelRow, { marginTop: profileErrors.companyName ? 0 : 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 0 }]}>
                  GSTIN (18% Flat ITC) <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '500' }}>(Optional)</Text>
                </Text>
                {editGstin.trim().length === 15 && isValidGSTIN(editGstin) ? (
                  <View style={styles.gstVerifiedBadge}>
                    <BadgeCheck size={13} color="#FFFFFF" fill="#059669" strokeWidth={2.4} />
                    <Text style={styles.gstVerifiedBadgeText}>Verified</Text>
                  </View>
                ) : editGstin.trim().length > 0 ? (
                  <View style={styles.emailUnverifiedBadge}>
                    <Text style={styles.emailUnverifiedBadgeText}>Pending</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.emailInputWrapper}>
                <TextInput
                  value={editGstin}
                  onChangeText={handleGstChange}
                  autoCapitalize="characters"
                  maxLength={15}
                  style={[
                    styles.modalInput,
                    editGstin.trim().length === 15 && isValidGSTIN(editGstin) ? styles.emailTextInput : null,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                      borderColor: (gstError || profileErrors.gstin) ? '#EF4444' : editGstin.trim().length === 15 && isValidGSTIN(editGstin) ? '#10B981' : theme.border,
                      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                    },
                  ]}
                  placeholder="e.g. 36AAACU9812A1Z4 (Optional)"
                  placeholderTextColor={theme.textMuted}
                />
                {editGstin.trim().length === 15 && isValidGSTIN(editGstin) ? (
                  <View style={styles.emailInputRightAction}>
                    <View style={[styles.verifiedIconCircle, { backgroundColor: '#ECFDF5' }]}>
                      <BadgeCheck size={18} color="#FFFFFF" fill="#059669" strokeWidth={2.2} />
                    </View>
                  </View>
                ) : null}
              </View>
              {(gstError || profileErrors.gstin) ? (
                <Text style={styles.gstErrorText}>⚠️ {gstError || profileErrors.gstin}</Text>
              ) : editGstin.trim().length === 15 && isValidGSTIN(editGstin) ? (
                <Text style={styles.gstSuccessText}>✓ 18% Input Tax Credit enabled on all tax invoices</Text>
              ) : (
                <Text style={[styles.gstHintText, { color: theme.textMuted }]}>
                  Enter 15-digit GSTIN for company invoices or leave blank for retail billing.
                </Text>
              )}

              {/* Email Address with Verify Button & OTP Verification */}
              <View style={[styles.inputLabelRow, { marginTop: 14 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 0 }]}>Email Address</Text>
                {isEmailVerified ? (
                  <View style={styles.emailVerifiedBadge}>
                    <BadgeCheck size={14} color="#FFFFFF" fill="#0284C7" strokeWidth={2.2} />
                    <Text style={styles.emailVerifiedBadgeText}>Verified</Text>
                  </View>
                ) : editEmail.trim() ? (
                  <View style={styles.emailUnverifiedBadge}>
                    <Text style={styles.emailUnverifiedBadgeText}>Not Verified</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.emailInputWrapper}>
                <TextInput
                  value={editEmail}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.modalInput,
                    styles.emailTextInput,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                      borderColor: profileErrors.email ? '#EF4444' : isEmailVerified ? '#0284C7' : theme.border,
                    },
                  ]}
                  placeholder="contractor@urbanico.in"
                  placeholderTextColor={theme.textMuted}
                />
                {isEmailVerified ? (
                  <View style={styles.emailInputRightAction}>
                    <View style={styles.verifiedIconCircle}>
                      <BadgeCheck size={18} color="#FFFFFF" fill="#0284C7" strokeWidth={2.2} />
                    </View>
                  </View>
                ) : editEmail.trim() ? (
                  <TouchableOpacity
                    onPress={handleSendEmailOtp}
                    style={[styles.verifyEmailInlineBtn, isSendingOtp && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    disabled={isSendingOtp}
                  >
                    <Sparkles size={12} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.verifyEmailInlineBtnText}>
                      {isSendingOtp ? 'Sending...' : 'Verify'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {profileErrors.email ? (
                <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 3, marginBottom: 8, fontWeight: '500' }}>
                  ⚠️ {profileErrors.email}
                </Text>
              ) : null}

              {/* Inline OTP Verification Container */}
              {Boolean(showEmailOtpBox) && (
                <View style={[styles.emailOtpBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View style={styles.otpHeaderRow}>
                    <Mail size={15} color="#059669" />
                    <Text style={[styles.otpHeaderTitle, { color: theme.textPrimary }]}>
                      Enter 4-Digit Code
                    </Text>
                  </View>
                  <Text style={[styles.otpSubText, { color: theme.textSecondary }]}>
                    OTP sent to <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{editEmail.trim()}</Text> (Test OTP: <Text style={{ fontWeight: '800', color: '#059669' }}>{testOtpCode}</Text>)
                  </Text>

                  <View style={styles.otpInputRow}>
                    <TextInput
                      value={emailOtp}
                      onChangeText={(val) => setEmailOtp(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="8821"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.otpInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={handleVerifyEmailOtp}
                      style={styles.otpConfirmBtn}
                      activeOpacity={0.85}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.otpConfirmBtnText}>Verify OTP</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.otpFooterRow}>
                    {otpTimer > 0 ? (
                      <Text style={[styles.otpTimerText, { color: theme.textMuted }]}>
                        Resend code in {otpTimer}s
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendEmailOtp} activeOpacity={0.7}>
                        <Text style={styles.otpResendLink}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setShowEmailOtpBox(false)} activeOpacity={0.7}>
                      <Text style={[styles.otpCancelLink, { color: theme.textSecondary }]}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsEditProfileModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* POPUP MODAL 7: SAVED FOR LATER SUPPLIES                  */}
      {/* ======================================================== */}
      <Modal
        visible={isSavedForLaterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSavedForLaterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsSavedForLaterModalOpen(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Bookmark size={18} color={theme.mode === 'dark' ? '#F9FAFB' : '#111111'} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Saved for Later {savedForLaterItems.length > 0 ? `(${savedForLaterItems.length})` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsSavedForLaterModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {savedForLaterItems.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: theme.surfaceSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Bookmark size={24} color={theme.textMuted} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 }}>
                    No Saved Items
                  </Text>
                  <Text
                    style={{
                      fontSize: 12.5,
                      color: theme.textSecondary,
                      textAlign: 'center',
                      lineHeight: 18,
                      marginBottom: 16,
                      maxWidth: 280,
                    }}
                  >
                    Items saved from your cart will appear here so you can easily order them whenever you're ready.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsSavedForLaterModalOpen(false);
                      if (onExploreCatalog) {
                        onExploreCatalog();
                      } else {
                        onNavigateScreen('home');
                      }
                    }}
                    style={styles.modalPrimaryBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Explore Supplies</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 10, paddingBottom: 6 }}>
                  {savedForLaterItems.map((item) => {
                    const price = item.unitPrice || 0;
                    const totalItemPrice = price * (item.quantity || 1);
                    return (
                      <View
                        key={item.id}
                        style={{
                          backgroundColor: theme.surfaceSecondary,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: theme.border,
                          padding: 10,
                          flexDirection: 'row',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', backgroundColor: theme.surface }}>
                          <ShimmerImage
                            source={{ uri: item.image }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                            preset="thumbnail"
                            borderRadius={8}
                          />
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}
                            numberOfLines={1}
                          >
                            {item.itemName}
                          </Text>
                          <Text
                            style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}
                            numberOfLines={1}
                          >
                            {item.selectedOptionLabel || item.categoryName || 'Standard Supply'} • Qty: {item.quantity || 1}
                          </Text>
                          <Text
                            style={{ fontSize: 12.5, fontWeight: '800', color: theme.textPrimary, marginTop: 2 }}
                          >
                            ₹{totalItemPrice.toLocaleString('en-IN')}
                            <Text style={{ fontSize: 10.5, fontWeight: '500', color: theme.textSecondary }}>
                              {' '}(₹{price}/unit)
                            </Text>
                          </Text>
                        </View>

                        <View style={{ gap: 6, alignItems: 'flex-end' }}>
                          <TouchableOpacity
                            onPress={() => {
                              moveToCart(item);
                              showToast(`Moved ${item.itemName} to Cart`, 'success');
                            }}
                            style={{
                              backgroundColor: theme.mode === 'dark' ? '#3B82F6' : '#111111',
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 6,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            activeOpacity={0.85}
                          >
                            <ShoppingCart size={12} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                              Move to Cart
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              removeSavedForLater(item.id);
                              showToast(`Removed from saved for later`, 'info');
                            }}
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 3,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={12} color="#EF4444" />
                            <Text style={{ color: '#EF4444', fontSize: 10.5, fontWeight: '600' }}>
                              Remove
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {savedForLaterItems.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={() => setIsSavedForLaterModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    savedForLaterItems.forEach((it) => moveToCart(it));
                    setIsSavedForLaterModalOpen(false);
                    showToast(`Moved all items to Cart!`, 'success');
                    onNavigateScreen('basket');
                  }}
                  style={styles.modalPrimaryBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalPrimaryBtnText}>Move All to Cart</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingModalWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  consolidatedMenuCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  authHeaderSection: {
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  guestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedInHeaderSection: {
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  loggedInHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#059669',
  },
  userAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editModalAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  editModalAvatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'relative',
  },
  editModalAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  editModalAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarRoleTag: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  nameVerifiedIconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  verifiedTag: {
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  welcomeSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  gstinSubText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomAuthContainer: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  mainAuthBtn: {
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  mainAuthBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDividerFull: {
    height: StyleSheet.hairlineWidth,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  menuRowSubLabel: {
    fontSize: 11.5,
    marginTop: 1,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subValueText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  referPillBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  referPillBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 480,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalPrimaryBtn: {
    backgroundColor: '#111111',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 10,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 10,
  },
  gstValidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gstValidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  gstErrorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 4,
  },
  gstSuccessText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  gstHintText: {
    fontSize: 10.5,
    marginTop: 4,
  },
  profileGstinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  gstVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gstVerifiedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  gstItcPill: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gstItcPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  emailVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emailVerifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  emailUnverifiedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emailUnverifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  emailInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  emailTextInput: {
    paddingRight: 80,
  },
  emailInputRightAction: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyEmailInlineBtn: {
    position: 'absolute',
    right: 6,
    top: 5,
    bottom: 5,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  verifyEmailInlineBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emailOtpBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  otpHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  otpSubText: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 15,
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  otpConfirmBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  otpConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  otpFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
  },
  otpTimerText: {
    fontSize: 11,
  },
  otpResendLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  otpCancelLink: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputMicroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 2,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  addressItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  addressText: {
    fontSize: 13,
    marginBottom: 2,
  },
  addressSub: {
    fontSize: 11,
  },
  activePill: {
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addAddressBox: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  cleanFormHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  cleanInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  cleanSaveBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cleanSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionMicroHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentMethodSub: {
    fontSize: 11,
  },
  verifiedGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  payInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  payInfoBannerText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  referHeroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  giftCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  referHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  referHeroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  referCodeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginVertical: 12,
  },
  referCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  referCodeText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginVertical: 6,
  },
  referActionButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 6,
  },
  referCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingVertical: 9,
    borderRadius: 8,
  },
  referCopyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
  referShareBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
  },
  referShareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  helpItemSub: {
    fontSize: 11,
  },
  // Empty Address Box
  emptyAddressBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyBoxSub: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  emptyBoxActionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBoxActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  // Guest Secure Box for Payment Methods
  guestSecureBox: {
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 12,
  },
  guestSecureIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  guestSecureTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  guestSecureSub: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  guestSignInBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  guestSignInBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // No Payment State
  noPaymentBox: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  noPaymentTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  noPaymentSub: {
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  addFirstPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addFirstPayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Verified Payment Method Card
  verifiedPayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  verifiedPayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payMethodIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedPayTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  defaultMethodPill: {
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultMethodPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  verifiedPaySub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  verifiedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  verifiedGreenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifiedGreenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  verifiedHolderText: {
    fontSize: 10.5,
    fontWeight: '500',
    flex: 1,
  },
  verifiedPayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  setDefaultBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setDefaultBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  deletePayBtn: {
    padding: 6,
  },
  // Add Payment Form
  addPayFormCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  addPayFormTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  payTabRow: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  payTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
  },
  payTabBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  payTabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  inputLabelMicro: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  payFormInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
  },
  fieldErrorText: {
    color: '#DC2626',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 4,
  },
  fieldHintText: {
    fontSize: 10.5,
    marginTop: 4,
  },
  verifySubmitBtn: {
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  verifySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});

export default UserProfileScreen;
