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
} from 'lucide-react-native';
import { UserProfile, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { SettingsModal } from './SettingsModal';
import { OrdersActivityModal } from './OrdersActivityModal';

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

  // Address input state
  const [newAddressInput, setNewAddressInput] = useState('');
  const [newPincodeInput, setNewPincodeInput] = useState('');

  // Edit profile form state
  const [editName, setEditName] = useState(user.name || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editCompany, setEditCompany] = useState(user.companyName || '');
  const [editGstin, setEditGstin] = useState(user.gstin || '');

  // Referral
  const referralCode = React.useMemo(() => {
    const cleanDigits = (user.phone || '').replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      return `URB500-${cleanDigits.slice(-4)}`;
    }
    return 'URB500-PRO';
  }, [user.phone]);

  useEffect(() => {
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditCompany(user.companyName || '');
    setEditGstin(user.gstin || '');
  }, [user]);

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
    const shareMessage = `Join Urbanico for direct quarry & factory construction materials with flat 18% GST and per-km delivery. Use my code ${referralCode} to get ₹500 off on your first order! https://urbanico.in/join?ref=${referralCode}`;
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
    if (!editName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    onUpdateUser({
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      companyName: editCompany.trim(),
      gstin: editGstin.trim().toUpperCase(),
    });
    setIsEditProfileModalOpen(false);
    showToast('Profile updated successfully', 'success');
  };

  const handleAddNewAddress = () => {
    if (!newAddressInput.trim()) {
      showToast('Please enter a valid construction site address', 'error');
      return;
    }
    const cleanAddr = newAddressInput.trim();
    const cleanPin = newPincodeInput.replace(/[^0-9]/g, '').slice(0, 6);
    const fullAddress = cleanPin
      ? (cleanAddr.includes(cleanPin) ? cleanAddr : `${cleanAddr} - PIN ${cleanPin}`)
      : cleanAddr;

    addLocation(fullAddress);
    setNewAddressInput('');
    setNewPincodeInput('');
    showToast('Site address and pincode saved', 'success');
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
        
        {/* 1. Integrated Account / Member Header */}
        {!isLoggedIn ? (
          <View style={styles.authHeaderSection}>
            <View style={styles.guestInfoRow}>
              <View style={styles.guestAvatar}>
                <Building size={24} color="#111111" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>Welcome Guest</Text>
                <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                  Log in to manage orders, live GPS dispatches & GST invoices
                </Text>
              </View>
            </View>

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
              <LogIn size={16} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.mainAuthBtnText}>Log In or Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loggedInHeaderSection}>
            <View style={styles.loggedInHeaderRow}>
              <View style={styles.userAvatar}>
                <UserCheck size={24} color="#059669" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameBadgeRow}>
                  <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>
                    {user.name || 'Civil Contractor'}
                  </Text>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>PRO BUILDER</Text>
                  </View>
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
        )}

        <View style={[styles.menuDividerFull, { backgroundColor: theme.border }]} />

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
                Invite builder friends & earn ₹500 wallet credit
              </Text>
            </View>
          </View>
          <View style={styles.menuRowRight}>
            <View style={styles.referPillBadge}>
              <Text style={styles.referPillBadgeText}>Get ₹500</Text>
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

              <View style={[styles.addAddressBox, { borderColor: theme.border }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Add New Site Address & Pincode</Text>
                <TextInput
                  value={newAddressInput}
                  onChangeText={setNewAddressInput}
                  style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border, marginBottom: 8 }]}
                  placeholder="Enter site name / street address / landmark"
                  placeholderTextColor={theme.textMuted}
                />
                <TextInput
                  value={newPincodeInput}
                  onChangeText={(t) => setNewPincodeInput(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border, marginBottom: 8 }]}
                  placeholder="Site Pincode (e.g. 500081)"
                  placeholderTextColor={theme.textMuted}
                />
                <TouchableOpacity onPress={handleAddNewAddress} style={styles.addAddressBtn} activeOpacity={0.8}>
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.addAddressBtnText}>Save Address</Text>
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
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <CreditCard size={18} color="#111111" />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Payment Methods</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)} style={styles.closeBtn}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionMicroHeader, { color: theme.textMuted }]}>SAVED UPI & ACCOUNTS</Text>

              <View style={[styles.paymentMethodCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <View style={styles.paymentMethodLeft}>
                  <Smartphone size={18} color="#111111" />
                  <View>
                    <Text style={[styles.paymentMethodTitle, { color: theme.textPrimary }]}>Google Pay / PhonePe UPI</Text>
                    <Text style={[styles.paymentMethodSub, { color: theme.textSecondary }]}>9848012345@okaxis • Primary UPI</Text>
                  </View>
                </View>
                <View style={styles.verifiedGreenDot} />
              </View>

              <View style={[styles.paymentMethodCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 8 }]}>
                <View style={styles.paymentMethodLeft}>
                  <CardIcon size={18} color="#111111" />
                  <View>
                    <Text style={[styles.paymentMethodTitle, { color: theme.textPrimary }]}>HDFC Corporate Business Card</Text>
                    <Text style={[styles.paymentMethodSub, { color: theme.textSecondary }]}>•••• 4242 • Expires 08/28</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.paymentMethodCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 8 }]}>
                <View style={styles.paymentMethodLeft}>
                  <Landmark size={18} color="#111111" />
                  <View>
                    <Text style={[styles.paymentMethodTitle, { color: theme.textPrimary }]}>Commercial RTGS / NEFT Ledger</Text>
                    <Text style={[styles.paymentMethodSub, { color: theme.textSecondary }]}>Urbanico Escrow Direct Settlement</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.payInfoBanner, { backgroundColor: theme.surfaceSecondary }]}>
                <ShieldCheck size={14} color="#059669" />
                <Text style={[styles.payInfoBannerText, { color: theme.textSecondary }]}>
                  All payment transactions are encrypted and 100% compliant with RBI digital payment directives.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
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
                <Text style={[styles.referHeroTitle, { color: theme.textPrimary }]}>Earn ₹500 for every builder you invite</Text>
                <Text style={[styles.referHeroSubtitle, { color: theme.textSecondary }]}>
                  Share your referral link with contractor friends. When they place their first construction materials order, both of you receive ₹500 in Urbanico Wallet.
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
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="Contractor full name"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="Mobile number"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Company / Firm Name</Text>
              <TextInput
                value={editCompany}
                onChangeText={setEditCompany}
                style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="e.g. Apex Builders & Infra"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>GSTIN (18% Flat ITC)</Text>
              <TextInput
                value={editGstin}
                onChangeText={setEditGstin}
                autoCapitalize="characters"
                style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="e.g. 36AAACU9812A1Z4"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="billing@company.com"
                placeholderTextColor={theme.textMuted}
              />
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
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 2,
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
  mainAuthBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mainAuthBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
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
    maxHeight: 380,
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
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
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
  addAddressBtn: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addAddressBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
