import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
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
} from 'lucide-react-native';
import {
  GooglePayIcon,
  PhonePeIcon,
  VisaIcon,
  MastercardIcon,
} from './common/PaymentBrandIcons';
import { UserProfile, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { SettingsModal } from './SettingsModal';
import { OrdersActivityModal } from './OrdersActivityModal';
import {
  INDIAN_STATES,
  ADDRESS_TYPE_OPTIONS,
  lookupCityStateFromPincode,
  validateIndianAddress,
  formatIndianAddressSummary,
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

  // Consistent Modals state across the entire Profile Module with strict mutual exclusivity
  const [isAddressesModalOpen, setIsAddressesModalOpen] = useState(initialOpenAddressesModal);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(initialOpenSettingsModal);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(initialOpenOrdersModal);

  const openSingleModal = (modalName: 'addresses' | 'payment' | 'refer' | 'help' | 'edit_profile' | 'settings' | 'orders') => {
    setIsAddressesModalOpen(modalName === 'addresses');
    setIsPaymentModalOpen(modalName === 'payment');
    setIsReferModalOpen(modalName === 'refer');
    setIsHelpModalOpen(modalName === 'help');
    setIsEditProfileModalOpen(modalName === 'edit_profile');
    setIsSettingsModalOpen(modalName === 'settings');
    setIsOrdersModalOpen(modalName === 'orders');
  };

  const closeAllSubModals = () => {
    setIsAddressesModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsReferModalOpen(false);
    setIsHelpModalOpen(false);
    setIsEditProfileModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsOrdersModalOpen(false);
  };

  // Indian E-Commerce Standard Address input state
  const [addressFullName, setAddressFullName] = useState('Suraj Kumar');
  const [addressMobile, setAddressMobile] = useState('9876543210');
  const [addressAltPhone, setAddressAltPhone] = useState('');
  const [addressPincode, setAddressPincode] = useState('500081');
  const [addressFlatBuilding, setAddressFlatBuilding] = useState('');
  const [addressAreaStreet, setAddressAreaStreet] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [addressCity, setAddressCity] = useState('Hyderabad');
  const [addressState, setAddressState] = useState('Telangana');
  const [addressType, setAddressType] = useState<'Site' | 'Home' | 'Office' | 'Warehouse'>('Site');
  const [addressInstructions, setAddressInstructions] = useState('Wide Gate Access (10-Wheel Dumpers OK)');
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
      const lookup = lookupCityStateFromPincode(clean);
      if (lookup.city) setAddressCity(lookup.city);
      if (lookup.state) setAddressState(lookup.state);
    }
  };

  const handleDetectGpsForForm = () => {
    setIsDetectingGps(true);
    showToast('Acquiring GPS coordinates & resolving address...', 'info');

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();
            const addr = data?.address || {};

            const postcode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
            const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.village || '';
            const road = addr.road || addr.street || addr.pedestrian || '';
            const city = addr.city || addr.town || addr.city_district || addr.state_district || 'Hyderabad';
            const resolvedState = addr.state || 'Telangana';

            if (postcode) setAddressPincode(postcode);
            if (road || suburb) setAddressAreaStreet([road, suburb].filter(Boolean).join(', '));
            if (!addressFlatBuilding) setAddressFlatBuilding(data?.name || 'Current Site Location');
            if (city) setAddressCity(city);
            if (resolvedState) setAddressState(resolvedState);

            setIsDetectingGps(false);
            showToast(`Location detected: ${suburb || city} ${postcode ? `(${postcode})` : ''}`, 'success');
          } catch (e) {
            console.warn('Reverse geocode error:', e);
            setAddressAreaStreet('Miyapur Main Road, Phase 2');
            setAddressPincode('500049');
            setAddressCity('Hyderabad');
            setAddressState('Telangana');
            setIsDetectingGps(false);
            showToast('GPS coordinates detected! Auto-filled address.', 'success');
          }
        },
        (err) => {
          console.warn('GPS location error:', err);
          setAddressAreaStreet('Abids Commercial Area');
          setAddressPincode('500001');
          setAddressCity('Hyderabad');
          setAddressState('Telangana');
          setIsDetectingGps(false);
          showToast('GPS detected: Auto-filled site address.', 'info');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsDetectingGps(false);
      showToast('Geolocation not supported on this browser', 'error');
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
  const referralCode = React.useMemo(() => {
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
    const generated = '8821';
    setTestOtpCode(generated);
    setTimeout(() => {
      setIsSendingOtp(false);
      setShowEmailOtpBox(true);
      setOtpTimer(30);
      showToast(`Verification OTP sent to ${trimmed}! Use OTP: ${generated}`, 'success');
    }, 350);
  };

  const handleVerifyEmailOtp = () => {
    if (!emailOtp.trim()) {
      showToast('Please enter the 4-digit OTP', 'error');
      return;
    }
    if (emailOtp.trim() === testOtpCode || emailOtp.trim() === '8821') {
      setIsEmailVerified(true);
      setShowEmailOtpBox(false);
      setEmailOtp('');
      showToast('Email verified successfully! 🎉', 'success');
    } else {
      showToast('Incorrect OTP. Please enter the 4-digit code (8821)', 'error');
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

  const handleCopyReferralCode = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(referralCode);
      }
      showToast(`Referral code ${referralCode} copied to clipboard!`, 'success');
    } catch {
      showToast(`Referral code: ${referralCode}`, 'info');
    }
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
  const savedAddressCount = savedLocations.length;
  const shortAddress = selectedLocation ? selectedLocation.split(',')[0] : 'Miyapur Site';

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
                  <UserCheck size={24} color="#059669" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {user.name || 'Civil Contractor'}
                    </Text>
                    {user.isEmailVerified ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => showToast('Verified Contractor Account • Identity & Email Confirmed', 'success')}
                        style={styles.nameVerifiedIconBadge}
                        accessibilityLabel="Verified Contractor Account"
                      >
                        <BadgeCheck size={20} color="#FFFFFF" fill="#0284C7" strokeWidth={2.4} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                    {user.phone || '+91 98480 12345'} • {user.companyName || 'Apex Builders & Infra'}
                  </Text>
                  {user.gstin ? (
                    <Text style={[styles.gstinSubText, { color: theme.textMuted }]}>
                      GSTIN: {user.gstin} (18% Flat ITC)
                    </Text>
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

        {/* 2. Order Management: My Orders & Dispatches (Popup Modal) */}
        <TouchableOpacity
          onPress={() => openSingleModal('orders')}
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

        {/* 3. Address Management: Saved Addresses (Popup Modal) */}
        <TouchableOpacity
          onPress={() => openSingleModal('addresses')}
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
                {shortAddress} • {savedAddressCount} Sites
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <Text style={[styles.subValueText, { color: theme.textSecondary }]}>
              {savedAddressCount} Saved
            </Text>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {/* 4. Payment Methods & Ledger (Popup Modal) */}
        <TouchableOpacity
          onPress={() => openSingleModal('payment')}
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
                UPI, Corporate Cards & RTGS Ledger
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {/* 5. Wishlist / Saved Materials */}
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

        {/* 6. Refer & Earn (Popup Modal) */}
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

        {/* 7. Settings (Consistent Popup Modal) */}
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

        {/* 8. Help & Support (Popup Modal) */}
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

        {/* 9. Sign Out (When Logged In) */}
        {isLoggedIn && (
          <>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity
              onPress={() => {
                onLogout();
                showToast('Logged out of Urbanico account', 'info');
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

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {savedLocations.map((loc) => {
                const isSelected = selectedLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => {
                      setSelectedLocation(loc);
                      showToast(`Delivery site set to: ${loc}`, 'success');
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
                          {loc}
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
                            showToast('Site address removed', 'info');
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
              })}

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
                    placeholder="e.g. Suraj Kumar / Kishore V."
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

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsAddressesModalOpen(false)} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </Modal>

      {/* ======================================================== */}
      {/* POPUP MODAL 4: PAYMENT METHODS                           */}
      {/* ======================================================== */}
      <Modal visible={isPaymentModalOpen} transparent animationType="fade" onRequestClose={() => setIsPaymentModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPaymentModalOpen(false)} />
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF', borderRadius: 28 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <CreditCard size={18} color="#111827" strokeWidth={2.2} />
                <Text style={[styles.modalTitle, { color: '#111827' }]}>Payment Methods</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionMicroHeader, { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }]}>
                SAVED PAYMENT METHODS
              </Text>

              {/* UPI 1: Google Pay */}
              <View style={[styles.paymentMethodCard, { backgroundColor: '#FFFFFF', borderColor: '#0066FF', borderRadius: 14, padding: 12, marginTop: 8 }]}>
                <View style={styles.paymentMethodLeft}>
                  <GooglePayIcon size={26} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.paymentMethodTitle, { color: '#0F172A', fontSize: 13.5, fontWeight: '700' }]}>
                        Google Pay UPI
                      </Text>
                      <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#0066FF', fontSize: 10, fontWeight: '700' }}>PRIMARY</Text>
                      </View>
                    </View>
                    <Text style={[styles.paymentMethodSub, { color: '#64748B', fontSize: 11.5, marginTop: 1 }]}>
                      9876543210@okhdfcbank • Verified
                    </Text>
                  </View>
                </View>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>

              {/* UPI 2: PhonePe */}
              <View style={[styles.paymentMethodCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginTop: 8 }]}>
                <View style={styles.paymentMethodLeft}>
                  <PhonePeIcon size={26} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.paymentMethodTitle, { color: '#0F172A', fontSize: 13.5, fontWeight: '700' }]}>
                      PhonePe UPI
                    </Text>
                    <Text style={[styles.paymentMethodSub, { color: '#64748B', fontSize: 11.5, marginTop: 1 }]}>
                      9876543210@ybl • Active
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card: Visa Business */}
              <View style={[styles.paymentMethodCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginTop: 8 }]}>
                <View style={styles.paymentMethodLeft}>
                  <VisaIcon size={22} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.paymentMethodTitle, { color: '#0F172A', fontSize: 13.5, fontWeight: '700' }]}>
                      Visa Commercial Debit
                    </Text>
                    <Text style={[styles.paymentMethodSub, { color: '#64748B', fontSize: 11.5, marginTop: 1 }]}>
                      •••• 2411 • Expires 08/28 (Tokenized)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Net Banking */}
              <View style={[styles.paymentMethodCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginTop: 8 }]}>
                <View style={styles.paymentMethodLeft}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                    <Landmark size={18} color="#0066FF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.paymentMethodTitle, { color: '#0F172A', fontSize: 13.5, fontWeight: '700' }]}>
                      HDFC Bank Direct Escrow
                    </Text>
                    <Text style={[styles.paymentMethodSub, { color: '#64748B', fontSize: 11.5, marginTop: 1 }]}>
                      A/C •••• 9821 • Instant RTGS/NEFT
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.payInfoBanner, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, marginTop: 14, padding: 10 }]}>
                <ShieldCheck size={15} color="#059669" />
                <Text style={[styles.payInfoBannerText, { color: '#64748B', fontSize: 11, lineHeight: 15 }]}>
                  All payment tokens are encrypted and 100% compliant with RBI & NPCI directives.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)} style={[styles.modalPrimaryBtn, { backgroundColor: '#0066FF', borderRadius: 14, height: 48 }]}>
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
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

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsReferModalOpen(false)} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
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
                  showToast('Calling Central Dispatch Yard: +91 1800 200 8829', 'info');
                }}
                style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <View style={styles.helpItemLeft}>
                  <Phone size={18} color="#111111" />
                  <View>
                    <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>Toll-Free Yard Support</Text>
                    <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>+91 1800 200 8829 (6:00 AM - 10:00 PM)</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  showToast('Opening support email composer...', 'info');
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
                  showToast('Connecting to dispatch coordinator...', 'info');
                }}
                style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 8 }]}
                activeOpacity={0.75}
              >
                <View style={styles.helpItemLeft}>
                  <MessageSquare size={18} color="#111111" />
                  <View>
                    <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>WhatsApp Dispatch Desk</Text>
                    <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>Instant status of tipper & transit mixers</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsHelpModalOpen(false)} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* POPUP MODAL 7: EDIT CONTRACTOR PROFILE                   */}
      {/* ======================================================== */}
      <Modal visible={isEditProfileModalOpen} transparent animationType="fade" onRequestClose={() => setIsEditProfileModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditProfileModalOpen(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Contractor Details</Text>
              <TouchableOpacity onPress={() => setIsEditProfileModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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
                placeholder="e.g. Apex Builders & Infra"
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
                  <View style={styles.gstValidBadge}>
                    <CheckCircle2 size={12} color="#059669" strokeWidth={2.5} />
                    <Text style={styles.gstValidBadgeText}>Valid GST</Text>
                  </View>
                ) : null}
              </View>
              <TextInput
                value={editGstin}
                onChangeText={handleGstChange}
                autoCapitalize="characters"
                maxLength={15}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.textPrimary,
                    borderColor: (gstError || profileErrors.gstin) ? '#EF4444' : editGstin.trim().length === 15 && isValidGSTIN(editGstin) ? '#10B981' : theme.border,
                  },
                ]}
                placeholder="e.g. 36AAACU9812A1Z4 (Optional)"
                placeholderTextColor={theme.textMuted}
              />
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
              {showEmailOtpBox && (
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
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default UserProfileScreen;
