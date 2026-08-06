import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import {
  Phone,
  MapPin,
  ShieldCheck,
  FileText,
  Activity,
  Settings,
  Headphones,
  LogOut,
  ChevronRight,
  Edit2,
  LogIn,
  Building,
  CreditCard,
  X,
  CheckCircle2,
  Plus,
  Trash2,
  Navigation,
  Download,
  Check,
  Mail,
  MessageSquare,
  HelpCircle,
  ChevronDown,
} from 'lucide-react-native';
import { UserProfile, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';

interface UserProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onNavigateScreen: (screen: ScreenType) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  deliveries?: ActivityDelivery[];
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  initialOpenAddressesModal?: boolean;
}

const DEFAULT_AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
];

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  user,
  onUpdateUser,
  onNavigateScreen,
  isLoggedIn,
  onLogout,
  deliveries = INITIAL_DELIVERIES,
  onViewInvoice,
  initialOpenAddressesModal = false,
}) => {
  const { theme, typography } = useTheme();
  const {
    selectedLocation,
    savedLocations,
    setSelectedLocation,
    addLocation,
    editLocation,
    deleteLocation,
  } = useLocation();

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressesModalOpen, setIsAddressesModalOpen] = useState(initialOpenAddressesModal);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Address edit state
  const [newAddressInput, setNewAddressInput] = useState('');
  const [editingAddressOld, setEditingAddressOld] = useState<string | null>(null);
  const [editingAddressInput, setEditingAddressInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit profile form state
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editEmail, setEditEmail] = useState(user.email);
  const [customAvatarUrl, setCustomAvatarUrl] = useState(user.avatarUrl);

  // Saved Payments state
  const [savedCards, setSavedCards] = useState([
    { id: '1', bank: 'HDFC Bank Visa', last4: '4821', type: 'Credit Card', isDefault: true },
    { id: '2', bank: 'ICICI Bank Mastercard', last4: '9102', type: 'Debit Card', isDefault: false },
  ]);
  const [savedUpi, setSavedUpi] = useState('rajesh@okaxis');

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSaveProfile = () => {
    onUpdateUser({
      name: editName,
      phone: editPhone,
      email: editEmail,
      avatarUrl: customAvatarUrl,
    });
    setIsEditModalOpen(false);
    showToast('Profile updated successfully!');
  };

  const handleAddAddress = () => {
    if (!newAddressInput.trim()) return;
    addLocation(newAddressInput.trim());
    showToast('New address added!');
    setNewAddressInput('');
  };

  const handleUseCurrentLocationGPS = () => {
    const gpsAddr = 'Plot 42, Hitech City, Hyderabad (GPS Location)';
    addLocation(gpsAddr);
    showToast('GPS Location added & set as active!');
  };

  const handleStartEditAddress = (oldLoc: string) => {
    setEditingAddressOld(oldLoc);
    setEditingAddressInput(oldLoc);
  };

  const handleSaveEditAddress = () => {
    if (editingAddressOld && editingAddressInput.trim()) {
      editLocation(editingAddressOld, editingAddressInput.trim());
      showToast('Address updated!');
    }
    setEditingAddressOld(null);
    setEditingAddressInput('');
  };

  const handleDeleteAddress = (locToDelete: string) => {
    deleteLocation(locToDelete);
    showToast('Address removed.');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Toast Alert */}
      {toastMsg && (
        <View style={styles.toastContainer}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Clean Ultra-Minimal Top Header Profile Block */}
      <View style={[styles.profileHeaderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Single Top-Right Edit Icon for updating DP & Profile Info */}
        <TouchableOpacity
          onPress={() => setIsEditModalOpen(true)}
          style={[styles.singleEditIconBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          activeOpacity={0.7}
          accessibilityLabel="Edit profile details and photo"
        >
          <Edit2 size={16} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerMainBody}>
          <View style={styles.avatarRow}>
            {/* Profile Picture (DP) */}
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: user.avatarUrl && user.avatarUrl.trim().length > 0 ? user.avatarUrl : DEFAULT_AVATAR_FALLBACK }}
                style={styles.avatarImage}
              />
            </View>

            <View style={styles.profileTitleBlock}>
              {/* Name & Verified Badge */}
              <View style={styles.nameRow}>
                <Text style={[styles.userNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {isLoggedIn ? user.name : 'Guest User'}
                </Text>
                {/* Verified Badge Symbol Only */}
                {user.isVerified && isLoggedIn && (
                  <View style={styles.verifiedBadgeContainer} title="Verified Account">
                    <ShieldCheck size={18} color="#059669" fill="#D1FAE5" />
                  </View>
                )}
              </View>

              {/* Mobile Number */}
              <View style={styles.phoneRow}>
                <Phone size={13} color={theme.textSecondary} />
                <Text style={[styles.phoneText, { color: theme.textSecondary }]}>
                  {isLoggedIn ? user.phone : '+91 Mobile Unverified'}
                </Text>
              </View>

              {/* Email Address & Verify Button */}
              <View style={styles.emailRow}>
                <Mail size={13} color={theme.textSecondary} />
                <Text style={[styles.phoneText, { color: theme.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
                  {isLoggedIn ? (user.email || 'rajesh.k@urbanico.in') : 'rajesh.k@urbanico.in'}
                </Text>
                {!user.isVerified && (
                  <TouchableOpacity
                    onPress={() => {
                      onUpdateUser({ isVerified: true });
                      showToast('Email verified successfully!');
                    }}
                    style={[styles.verifyEmailBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.verifyEmailBtnText, { color: theme.primaryDark }]}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Essential Profile Options Group ONLY */}
      <View style={[styles.menuCardGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* 1. Order History */}
        <TouchableOpacity
          onPress={() => onNavigateScreen('activity')}
          style={[styles.menuRow, { borderBottomColor: theme.borderLight }]}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: theme.primaryLight }]}>
              <FileText size={18} color={theme.primaryDark} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Order History</Text>
              <Text style={[styles.menuSub, { color: theme.textMuted }]}>View past orders & receipts</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* 2. Addresses (Renamed from Construction Sites to Addresses) */}
        <TouchableOpacity
          onPress={() => setIsAddressesModalOpen(true)}
          style={[styles.menuRow, { borderBottomColor: theme.borderLight }]}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: theme.primaryLight }]}>
              <MapPin size={18} color={theme.primaryDark} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Addresses</Text>
              <Text style={[styles.menuSub, { color: theme.textMuted }]}>Manage saved delivery locations</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* 3. Saved Payments */}
        <TouchableOpacity
          onPress={() => setIsPaymentsModalOpen(true)}
          style={[styles.menuRow, { borderBottomColor: theme.borderLight }]}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: theme.primaryLight }]}>
              <CreditCard size={18} color={theme.primaryDark} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Saved Payments</Text>
              <Text style={[styles.menuSub, { color: theme.textMuted }]}>Manage saved cards & UPI</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* 4. Support & FAQ */}
        <TouchableOpacity
          onPress={() => setIsSupportModalOpen(true)}
          style={[styles.menuRow, { borderBottomColor: theme.borderLight }]}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: theme.primaryLight }]}>
              <HelpCircle size={18} color={theme.primaryDark} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Support & FAQ</Text>
              <Text style={[styles.menuSub, { color: theme.textMuted }]}>Help center, FAQs & customer support</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* 5. Settings */}
        <TouchableOpacity
          onPress={() => onNavigateScreen('settings')}
          style={[styles.menuRow, { borderBottomColor: theme.borderLight }]}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Settings size={18} color={theme.primaryDark} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>Settings</Text>
              <Text style={[styles.menuSub, { color: theme.textMuted }]}>Light / Dark theme & preferences</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {/* 6. Logout */}
        {isLoggedIn ? (
          <TouchableOpacity
            onPress={onLogout}
            style={styles.menuRow}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <LogOut size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Logout</Text>
                <Text style={[styles.menuSub, { color: theme.textMuted }]}>Sign out of your account</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onNavigateScreen('auth')}
            style={styles.menuRow}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: theme.primaryLight }]}>
                <LogIn size={18} color={theme.primaryDark} />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: theme.primaryDark }]}>Log In / Sign Up</Text>
                <Text style={[styles.menuSub, { color: theme.textMuted }]}>Sign in to save orders & addresses</Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Single Edit Profile Modal (Combines Details & Profile Picture) */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Edit Profile & Photo</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalFormScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile Picture Selection Section */}
              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Choose Profile Picture</Text>
                <View style={styles.avatarGridRow}>
                  {AVATAR_PRESETS.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setCustomAvatarUrl(url)}
                      style={[
                        styles.avatarGridItem,
                        customAvatarUrl === url && { borderColor: theme.primary, borderWidth: 3 },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: url }} style={styles.avatarGridImage} />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Avatar URL Input */}
                <View style={styles.urlInputRow}>
                  <TextInput
                    value={customAvatarUrl}
                    onChangeText={setCustomAvatarUrl}
                    placeholder="Or enter image URL..."
                    placeholderTextColor="#94A3B8"
                    style={[styles.urlInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                  />
                </View>
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Full Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Rajesh Kumar"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Mobile Phone</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Email Address</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="e.g. rajesh@urbanico.in"
                  keyboardType="email-address"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooterActions, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={[styles.saveProfileBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.saveProfileBtnText}>Save Profile Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 1: Addresses */}
      <Modal visible={isAddressesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAddressesModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleGroup}>
                <MapPin size={20} color={theme.primary} />
                <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Delivery Addresses</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddressesModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>Add New Delivery Address</Text>
              <View style={styles.addSiteBox}>
                <TextInput
                  value={newAddressInput}
                  onChangeText={setNewAddressInput}
                  placeholder="Enter house/building no, street, landmark..."
                  placeholderTextColor="#94A3B8"
                  style={[styles.addSiteInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
                <TouchableOpacity
                  onPress={handleAddAddress}
                  style={[styles.addSiteBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addSiteBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleUseCurrentLocationGPS}
                style={[styles.gpsLocationBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Navigation size={16} color={theme.primaryDark} />
                <Text style={[styles.gpsLocationBtnText, { color: theme.primaryDark }]}>
                  Detect Device GPS Location
                </Text>
              </TouchableOpacity>

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                Saved Addresses ({savedLocations.length})
              </Text>

              {savedLocations.map((loc) => {
                const isSelected = selectedLocation === loc;
                const isEditingThis = editingAddressOld === loc;

                return (
                  <View
                    key={loc}
                    style={[
                      styles.siteCard,
                      { backgroundColor: theme.surfaceSecondary, borderColor: isSelected ? theme.primary : theme.border },
                    ]}
                  >
                    {isEditingThis ? (
                      <View style={styles.editSiteRow}>
                        <TextInput
                          value={editingAddressInput}
                          onChangeText={setEditingAddressInput}
                          style={[styles.editSiteTextInput, { color: theme.textPrimary, borderColor: theme.primary }]}
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={handleSaveEditAddress}
                          style={[styles.saveSiteEditBtn, { backgroundColor: theme.primary }]}
                        >
                          <Check size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedLocation(loc);
                          showToast('Active delivery address updated!');
                        }}
                        style={styles.siteMainTouch}
                        activeOpacity={0.7}
                      >
                        <MapPin size={16} color={isSelected ? theme.primary : theme.textMuted} />
                        <Text style={[styles.siteAddressText, { color: theme.textPrimary }]}>{loc}</Text>
                        {isSelected && (
                          <View style={[styles.activePill, { backgroundColor: theme.primaryLight }]}>
                            <Text style={[styles.activePillText, { color: theme.primaryDark }]}>Active</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}

                    {!isEditingThis && (
                      <View style={styles.siteCardActions}>
                        <TouchableOpacity
                          onPress={() => handleStartEditAddress(loc)}
                          style={styles.actionIconBtn}
                        >
                          <Edit2 size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteAddress(loc)}
                          style={styles.actionIconBtn}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Saved Payments */}
      <Modal visible={isPaymentsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPaymentsModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleGroup}>
                <CreditCard size={20} color={theme.primary} />
                <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Saved Payments & Cards</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPaymentsModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>Saved Cards</Text>

              {savedCards.map((card) => (
                <View
                  key={card.id}
                  style={[styles.paymentCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                >
                  <View style={styles.paymentCardHeader}>
                    <CreditCard size={18} color={theme.primaryDark} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.paymentBankTitle, { color: theme.textPrimary }]}>{card.bank}</Text>
                      <Text style={[styles.paymentSubText, { color: theme.textMuted }]}>•••• •••• •••• {card.last4} ({card.type})</Text>
                    </View>
                    {card.isDefault && (
                      <View style={[styles.activePill, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.activePillText, { color: theme.primaryDark }]}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 14 }]}>Saved UPI Handles</Text>
              <View style={[styles.paymentCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <View style={styles.paymentCardHeader}>
                  <Text style={[styles.paymentBankTitle, { color: theme.textPrimary, fontSize: 13 }]}>UPI VPA: {savedUpi}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => showToast('Redirecting to secure card setup...')}
                style={[styles.addPaymentBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Plus size={16} color={theme.primaryDark} />
                <Text style={[styles.addPaymentBtnText, { color: theme.primaryDark }]}>Add New Card or UPI Method</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Support & FAQ */}
      <Modal visible={isSupportModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsSupportModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleGroup}>
                <HelpCircle size={20} color={theme.primary} />
                <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Support & FAQ</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSupportModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>Contact Support</Text>

              <TouchableOpacity
                onPress={() => Linking.openURL('tel:18001239876')}
                style={[styles.supportCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.supportIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Phone size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>Customer Support Hotline</Text>
                  <Text style={[styles.supportSub, { color: theme.textSecondary }]}>1800-123-9876 (24/7)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL('mailto:support@urbanico.in')}
                style={[styles.supportCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.supportIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Mail size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>Email Support Desk</Text>
                  <Text style={[styles.supportSub, { color: theme.textSecondary }]}>support@urbanico.in</Text>
                </View>
              </TouchableOpacity>

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>Frequently Asked Questions</Text>

              {[
                {
                  q: 'How do I track my order?',
                  a: 'Navigate to the Order History section from your profile to view active and past order statuses.',
                },
                {
                  q: 'How do I add or change my delivery address?',
                  a: 'Tap on "Addresses" in your profile menu to add, edit or set a default delivery address.',
                },
                {
                  q: 'What payment methods are supported?',
                  a: 'We accept Credit Cards, Debit Cards, Netbanking, UPI, Cash on Delivery, and PayLater.',
                },
              ].map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setExpandedFaq(isExpanded ? null : idx)}
                    style={[styles.faqAccordionCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqHeaderRow}>
                      <HelpCircle size={16} color={theme.primary} />
                      <Text style={[styles.faqQuestionText, { color: theme.textPrimary }]}>{faq.q}</Text>
                      <ChevronDown size={16} color={theme.textMuted} />
                    </View>
                    {isExpanded && (
                      <Text style={[styles.faqAnswerText, { color: theme.textSecondary }]}>{faq.a}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    paddingBottom: 96,
    gap: 16,
  },
  toastContainer: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 99,
    backgroundColor: '#064E3B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileHeaderCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
  },
  singleEditIconBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 10,
  },
  headerMainBody: {
    gap: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileTitleBlock: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '900',
  },
  verifiedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 3,
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  emailVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  verifiedLabelText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  verifyEmailBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  verifyEmailBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  companyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactDetailsBox: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contactDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 8,
  },
  contactValText: {
    fontSize: 11,
    fontWeight: '700',
  },
  creditCardBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  creditCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  creditUsedLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  creditProgressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  creditProgressBarFill: {
    height: '100%',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTextInside: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  creditFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditAvailableText: {
    fontSize: 11,
    fontWeight: '800',
  },
  creditTotalText: {
    fontSize: 11,
    fontWeight: '600',
  },
  menuCardGroup: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  menuSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  authActionBox: {
    marginTop: 8,
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
  loginCtaBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loginCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalFormScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalScrollContent: {
    gap: 14,
    paddingBottom: 24,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  avatarGridItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarGridImage: {
    width: '100%',
    height: '100%',
  },
  urlInputRow: {
    marginTop: 8,
  },
  urlInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  inputFieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooterActions: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveProfileBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  addSiteBox: {
    gap: 8,
  },
  addSiteInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  addSiteBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addSiteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  gpsLocationBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gpsLocationBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  siteCard: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  siteMainTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siteAddressText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  editSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editSiteTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  saveSiteEditBtn: {
    padding: 6,
    borderRadius: 6,
  },
  siteCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionIconBtn: {
    padding: 4,
  },
  invoiceCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  invoiceDateText: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceAmountText: {
    fontSize: 14,
    fontWeight: '900',
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  invoiceGstinText: {
    fontSize: 11,
    fontWeight: '600',
  },
  downloadPdfBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  supportCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  supportSub: {
    fontSize: 11,
    marginTop: 1,
  },
  faqAccordionCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faqQuestionText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  faqAnswerText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  paymentCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentBankTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  paymentSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  addPaymentBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  addPaymentBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
