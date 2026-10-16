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
import { UserProfile, ScreenType, ActivityDelivery, CartItem } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { apiService } from '../services/apiService';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { ShimmerImage } from './common/ShimmerImage';
import { MODAL_PRELOADERS } from './modals/AppModalsContainer';
import { SettingsModal } from './SettingsModal';
import { OrderHistoryModal } from './OrderHistoryModal';
import { ReferEarnModal } from './profile/ReferEarnModal';
import { HelpSupportModal } from './profile/HelpSupportModal';
import { SavedAddressesModal } from './profile/SavedAddressesModal';
import { EditProfileModal } from './profile/EditProfileModal';
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
import { useClipboard } from '../hooks/useClipboard';

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
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(initialOpenSettingsModal);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(initialOpenOrdersModal);
  const [loadingModalKey, setLoadingModalKey] = useState<string | null>(null);
  const isModalLoading = (key: string) => loadingModalKey === key;
  const triggerAsyncModal = (key: string, preloader: any, onReady: () => void) => {
    setLoadingModalKey(key);
    Promise.resolve(preloader?.()).finally(() => {
      setLoadingModalKey(null);
      onReady();
    });
  };

  const openSingleModal = (modalName: 'addresses' | 'refer' | 'help' | 'edit_profile' | 'settings' | 'orders') => {
    if (modalName === 'settings') {
      triggerAsyncModal('settings', MODAL_PRELOADERS.settings, () => {
        setIsAddressesModalOpen(false);
        setIsReferModalOpen(false);
        setIsHelpModalOpen(false);
        setIsEditProfileModalOpen(false);
        setIsSettingsModalOpen(true);
        setIsOrdersModalOpen(false);
      });
      return;
    }

    if (modalName === 'orders') {
      triggerAsyncModal('orders', MODAL_PRELOADERS.orders, () => {
        setIsAddressesModalOpen(false);
        setIsReferModalOpen(false);
        setIsHelpModalOpen(false);
        setIsEditProfileModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsOrdersModalOpen(true);
      });
      return;
    }

    setIsAddressesModalOpen(modalName === 'addresses');
    setIsReferModalOpen(modalName === 'refer');
    setIsHelpModalOpen(modalName === 'help');
    setIsEditProfileModalOpen(modalName === 'edit_profile');
    setIsSettingsModalOpen(false);
    setIsOrdersModalOpen(false);
  };

  const closeAllSubModals = () => {
    setIsAddressesModalOpen(false);
    setIsReferModalOpen(false);
    setIsHelpModalOpen(false);
    setIsEditProfileModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsOrdersModalOpen(false);
  };

  // Address Modal form state
  const [newSiteName, setNewSiteName] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newCity, setNewCity] = useState('Hyderabad');
  const [newState, setNewState] = useState('Telangana');
  const [newAddrContact, setNewAddrContact] = useState(user.name || '');
  const [newAddrPhone, setNewAddrPhone] = useState(user.phone || '');
  const [newAddressType, setNewAddressType] = useState<'site' | 'warehouse' | 'office' | 'home'>('site');
  const [addrFormErrors, setAddrFormErrors] = useState<Record<string, string>>({});
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const handlePincodeChange = (pin: string) => {
    setNewPincode(pin);
    if (pin.length === 6) {
      const lookup = lookupCityStateFromPincode(pin);
      if (lookup.city) setNewCity(lookup.city);
      if (lookup.state) setNewState(lookup.state);
    }
  };

  const handleAddNewAddress = () => {
    if (!newSiteName.trim() || !newStreet.trim() || !newPincode.trim()) {
      showToast('Please fill in Site Name, Street, and Pincode', 'error');
      return;
    }
    const formatted = `${newSiteName.trim()}, ${newStreet.trim()}, ${newCity.trim()}, ${newState.trim()} - ${newPincode.trim()}`;
    addLocation(formatted);
    setSelectedLocation(formatted);
    setNewSiteName('');
    setNewStreet('');
    setNewPincode('');
    showToast('New site delivery address saved successfully', 'success');
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
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState<boolean>(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState<boolean>(false);
  const [gstError, setGstError] = useState<string>('');

  const activeEnRouteDelivery = useMemo(() => {
    if (!deliveries || deliveries.length === 0) return null;
    return deliveries.find(
      (d) => d.status === 'En Route' || d.status === 'Placed'
    ) || deliveries[0] || null;
  }, [deliveries]);




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

  const handleSendEmailOtp = async () => {
    const trimmed = editEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setProfileErrors((prev) => ({ ...prev, email: 'Please enter a valid email address first (e.g. name@domain.com)' }));
      showToast('Please enter a valid email address first (e.g. name@domain.com)', 'error');
      return;
    }
    setIsSendingEmailOtp(true);
    try {
      const res = await apiService.sendEmailOtp(trimmed, user?.phone);
      setIsSendingEmailOtp(false);
      setShowEmailOtpBox(true);
      setOtpTimer(30);
      showToast(res?.message || `Verification code sent to ${trimmed}`, 'success');
    } catch {
      setIsSendingEmailOtp(false);
      setShowEmailOtpBox(true);
      setOtpTimer(30);
      showToast(`Verification code sent to ${trimmed}`, 'success');
    }
  };

  const handleVerifyEmailOtp = async () => {
    const entered = emailOtp.trim();
    if (!entered || entered.length !== 4) {
      showToast('Please enter the 4-digit verification code', 'error');
      return;
    }

    setIsVerifyingEmailOtp(true);
    try {
      const res = await apiService.verifyEmailOtp(editEmail.trim(), entered, user?.phone);
      setIsVerifyingEmailOtp(false);
      if (res.success && res.isEmailVerified) {
        setIsEmailVerified(true);
        setShowEmailOtpBox(false);
        setEmailOtp('');
        onUpdateUser({ email: editEmail.trim(), isEmailVerified: true });
        showToast('Email verified successfully! 🎉', 'success');
      } else {
        showToast(res.message || 'Invalid verification code. Please check and try again.', 'error');
      }
    } catch {
      setIsVerifyingEmailOtp(false);
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
    setIsSavingProfile(true);
    const validation = validateAndSanitizeProfileForm({
      name: editName,
      phone: editPhone,
      email: editEmail,
      companyName: editCompany,
      gstin: editGstin,
      isEmailVerified: isEmailVerified && Boolean(editEmail.trim()),
    });

    if (!validation.isValid) {
      setIsSavingProfile(false);
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
    setIsSavingProfile(false);
    setIsEditProfileModalOpen(false);
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

            {/* Active Shipment Glance Card (Blinkit / Instamart / Amazon Standard) */}
            {activeEnRouteDelivery && (
              <TouchableOpacity
                onPress={() => {
                  onNavigateScreen('basket');
                }}
                activeOpacity={0.88}
                style={[
                  styles.activeShipmentCard,
                  {
                    backgroundColor: theme.mode === 'dark' ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
                    borderColor: theme.mode === 'dark' ? 'rgba(5, 150, 105, 0.35)' : '#10B981',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Active Shipment Order #${activeEnRouteDelivery.orderNumber}`}
              >
                <View style={styles.shipmentCardLeft}>
                  <View style={[styles.shipmentPulsingDot, { backgroundColor: '#10B981' }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.shipmentTitle, { color: theme.textPrimary }]}>
                        Order #{activeEnRouteDelivery.orderNumber} En Route
                      </Text>
                      <View style={styles.liveTagPill}>
                        <Text style={styles.liveTagText}>LIVE DISPATCH</Text>
                      </View>
                    </View>
                    <Text style={[styles.shipmentSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {activeEnRouteDelivery.materialName} • {activeEnRouteDelivery.estimatedArrival || 'Arriving soon'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#10B981" />
              </TouchableOpacity>
            )}
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
            {isModalLoading('orders') ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <View style={[styles.countBadge, { backgroundColor: activeOrdersCount > 0 ? (theme.buttonBg || theme.primary) : theme.surfaceSecondary }]}>
                  <Text style={[styles.countBadgeText, { color: activeOrdersCount > 0 ? (theme.buttonText || '#18181B') : theme.textPrimary }]}>
                    {activeOrdersCount}
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.textMuted} />
              </>
            )}
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {/* 3. Favorites */}
        <TouchableOpacity
          onPress={() => {
            closeAllSubModals();
            onNavigateScreen('favorites');
          }}
          style={styles.menuRow}
          activeOpacity={0.7}
          accessibilityLabel="Favorites"
        >
          <View style={styles.menuRowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <Heart size={18} color={theme.textPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuRowLabel, { color: theme.textPrimary }]}>
                Favorites
              </Text>
              <Text style={[styles.menuRowSubLabel, { color: theme.textSecondary }]}>
                Quick re-ordering list
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            {favoriteCount > 0 ? (
              <View style={[styles.countBadge, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={[styles.countBadgeText, { color: theme.textPrimary, fontWeight: '700' }]}>
                  {favoriteCount}
                </Text>
              </View>
            ) : (
              <Text style={[styles.subValueText, { color: theme.textSecondary }]}>0 Saved</Text>
            )}
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

        {/* 4. Address Management: Saved Addresses */}
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
            {isModalLoading('settings') ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Text style={[styles.subValueText, { color: theme.textSecondary }]}>
                  {currentLanguageOption.name}
                </Text>
                <ChevronRight size={18} color={theme.textMuted} />
              </>
            )}
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
            style={[styles.mainAuthBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
            activeOpacity={0.85}
          >
            <LogIn size={18} color={theme.buttonText || '#FFFFFF'} strokeWidth={2.2} />
            <Text style={[styles.mainAuthBtnText, { color: theme.buttonText || '#FFFFFF' }]}>Log In or Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================================== */}
      {/* POPUP MODAL 2: APP SETTINGS                              */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <React.Suspense fallback={null}>
          <SettingsModal
            visible={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </React.Suspense>
      )}

      {/* ======================================================== */}
      {/* POPUP MODAL 3: SAVED ADDRESSES                           */}
      {/* ======================================================== */}
      <SavedAddressesModal
        visible={isAddressesModalOpen}
        onClose={() => setIsAddressesModalOpen(false)}
        isLoggedIn={isLoggedIn}
        savedLocations={savedLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        onDeleteLocation={deleteLocation}
        newSiteName={newSiteName}
        setNewSiteName={setNewSiteName}
        newStreet={newStreet}
        setNewStreet={setNewStreet}
        newPincode={newPincode}
        setNewPincode={setNewPincode}
        newCity={newCity}
        setNewCity={setNewCity}
        newState={newState}
        setNewState={setNewState}
        newAddrContact={newAddrContact}
        setNewAddrContact={setNewAddrContact}
        newAddrPhone={newAddrPhone}
        setNewAddrPhone={setNewAddrPhone}
        newAddressType={newAddressType}
        setNewAddressType={setNewAddressType}
        addrFormErrors={addrFormErrors}
        setAddrFormErrors={setAddrFormErrors}
        handlePincodeChange={handlePincodeChange}
        handleAddNewAddress={handleAddNewAddress}
        isAddingNewAddress={isAddingNewAddress}
        setIsAddingNewAddress={setIsAddingNewAddress}
      />

      {/* POPUP MODAL 4: REFER & EARN                              */}
      {/* ======================================================== */}
      <ReferEarnModal
        visible={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        referralCode={referralCode}
        onCopyReferralCode={handleCopyReferralCode}
        onShareReferral={handleShareReferral}
      />

      {/* POPUP MODAL 6: HELP & SUPPORT */}
      <HelpSupportModal
        visible={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* ======================================================== */}
      {/* POPUP MODAL 7: EDIT CONTRACTOR PROFILE                   */}
      {/* ======================================================== */}
      <EditProfileModal
        visible={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        editName={editName}
        setEditName={setEditName}
        editCompany={editCompany}
        setEditCompany={setEditCompany}
        editGstin={editGstin}
        setEditGstin={setEditGstin}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        profileErrors={profileErrors}
        setProfileErrors={setProfileErrors}
        isSavingProfile={isSavingProfile}
        isSendingEmailOtp={isSendingEmailOtp}
        isVerifyingEmailOtp={isVerifyingEmailOtp}
        showEmailOtpBox={showEmailOtpBox}
        emailOtp={emailOtp}
        setEmailOtp={setEmailOtp}
        handleSendEmailOtp={handleSendEmailOtp}
        handleVerifyEmailOtp={handleVerifyEmailOtp}
        handleSaveProfile={handleSaveProfile}
      />

      {/* ======================================================== */}
      {/* POPUP MODAL: PAST MATERIAL ORDER HISTORY                 */}
      {/* ======================================================== */}
      <OrderHistoryModal
        visible={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        user={user}
        isLoggedIn={isLoggedIn}
        deliveries={deliveries}
        onViewInvoice={onViewInvoice}
        onTrackOrder={(del) => {
          setIsOrdersModalOpen(false);
          onNavigateScreen('activity');
        }}
        onExploreCatalog={() => {
          setIsOrdersModalOpen(false);
          if (onExploreCatalog) onExploreCatalog();
        }}
        onOpenLoginModal={() => {
          setIsOrdersModalOpen(false);
          if (onOpenLoginModal) onOpenLoginModal();
        }}
        onReorderMaterial={onReorderMaterial}
      />
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
    backgroundColor: '#FCB026',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#18181B',
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
    backgroundColor: '#FCB026',
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
    color: '#18181B',
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
  activeShipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  shipmentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shipmentPulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shipmentTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  shipmentSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  liveTagPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
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
    backgroundColor: '#FCB026',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#18181B',
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
    backgroundColor: '#FCB026',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  verifyEmailInlineBtnText: {
    color: '#18181B',
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
    backgroundColor: '#FCB026',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#18181B',
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
    backgroundColor: '#FCB026',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cleanSaveBtnText: {
    color: '#18181B',
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
    color: '#18181B',
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
    color: '#18181B',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default UserProfileScreen;
