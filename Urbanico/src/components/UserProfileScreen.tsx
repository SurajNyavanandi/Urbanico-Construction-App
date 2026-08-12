import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Linking,
  RefreshControl,
} from 'react-native';
import {
  Phone,
  MapPin,
  ShieldCheck,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Edit2,
  LogIn,
  CreditCard,
  X,
  Plus,
  Trash2,
  Navigation,
  Check,
  Mail,
  HelpCircle,
  ChevronDown,
  Gift,
  Award,
  Star,
  Wallet,
  Building,
} from 'lucide-react-native';
import { UserProfile, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingButton } from './common/LoadingButton';
import { Toast } from './common/Toast';

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
  const { currentLanguageOption, t } = useLanguage();
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
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Address edit state
  const [newAddressInput, setNewAddressInput] = useState('');
  const [editingAddressOld, setEditingAddressOld] = useState<string | null>(null);
  const [editingAddressInput, setEditingAddressInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit profile form state (Name, Phone, Email ONLY - No Avatar)
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editEmail, setEditEmail] = useState(user.email);

  // Saved Payments state
  const [savedCards] = useState([
    { id: '1', bank: 'HDFC Bank Visa', last4: '4821', type: 'Credit Card', isDefault: true },
    { id: '2', bank: 'ICICI Bank Mastercard', last4: '9102', type: 'Debit Card', isDefault: false },
  ]);
  const [savedUpi] = useState('rajesh@okaxis');

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Profile updated');
    }, 800);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleSaveProfile = () => {
    if (isSavingProfile) return;
    setIsSavingProfile(true);
    setTimeout(() => {
      setIsSavingProfile(false);
      onUpdateUser({
        name: editName,
        phone: editPhone,
        email: editEmail,
      });
      setIsEditModalOpen(false);
      showToast('Profile details updated successfully');
    }, 500);
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
    <View style={{ flex: 1 }}>
      <Toast
        visible={Boolean(toastMsg)}
        message={toastMsg || ''}
        type="info"
        onDismiss={() => setToastMsg(null)}
      />
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
        {/* Ultra Minimal User Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileCardMain}>
            <View style={styles.profileInfoColumn}>
              <Text style={[styles.userNameText, { color: theme.textPrimary }]}>
                {isLoggedIn ? user.name : 'Guest User'}
              </Text>
              <Text style={[styles.userPhoneText, { color: theme.textSecondary }]}>
                {isLoggedIn ? user.phone : '+91 Mobile Unverified'}
              </Text>
              {isLoggedIn && user.email ? (
                <Text style={[styles.userEmailText, { color: theme.textMuted }]} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
            </View>

            {isLoggedIn && (
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(true)}
                style={[styles.editInfoBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Edit2 size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Integrated GSTIN Row */}
          {isLoggedIn && user.gstin ? (
            <View style={[styles.gstinIntegratedRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <View style={styles.gstinLeftGroup}>
                <Building size={16} color={theme.primary} />
                <View>
                  <Text style={[styles.gstinLabel, { color: theme.textSecondary }]}>GSTIN Verified</Text>
                  <Text style={[styles.gstinValue, { color: theme.textPrimary }]}>{user.gstin}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(true)}
                style={[styles.editGstinBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.editGstinBtnText, { color: theme.textPrimary }]}>Edit GST</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Ultra-Minimal Menu List (Original Urbanico Core Features) */}
        <View style={[styles.listContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* My Orders & Track Material Dispatches */}
          <TouchableOpacity
            onPress={() => onNavigateScreen('activity')}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <FileText size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>My Orders & Dispatches</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Manage Saved Site Addresses */}
          <TouchableOpacity
            onPress={() => setIsAddressesModalOpen(true)}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <MapPin size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Manage Site Addresses</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Manage Payment Methods */}
          <TouchableOpacity
            onPress={() => setIsPaymentsModalOpen(true)}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <CreditCard size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Manage Payment Methods</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Settings & Language Preferences */}
          <TouchableOpacity
            onPress={() => onNavigateScreen('settings')}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <Settings size={18} color={theme.textPrimary} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Settings</Text>
                <View style={{ backgroundColor: theme.surfaceSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '500', color: theme.textSecondary }}>
                    {currentLanguageOption.flag} {currentLanguageOption.nativeName}
                  </Text>
                </View>
              </View>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity
            onPress={() => setIsSupportModalOpen(true)}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <HelpCircle size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* About Urbanico */}
          <TouchableOpacity
            onPress={() => setIsAboutModalOpen(true)}
            style={styles.listItemRow}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <ShieldCheck size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>About Urbanico</Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Refer & Earn Banner */}
        <View style={[styles.referralCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
          <View style={styles.referralLeftContent}>
            <Text style={[styles.referralTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>Refer & earn ₹100</Text>
            <Text style={[styles.referralSubtitle, { color: theme.textSecondary }]}>
              Get ₹100 when your friend completes their first order
            </Text>
            <TouchableOpacity
              onPress={() => showToast('Referral link copied to clipboard!')}
              style={[styles.referNowBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.referNowBtnText}>Refer now</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.giftIconBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Gift size={32} color={theme.primary} />
          </View>
        </View>

        {/* Clean Logout / Login Button */}
        {isLoggedIn ? (
          <TouchableOpacity
            onPress={onLogout}
            style={[styles.logoutOutlineBtn, { borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onNavigateScreen('auth')}
            style={[styles.logoutOutlineBtn, { borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.logoutBtnText, { color: theme.primary }]}>Login / Sign Up</Text>
          </TouchableOpacity>
        )}

        {/* App Version Tagline */}
        <Text style={styles.versionText}>Version 7.6.69 R844</Text>
      </ScrollView>

      {/* MODAL: Edit Profile Details ONLY (No Avatar) */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Edit Profile Details</Text>
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
              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Full Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Rajesh Kumar"
                  placeholderTextColor="#999999"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Mobile Phone</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#999999"
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
                  placeholderTextColor="#999999"
                  keyboardType="email-address"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooterActions, { borderTopColor: theme.border }]}>
              <LoadingButton
                title="Save Changes"
                onPress={handleSaveProfile}
                isLoading={isSavingProfile}
                variant="primary"
                style={{ height: 48 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: Addresses */}
      <Modal visible={isAddressesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAddressesModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleGroup}>
                <MapPin size={20} color={theme.primary} />
                <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Manage Addresses</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddressesModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>Add New Address</Text>
              <View style={styles.addSiteBox}>
                <TextInput
                  value={newAddressInput}
                  onChangeText={setNewAddressInput}
                  placeholder="Enter house/building no, street, landmark..."
                  placeholderTextColor="#999999"
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
                style={[styles.gpsLocationBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <Navigation size={16} color={theme.textPrimary} />
                <Text style={[styles.gpsLocationBtnText, { color: theme.textPrimary }]}>
                  Detect GPS Location
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
                          <View style={[styles.activePill, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.activePillText, { color: theme.primary }]}>Active</Text>
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

      {/* MODAL: Saved Payments */}
      <Modal visible={isPaymentsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPaymentsModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleGroup}>
                <CreditCard size={20} color={theme.primary} />
                <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Manage Payment Methods</Text>
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
                    <CreditCard size={18} color={theme.textPrimary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.paymentBankTitle, { color: theme.textPrimary }]}>{card.bank}</Text>
                      <Text style={[styles.paymentSubText, { color: theme.textMuted }]}>•••• •••• •••• {card.last4} ({card.type})</Text>
                    </View>
                    {card.isDefault && (
                      <View style={[styles.activePill, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.activePillText, { color: theme.primary }]}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 14 }]}>Saved UPI Handle</Text>
              <View style={[styles.paymentCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <View style={styles.paymentCardHeader}>
                  <Text style={[styles.paymentBankTitle, { color: theme.textPrimary, fontSize: 13 }]}>UPI ID: {savedUpi}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => showToast('Redirecting to secure card setup...')}
                style={[styles.addPaymentBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <Plus size={16} color={theme.textPrimary} />
                <Text style={[styles.addPaymentBtnText, { color: theme.textPrimary }]}>Add Payment Method</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Support & FAQ */}
      <Modal visible={isSupportModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsSupportModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleGroup}>
                <HelpCircle size={20} color={theme.primary} />
                <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Help & Support</Text>
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
                  <Phone size={18} color="#059669" />
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
                  <Mail size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>Email Support Desk</Text>
                  <Text style={[styles.supportSub, { color: theme.textSecondary }]}>support@urbanico.in</Text>
                </View>
              </TouchableOpacity>

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>Frequently Asked Questions</Text>

              {[
                {
                  q: 'How do I track my material delivery?',
                  a: 'Navigate to "My Orders" from your profile or the home screen to view live dispatch tracking.',
                },
                {
                  q: 'How do I add or change my site address?',
                  a: 'Tap on "Manage addresses" to add, edit or select your active delivery location.',
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
                      <HelpCircle size={16} color={theme.textPrimary} />
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

      {/* MODAL: About Urbanico */}
      <Modal visible={isAboutModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAboutModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.modalHeaderTitleGroup}>
                <ShieldCheck size={20} color={theme.primary} />
                <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>About Urbanico</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAboutModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.aboutHeadingText, { color: theme.textPrimary }]}>Urbanico Technologies</Text>
              <Text style={[styles.aboutBodyText, { color: theme.textSecondary }]}>
                Urbanico is India's leading platform for construction materials, rebar, cement, aggregates, and site equipment.
              </Text>
              <Text style={[styles.aboutBodyText, { color: theme.textSecondary, marginTop: 8 }]}>
                Version 7.6.69 R844 (Build 2026)
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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

  /* Unified User Profile Card */
  profileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  profileCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileInfoColumn: {
    flex: 1,
    gap: 3,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  userPhoneText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userEmailText: {
    fontSize: 13,
    fontWeight: '400',
  },
  editInfoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  /* Integrated GSTIN Row */
  gstinIntegratedRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gstinLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gstinLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  gstinValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  editGstinBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  editGstinBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Ultra Minimal List Container */
  listContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: '500',
  },

  /* Refer & Earn Banner Card */
  referralCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralLeftContent: {
    flex: 1,
    paddingRight: 12,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  referralSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 12,
  },
  referNowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  referNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  giftIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Logout Button */
  logoutOutlineBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Version text */
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
    marginTop: 12,
    marginBottom: 8,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalSheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeModalBtn: {
    padding: 6,
  },
  modalFormScroll: {
    maxHeight: 450,
  },
  modalScrollContent: {
    padding: 20,
    gap: 14,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  inputFieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '400',
    borderWidth: 1,
  },
  modalFooterActions: {
    padding: 16,
    borderTopWidth: 1,
  },

  /* Address Modal Specifics */
  addSiteBox: {
    flexDirection: 'row',
    gap: 8,
  },
  addSiteInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    borderWidth: 1,
  },
  addSiteBtn: {
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSiteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  gpsLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  gpsLocationBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  siteCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  siteMainTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  siteAddressText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  siteCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
  },
  editSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  editSiteTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
  },
  saveSiteEditBtn: {
    padding: 8,
    borderRadius: 8,
  },

  /* Payment Modal */
  paymentCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentBankTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  addPaymentBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addPaymentBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Support Modal */
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  supportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportSub: {
    fontSize: 12,
    marginTop: 2,
  },
  faqAccordionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  faqAnswerText: {
    fontSize: 12,
    lineHeight: 18,
  },

  /* About Modal */
  aboutHeadingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  aboutBodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
