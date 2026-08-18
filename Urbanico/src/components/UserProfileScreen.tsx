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
  Settings,
  ChevronRight,
  Edit2,
  CreditCard,
  X,
  Plus,
  Trash2,
  Navigation,
  Check,
  Mail,
  HelpCircle,
  ChevronDown,
  Truck,
  FileText,
  Gift,
  Copy,
  Share2,
  CheckCircle2,
} from 'lucide-react-native';
import { UserProfile, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

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
  const { currentLanguageOption } = useLanguage();
  const { showToast } = useToast();
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
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);

  // Address edit state
  const [newAddressInput, setNewAddressInput] = useState('');
  const [editingAddressOld, setEditingAddressOld] = useState<string | null>(null);
  const [editingAddressInput, setEditingAddressInput] = useState('');

  // Edit profile form state
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editEmail, setEditEmail] = useState(user.email);

  // Refer & Earn state
  const referralCode = 'URBAN500';

  React.useEffect(() => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditEmail(user.email);
  }, [user]);

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
      showToast('Profile updated', 'info');
    }, 800);
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
      showToast('Profile updated');
    }, 400);
  };

  const handleCopyReferralCode = () => {
    showToast(`Referral code ${referralCode} copied to clipboard!`);
  };

  const handleShareReferral = () => {
    showToast('Opening sharing options...');
  };

  const handleAddAddress = () => {
    if (!newAddressInput.trim()) return;
    addLocation(newAddressInput.trim());
    showToast('New address added');
    setNewAddressInput('');
  };

  const handleUseCurrentLocationGPS = () => {
    const gpsAddr = 'Plot 42, Hitech City, Hyderabad (GPS Location)';
    addLocation(gpsAddr);
    showToast('GPS Location added');
  };

  const handleStartEditAddress = (oldLoc: string) => {
    setEditingAddressOld(oldLoc);
    setEditingAddressInput(oldLoc);
  };

  const handleSaveEditAddress = () => {
    if (editingAddressOld && editingAddressInput.trim()) {
      editLocation(editingAddressOld, editingAddressInput.trim());
      showToast('Address updated');
    }
    setEditingAddressOld(null);
    setEditingAddressInput('');
  };

  const handleDeleteAddress = (locToDelete: string) => {
    deleteLocation(locToDelete);
    showToast('Address removed');
  };

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
        {/* User Profile Card: Name + Verified Icon Only */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileCardMain}>
            <View style={styles.profileInfoColumn}>
              <View style={styles.nameRow}>
                <Text style={[styles.userNameText, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                  {isLoggedIn ? user.name : 'Guest User'}
                </Text>
                {isLoggedIn && user.isVerified && (
                  <ShieldCheck size={18} color="#0071E3" />
                )}
              </View>

              <Text style={[styles.userContactText, { color: theme.textSecondary }]}>
                {isLoggedIn ? `${user.phone}${user.email ? ' • ' + user.email : ''}` : 'Sign in to access your account'}
              </Text>
            </View>

            {isLoggedIn && (
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(true)}
                style={[styles.editInfoBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Edit2 size={15} color={theme.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Unified Profile Menu Section */}
        <View style={[styles.listContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* 1. My Orders and Dispatches */}
          <TouchableOpacity
            onPress={() => setIsOrdersModalOpen(true)}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <Truck size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>My Orders & Dispatches</Text>
            </View>
            <View style={styles.listItemRightBadge}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>{deliveries.length} Orders</Text>
              <ChevronRight size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* 2. Manage Saved Site Addresses */}
          <TouchableOpacity
            onPress={() => setIsAddressesModalOpen(true)}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <MapPin size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Saved Addresses</Text>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* 3. Manage Payment Methods */}
          <TouchableOpacity
            onPress={() => setIsPaymentsModalOpen(true)}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <CreditCard size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Payment Methods</Text>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* 4. Refer and Earn */}
          <TouchableOpacity
            onPress={() => setIsReferModalOpen(true)}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <Gift size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Refer & Earn</Text>
            </View>
            <View style={styles.listItemRightBadge}>
              <Text style={[styles.rewardHighlightText, { color: theme.primary }]}>Get ₹500</Text>
              <ChevronRight size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* 5. Settings & Language Preferences */}
          <TouchableOpacity
            onPress={() => onNavigateScreen('settings')}
            style={[styles.listItemRow, { borderBottomColor: theme.borderLight }]}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <Settings size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Settings</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                {currentLanguageOption.nativeName}
              </Text>
              <ChevronRight size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* 6. Help & Support */}
          <TouchableOpacity
            onPress={() => setIsSupportModalOpen(true)}
            style={styles.listItemRow}
            activeOpacity={0.7}
          >
            <View style={styles.listItemLeft}>
              <HelpCircle size={18} color={theme.textPrimary} />
              <Text style={[styles.listItemText, { color: theme.textPrimary }]}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Action Button: Sign In / Out */}
        {isLoggedIn ? (
          <TouchableOpacity
            onPress={onLogout}
            style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onNavigateScreen('auth_mobile')}
            style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionBtnText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODAL: My Orders & Dispatches */}
      <Modal visible={isOrdersModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsOrdersModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>My Orders & Dispatches</Text>
              <TouchableOpacity
                onPress={() => setIsOrdersModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary }]}>Active Dispatches ({deliveries.length})</Text>

              {deliveries.map((del) => (
                <View
                  key={del.id}
                  style={[styles.orderDispatchCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                >
                  <View style={styles.orderDispatchHeader}>
                    <View>
                      <Text style={[styles.orderNumberText, { color: theme.textPrimary }]}>
                        Order #{del.orderNumber}
                      </Text>
                      <Text style={[styles.orderMaterialText, { color: theme.textSecondary }]}>
                        {del.materialName} • {del.quantity}
                      </Text>
                    </View>
                    <View style={[styles.orderStatusBadge, { backgroundColor: del.status === 'En Route' ? theme.primaryLight : theme.surface }]}>
                      <Text style={[styles.orderStatusText, { color: del.status === 'En Route' ? theme.primaryDark : theme.textPrimary }]}>
                        {del.status}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.orderDispatchMeta, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.metaSmallLabel, { color: theme.textSecondary }]}>Vehicle & Driver</Text>
                      <Text style={[styles.metaValueText, { color: theme.textPrimary }]}>
                        {del.vehicleNumber} ({del.driverName})
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={[styles.metaSmallLabel, { color: theme.textSecondary }]}>Amount</Text>
                      <Text style={[styles.metaValueText, { color: theme.textPrimary }]}>
                        ₹{del.totalAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderDispatchActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsOrdersModalOpen(false);
                        onNavigateScreen('basket');
                      }}
                      style={[styles.orderTrackBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      activeOpacity={0.7}
                    >
                      <Truck size={14} color={theme.primary} />
                      <Text style={[styles.orderTrackBtnText, { color: theme.primary }]}>Track Live</Text>
                    </TouchableOpacity>

                    {onViewInvoice && (
                      <TouchableOpacity
                        onPress={() => {
                          setIsOrdersModalOpen(false);
                          onViewInvoice(del);
                        }}
                        style={[styles.orderInvoiceBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        activeOpacity={0.7}
                      >
                        <FileText size={14} color={theme.textPrimary} />
                        <Text style={[styles.orderInvoiceBtnText, { color: theme.textPrimary }]}>Invoice</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Refer & Earn */}
      <Modal visible={isReferModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsReferModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Refer & Earn</Text>
              <TouchableOpacity
                onPress={() => setIsReferModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <View style={[styles.referHeroBanner, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <View style={[styles.referIconCircle, { backgroundColor: theme.primaryLight }]}>
                  <Gift size={28} color={theme.primary} />
                </View>
                <Text style={[styles.referHeroTitle, { color: theme.textPrimary }]}>
                  Earn ₹500 for Every Referred Site
                </Text>
                <Text style={[styles.referHeroSubtitle, { color: theme.textSecondary }]}>
                  Share your referral code with fellow contractors and builders. They get ₹500 off their first order, and you receive ₹500 wallet credit!
                </Text>
              </View>

              {/* Referral Code Box */}
              <View style={[styles.codeBoxContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}>
                <View>
                  <Text style={[styles.codeLabelText, { color: theme.textSecondary }]}>YOUR EXCLUSIVE CODE</Text>
                  <Text style={[styles.codeValueText, { color: theme.primary }]}>{referralCode}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyReferralCode}
                  style={[styles.copyCodeBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  <Copy size={15} color="#FFFFFF" />
                  <Text style={styles.copyCodeBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>

              {/* Progress & Stats */}
              <View style={[styles.statsRowCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <View style={styles.statCol}>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>3</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Successful Invites</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statCol}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>₹1,500</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Credits Earned</Text>
                </View>
              </View>

              {/* Share Actions */}
              <TouchableOpacity
                onPress={handleShareReferral}
                style={[styles.shareWhatsAppBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.shareWhatsAppBtnText}>Share Code with Contractors</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Edit Profile */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalFormScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Full Name"
                  placeholderTextColor="#86868B"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Phone</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone Number"
                  placeholderTextColor="#86868B"
                  keyboardType="phone-pad"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Email</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Email"
                  placeholderTextColor="#86868B"
                  keyboardType="email-address"
                  style={[styles.formInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooterActions, { borderTopColor: theme.borderLight }]}>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveBtnText}>{isSavingProfile ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: Addresses */}
      <Modal visible={isAddressesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAddressesModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Saved Addresses</Text>
              <TouchableOpacity
                onPress={() => setIsAddressesModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.addSiteBox}>
                <TextInput
                  value={newAddressInput}
                  onChangeText={setNewAddressInput}
                  placeholder="Add address..."
                  placeholderTextColor="#86868B"
                  style={[styles.addSiteInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />
                <TouchableOpacity
                  onPress={handleAddAddress}
                  style={[styles.addSiteBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleUseCurrentLocationGPS}
                style={[styles.gpsLocationBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <Navigation size={15} color={theme.primary} />
                <Text style={[styles.gpsLocationBtnText, { color: theme.primary }]}>
                  Detect Current Location
                </Text>
              </TouchableOpacity>

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 14 }]}>
                Saved ({savedLocations.length})
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
                          showToast('Address selected');
                        }}
                        style={styles.siteMainTouch}
                        activeOpacity={0.7}
                      >
                        <MapPin size={16} color={isSelected ? theme.primary : theme.textSecondary} />
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
                          <Edit2 size={14} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteAddress(loc)}
                          style={styles.actionIconBtn}
                        >
                          <Trash2 size={14} color={theme.textSecondary} />
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
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Payment Methods</Text>
              <TouchableOpacity
                onPress={() => setIsPaymentsModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textSecondary} />
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
                      <Text style={[styles.paymentSubText, { color: theme.textSecondary }]}>•••• {card.last4}</Text>
                    </View>
                    {card.isDefault && (
                      <View style={[styles.activePill, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.activePillText, { color: theme.primary }]}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 14 }]}>UPI</Text>
              <View style={[styles.paymentCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <View style={styles.paymentCardHeader}>
                  <Text style={[styles.paymentBankTitle, { color: theme.textPrimary }]}>{savedUpi}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Support & FAQ */}
      <Modal visible={isSupportModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsSupportModalOpen(false)} />
          <View style={[styles.modalSheetContainer, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderLight }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Help & Support</Text>
              <TouchableOpacity
                onPress={() => setIsSupportModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <TouchableOpacity
                onPress={() => Linking.openURL('tel:18001239876')}
                style={[styles.supportCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <Phone size={18} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>Customer Support</Text>
                  <Text style={[styles.supportSub, { color: theme.textSecondary }]}>1800-123-9876</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL('mailto:support@urbanico.in')}
                style={[styles.supportCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.8}
              >
                <Mail size={18} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>Email</Text>
                  <Text style={[styles.supportSub, { color: theme.textSecondary }]}>support@urbanico.in</Text>
                </View>
              </TouchableOpacity>

              <Text style={[styles.modalSectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>FAQ</Text>

              {[
                {
                  q: 'How do I track my order?',
                  a: 'Navigate to Cart > Orders & Tracking or tap My Orders & Dispatches in your profile to view real-time delivery status.',
                },
                {
                  q: 'How do I change my site address?',
                  a: 'Tap Saved Addresses in your profile to add, edit, or select an active delivery location.',
                },
                {
                  q: 'How do I download tax invoices?',
                  a: 'Tax invoices with official billing breakdowns are generated automatically with every order and available in your order history.',
                },
                {
                  q: 'What payment methods are supported?',
                  a: 'We accept Razorpay Cards, Netbanking, UPI, and PayLater.',
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
                      <Text style={[styles.faqQuestionText, { color: theme.textPrimary }]}>{faq.q}</Text>
                      <ChevronDown size={16} color={theme.textSecondary} />
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
  profileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  profileCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfoColumn: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  userContactText: {
    fontSize: 13,
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
  listContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  listItemRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifiedTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  rewardHighlightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
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
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
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
    paddingBottom: 20,
  },
  inputFieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  formInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalFooterActions: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  modalSaveBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addSiteBox: {
    flexDirection: 'row',
    gap: 8,
  },
  addSiteInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  addSiteBtn: {
    width: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  gpsLocationBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  siteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  editSiteRow: {
    flex: 1,
    flexDirection: 'row',
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
    width: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteMainTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siteAddressText: {
    flex: 1,
    fontSize: 13,
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  siteCardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionIconBtn: {
    padding: 6,
  },
  paymentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentBankTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  supportSub: {
    fontSize: 12,
    marginTop: 1,
  },
  faqAccordionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  faqAnswerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  orderDispatchCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  orderDispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderMaterialText: {
    fontSize: 12,
    marginTop: 2,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderDispatchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  metaSmallLabel: {
    fontSize: 11,
  },
  metaValueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDispatchActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  orderTrackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  orderTrackBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  orderInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gstVerificationBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  gstBadgeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  gstBadgeSubtitle: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  referHeroBanner: {
    alignItems: 'center',
    textAlign: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  referIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  referHeroSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  codeBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  codeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  codeValueText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyCodeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  shareWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutBrandHeader: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  aboutBrandName: {
    fontSize: 16,
    fontWeight: '700',
  },
  aboutVersionText: {
    fontSize: 12,
  },
  aboutBodyParagraph: {
    fontSize: 13,
    lineHeight: 19,
  },
  pledgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pledgeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  pledgeSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  aboutContactText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
