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
  onOpenLoginModal?: () => void;
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
  onOpenLoginModal,
}) => {
  const { theme } = useTheme();
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
  const [editCompany, setEditCompany] = useState(user.companyName || '');
  const [editGstin, setEditGstin] = useState(user.gstin || '');

  // Refer & Earn state dynamically generated for the active user
  const referralCode = React.useMemo(() => {
    const cleanDigits = (user.phone || '').replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      return `URBAN${cleanDigits.slice(-4)}`;
    }
    if (user.name && user.name.trim()) {
      const cleanName = user.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
      return `URBAN${cleanName || 'PRO'}500`;
    }
    return 'URBAN500';
  }, [user.phone, user.name]);

  React.useEffect(() => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditEmail(user.email);
    setEditCompany(user.companyName || '');
    setEditGstin(user.gstin || '');
  }, [user]);

  // Saved Payments state with user-scoped localStorage persistence
  const userStorageKey = isLoggedIn && user.phone ? user.phone.replace(/\D/g, '') : 'guest';

  const [savedCards, setSavedCards] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && isLoggedIn) {
        const stored = window.localStorage.getItem(`urbanico_saved_cards_${userStorageKey}`);
        if (stored) return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return isLoggedIn
      ? [
          { id: '1', bank: 'HDFC Bank Visa', last4: '4821', type: 'Credit Card', isDefault: true },
          { id: '2', bank: 'ICICI Bank Mastercard', last4: '9102', type: 'Debit Card', isDefault: false },
        ]
      : [];
  });

  const [savedUpi, setSavedUpi] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && isLoggedIn) {
        const stored = window.localStorage.getItem(`urbanico_saved_upi_${userStorageKey}`);
        if (stored) return stored;
      }
    } catch {
      // ignore
    }
    return isLoggedIn ? (user.email ? `${user.email.split('@')[0]}@okhdfcbank` : 'kanusuraj15@okhdfcbank') : '';
  });

  // Re-sync saved cards & upi when user changes
  useEffect(() => {
    if (!isLoggedIn) {
      setSavedCards([]);
      setSavedUpi('');
      return;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedCards = window.localStorage.getItem(`urbanico_saved_cards_${userStorageKey}`);
        if (storedCards) {
          setSavedCards(JSON.parse(storedCards));
        } else {
          setSavedCards([
            { id: '1', bank: 'HDFC Bank Visa', last4: '4821', type: 'Credit Card', isDefault: true },
            { id: '2', bank: 'ICICI Bank Mastercard', last4: '9102', type: 'Debit Card', isDefault: false },
          ]);
        }
        const storedUpi = window.localStorage.getItem(`urbanico_saved_upi_${userStorageKey}`);
        if (storedUpi) {
          setSavedUpi(storedUpi);
        } else {
          setSavedUpi(user.email ? `${user.email.split('@')[0]}@okhdfcbank` : 'kanusuraj15@okhdfcbank');
        }
      }
    } catch {
      // ignore
    }
  }, [isLoggedIn, userStorageKey]);

  // Save payments to storage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && isLoggedIn && userStorageKey !== 'guest') {
        window.localStorage.setItem(`urbanico_saved_cards_${userStorageKey}`, JSON.stringify(savedCards));
      }
    } catch {
      // ignore
    }
  }, [savedCards, isLoggedIn, userStorageKey]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && isLoggedIn && userStorageKey !== 'guest') {
        window.localStorage.setItem(`urbanico_saved_upi_${userStorageKey}`, savedUpi);
      }
    } catch {
      // ignore
    }
  }, [savedUpi, isLoggedIn, userStorageKey]);

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
    const sanitizedGstin = editGstin.trim().toUpperCase();
    setTimeout(() => {
      setIsSavingProfile(false);
      onUpdateUser({
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        companyName: editCompany.trim(),
        gstin: sanitizedGstin,
      });
      setIsEditModalOpen(false);
      showToast('Profile updated');
    }, 400);
  };

  const handleCopyReferralCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode).catch(() => {});
    }
    showToast(`Referral code ${referralCode} copied to clipboard!`, 'success');
  };

  const handleShareReferral = async () => {
    const shareText = `Use my Urbanico referral code ${referralCode} to get ₹500 off your first construction materials or trade service order!`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Urbanico Construction - ₹500 Discount',
          text: shareText,
          url: window.location.origin,
        });
        showToast('Referral invitation shared successfully!', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    showToast(`Referral message copied to clipboard!`, 'success');
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
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#111111"
            colors={['#111111']}
          />
        }
      >
        {/* Profile Header Identity Card (Nike Clean Member Header) */}
        {!isLoggedIn ? (
          <View style={styles.nikeGuestCard}>
            <View style={styles.guestTextCol}>
              <Text style={styles.guestTitle}>Welcome Guest</Text>
              <Text style={styles.guestSubText}>
                Log in or sign up to manage your orders, saved addresses & settings
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (onOpenLoginModal) {
                  onOpenLoginModal();
                } else {
                  onNavigateScreen('auth_mobile');
                }
              }}
              style={styles.guestLoginBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.guestLoginBtnText}>Log In or Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.memberCard}>
            <View style={styles.memberInfoCol}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberNameText}>{user.name}</Text>
                {user.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={14} color="#111111" strokeWidth={2.2} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.memberContactText}>
                {user.phone}{user.email ? ` • ${user.email}` : ''}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsEditModalOpen(true)}
              style={styles.editProfilePillBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.editProfilePillText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Single Clean Nike Menu Structure */}
        <View style={styles.menuContainer}>
          {/* 1. My Orders & Dispatches */}
          <TouchableOpacity
            onPress={() => {
              if (!isLoggedIn) {
                showToast('Please log in to view orders & dispatches', 'info');
                if (onOpenLoginModal) {
                  onOpenLoginModal();
                } else {
                  onNavigateScreen('auth_mobile');
                }
              } else {
                setIsOrdersModalOpen(true);
              }
            }}
            style={styles.menuRow}
            activeOpacity={0.65}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <Truck size={19} color="#111111" strokeWidth={1.8} />
              </View>
              <Text style={styles.menuTitleText}>My Orders & Dispatches</Text>
            </View>
            <View style={styles.menuRowRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {isLoggedIn ? `${deliveries.length} Active` : '0'}
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* 2. Saved Addresses */}
          <TouchableOpacity
            onPress={() => {
              if (!isLoggedIn) {
                showToast('Please log in to manage saved addresses', 'info');
                if (onOpenLoginModal) {
                  onOpenLoginModal();
                } else {
                  onNavigateScreen('auth_mobile');
                }
              } else {
                setIsAddressesModalOpen(true);
              }
            }}
            style={styles.menuRow}
            activeOpacity={0.65}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <MapPin size={19} color="#111111" strokeWidth={1.8} />
              </View>
              <Text style={styles.menuTitleText}>Saved Addresses</Text>
            </View>
            <View style={styles.menuRowRight}>
              <Text style={styles.subDetailText}>{savedLocations.length} Saved</Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* 3. Payment Methods */}
          <TouchableOpacity
            onPress={() => {
              if (!isLoggedIn) {
                showToast('Please log in to manage payment methods', 'info');
                if (onOpenLoginModal) {
                  onOpenLoginModal();
                } else {
                  onNavigateScreen('auth_mobile');
                }
              } else {
                setIsPaymentsModalOpen(true);
              }
            }}
            style={styles.menuRow}
            activeOpacity={0.65}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <CreditCard size={19} color="#111111" strokeWidth={1.8} />
              </View>
              <Text style={styles.menuTitleText}>Payment Methods</Text>
            </View>
            <View style={styles.menuRowRight}>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* 4. Refer & Earn */}
          <TouchableOpacity
            onPress={() => {
              if (!isLoggedIn) {
                showToast('Please log in to access Refer & Earn', 'info');
                if (onOpenLoginModal) {
                  onOpenLoginModal();
                } else {
                  onNavigateScreen('auth_mobile');
                }
              } else {
                setIsReferModalOpen(true);
              }
            }}
            style={styles.menuRow}
            activeOpacity={0.65}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <Gift size={19} color="#111111" strokeWidth={1.8} />
              </View>
              <Text style={styles.menuTitleText}>Refer & Earn</Text>
            </View>
            <View style={styles.menuRowRight}>
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText}>Get ₹500</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* 5. Settings */}
          <TouchableOpacity
            onPress={() => onNavigateScreen('settings')}
            style={styles.menuRow}
            activeOpacity={0.65}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <Settings size={19} color="#111111" strokeWidth={1.8} />
              </View>
              <Text style={styles.menuTitleText}>Settings</Text>
            </View>
            <View style={styles.menuRowRight}>
              <Text style={styles.subDetailText}>
                {currentLanguageOption.nativeName}
              </Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* 6. Help & Support */}
          <TouchableOpacity
            onPress={() => setIsSupportModalOpen(true)}
            style={styles.menuRowLast}
            activeOpacity={0.65}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <HelpCircle size={19} color="#111111" strokeWidth={1.8} />
              </View>
              <Text style={styles.menuTitleText}>Help & Support</Text>
            </View>
            <View style={styles.menuRowRight}>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Button: Sign Out */}
        {isLoggedIn && (
          <TouchableOpacity
            onPress={onLogout}
            style={styles.signOutBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* SUB-SCREEN 1: My Orders & Dispatches Modal */}
      {/* ========================================================================= */}
      <Modal visible={isOrdersModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsOrdersModalOpen(false)} />
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>My Orders & Dispatches</Text>
              <TouchableOpacity
                onPress={() => setIsOrdersModalOpen(false)}
                style={styles.closeModalBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#111111" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              {deliveries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Truck size={28} color="#111111" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.emptyTitle}>No Orders Yet</Text>
                  <Text style={styles.emptySubText}>
                    When you place material orders, real-time dispatches, vehicle tracking, and GST tax invoices will appear here.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsOrdersModalOpen(false);
                      onNavigateScreen('shop');
                    }}
                    style={styles.primaryPillActionBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryPillActionBtnText}>Explore Materials</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.modalSectionLabel}>
                    Active Dispatches ({deliveries.length})
                  </Text>

                  {deliveries.map((del) => (
                    <View key={del.id} style={styles.orderCard}>
                      <View style={styles.orderCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderNumberText}>Order #{del.orderNumber}</Text>
                          <Text style={styles.orderMaterialText}>
                            {del.materialName} • {del.quantity}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                del.status === 'Delivered'
                                  ? '#ECFDF5'
                                  : del.status === 'En Route'
                                  ? '#111111'
                                  : '#F4F4F5',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  del.status === 'Delivered'
                                    ? '#059669'
                                    : del.status === 'En Route'
                                    ? '#FFFFFF'
                                    : '#111111',
                              },
                            ]}
                          >
                            {del.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.orderMetaRow}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.metaLabel}>Vehicle & Driver</Text>
                          <Text style={styles.metaValue}>
                            {del.vehicleNumber} ({del.driverName})
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Text style={styles.metaLabel}>Amount</Text>
                          <Text style={styles.metaValuePrice}>
                            ₹{del.totalAmount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.orderActionsRow}>
                        <TouchableOpacity
                          onPress={() => {
                            setIsOrdersModalOpen(false);
                            onNavigateScreen('basket');
                          }}
                          style={styles.orderTrackBtn}
                          activeOpacity={0.7}
                        >
                          <Truck size={14} color="#111111" strokeWidth={2} />
                          <Text style={styles.orderTrackBtnText}>Track Live</Text>
                        </TouchableOpacity>

                        {onViewInvoice && (
                          <TouchableOpacity
                            onPress={() => {
                              setIsOrdersModalOpen(false);
                              onViewInvoice(del);
                            }}
                            style={styles.orderInvoiceBtn}
                            activeOpacity={0.7}
                          >
                            <FileText size={14} color="#111111" strokeWidth={2} />
                            <Text style={styles.orderInvoiceBtnText}>Invoice</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* SUB-SCREEN 2: Saved Addresses Modal */}
      {/* ========================================================================= */}
      <Modal visible={isAddressesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAddressesModalOpen(false)} />
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Saved Addresses</Text>
              <TouchableOpacity
                onPress={() => setIsAddressesModalOpen(false)}
                style={styles.closeModalBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#111111" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              {initialOpenAddressesModal && (
                <TouchableOpacity
                  onPress={() => {
                    setIsAddressesModalOpen(false);
                    onNavigateScreen('basket');
                  }}
                  style={styles.returnToCheckoutBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.returnToCheckoutBtnText}>← Return to Checkout (Bag)</Text>
                </TouchableOpacity>
              )}

              <View style={styles.addAddressBox}>
                <TextInput
                  value={newAddressInput}
                  onChangeText={setNewAddressInput}
                  placeholder="Enter new site address..."
                  placeholderTextColor="#86868B"
                  style={styles.addAddressInput}
                />
                <TouchableOpacity
                  onPress={handleAddAddress}
                  style={styles.addAddressBtn}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleUseCurrentLocationGPS}
                style={styles.gpsLocationBtn}
                activeOpacity={0.8}
              >
                <Navigation size={15} color="#111111" strokeWidth={2} />
                <Text style={styles.gpsLocationBtnText}>
                  Detect Current Location (GPS)
                </Text>
              </TouchableOpacity>

              <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>
                Saved Sites ({savedLocations.length})
              </Text>

              {savedLocations.map((loc) => {
                const isSelected = selectedLocation === loc;
                const isEditingThis = editingAddressOld === loc;

                return (
                  <View
                    key={loc}
                    style={[
                      styles.addressCard,
                      isSelected && styles.addressCardSelected,
                    ]}
                  >
                    {isEditingThis ? (
                      <View style={styles.editAddressRow}>
                        <TextInput
                          value={editingAddressInput}
                          onChangeText={setEditingAddressInput}
                          style={styles.editAddressTextInput}
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={handleSaveEditAddress}
                          style={styles.saveEditBtn}
                          activeOpacity={0.8}
                        >
                          <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedLocation(loc);
                          showToast('Address selected');
                        }}
                        style={styles.addressTouchArea}
                        activeOpacity={0.7}
                      >
                        <MapPin
                          size={16}
                          color={isSelected ? '#111111' : '#707072'}
                          strokeWidth={isSelected ? 2.2 : 1.8}
                        />
                        <Text style={[styles.addressText, isSelected && styles.addressTextActive]}>
                          {loc}
                        </Text>
                        {isSelected && (
                          <View style={styles.activeAddressPill}>
                            <Text style={styles.activeAddressPillText}>Active</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}

                    {!isEditingThis && (
                      <View style={styles.addressActions}>
                        <TouchableOpacity
                          onPress={() => handleStartEditAddress(loc)}
                          style={styles.iconActionBtn}
                          activeOpacity={0.7}
                        >
                          <Edit2 size={14} color="#707072" strokeWidth={1.8} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteAddress(loc)}
                          style={styles.iconActionBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={14} color="#707072" strokeWidth={1.8} />
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

      {/* ========================================================================= */}
      {/* SUB-SCREEN 3: Payment Methods Modal */}
      {/* ========================================================================= */}
      <Modal visible={isPaymentsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPaymentsModalOpen(false)} />
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Payment Methods</Text>
              <TouchableOpacity
                onPress={() => setIsPaymentsModalOpen(false)}
                style={styles.closeModalBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#111111" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalSectionLabel}>Saved Cards</Text>

              {savedCards.map((card) => (
                <View key={card.id} style={styles.paymentCard}>
                  <View style={styles.paymentCardHeader}>
                    <CreditCard size={18} color="#111111" strokeWidth={1.8} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.paymentBankTitle}>{card.bank}</Text>
                      <Text style={styles.paymentSubText}>•••• {card.last4} • {card.type}</Text>
                    </View>
                    {card.isDefault && (
                      <View style={styles.defaultPill}>
                        <Text style={styles.defaultPillText}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>UPI ID</Text>
              <View style={styles.paymentCard}>
                <View style={styles.paymentCardHeader}>
                  <View style={styles.upiIconBox}>
                    <Text style={styles.upiIconText}>UPI</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.paymentBankTitle}>{savedUpi}</Text>
                    <Text style={styles.paymentSubText}>Auto-verified for instant checkout</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* SUB-SCREEN 4: Refer & Earn Modal */}
      {/* ========================================================================= */}
      <Modal visible={isReferModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsReferModalOpen(false)} />
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Refer & Earn</Text>
              <TouchableOpacity
                onPress={() => setIsReferModalOpen(false)}
                style={styles.closeModalBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#111111" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.referHeroBanner}>
                <View style={styles.referIconCircle}>
                  <Gift size={24} color="#111111" strokeWidth={1.8} />
                </View>
                <Text style={styles.referHeroTitle}>
                  Earn ₹500 for Every Referred Site
                </Text>
                <Text style={styles.referHeroSubtitle}>
                  Share your referral code with fellow contractors and builders. They get ₹500 off their first order, and you receive ₹500 wallet credit!
                </Text>
              </View>

              {/* Referral Code Box */}
              <View style={styles.codeBoxContainer}>
                <View>
                  <Text style={styles.codeLabelText}>YOUR EXCLUSIVE CODE</Text>
                  <Text style={styles.codeValueText}>{referralCode}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyReferralCode}
                  style={styles.copyCodeBtn}
                  activeOpacity={0.8}
                >
                  <Copy size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.copyCodeBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>

              {/* Progress & Stats */}
              <View style={styles.statsRowCard}>
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statLabel}>Successful Invites</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statValuePrice}>₹1,500</Text>
                  <Text style={styles.statLabel}>Credits Earned</Text>
                </View>
              </View>

              {/* Share Action */}
              <TouchableOpacity
                onPress={handleShareReferral}
                style={styles.shareActionBtn}
                activeOpacity={0.85}
              >
                <Share2 size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.shareActionBtnText}>Share Code with Contractors</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* SUB-SCREEN 5: Edit Profile Modal */}
      {/* ========================================================================= */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditModalOpen(false)} />
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.closeModalBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#111111" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalFormScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputFieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Full Name"
                  placeholderTextColor="#86868B"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone Number"
                  placeholderTextColor="#86868B"
                  keyboardType="phone-pad"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Email Address"
                  placeholderTextColor="#86868B"
                  keyboardType="email-address"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={styles.fieldLabel}>Company / Firm Name</Text>
                <TextInput
                  value={editCompany}
                  onChangeText={setEditCompany}
                  placeholder="e.g. Kumar Infra & Construction Pvt Ltd"
                  placeholderTextColor="#86868B"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.inputFieldGroup}>
                <Text style={styles.fieldLabel}>GSTIN (15 Digits)</Text>
                <TextInput
                  value={editGstin}
                  onChangeText={(val) => setEditGstin(val.toUpperCase())}
                  placeholder="e.g. 36AAACU9812A1Z4"
                  placeholderTextColor="#86868B"
                  autoCapitalize="characters"
                  maxLength={15}
                  style={styles.formInput}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={styles.modalSaveBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveBtnText}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* SUB-SCREEN 6: Help & Support Modal */}
      {/* ========================================================================= */}
      <Modal visible={isSupportModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsSupportModalOpen(false)} />
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Help & Support</Text>
              <TouchableOpacity
                onPress={() => setIsSupportModalOpen(false)}
                style={styles.closeModalBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#111111" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} contentContainerStyle={styles.modalScrollContent}>
              <TouchableOpacity
                onPress={() => Linking.openURL('tel:18001239876')}
                style={styles.supportCard}
                activeOpacity={0.7}
              >
                <View style={styles.supportIconBox}>
                  <Phone size={18} color="#111111" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>Customer Support Hotline</Text>
                  <Text style={styles.supportSub}>1800-123-9876 (Toll-Free, 24/7)</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL('mailto:support@urbanico.in')}
                style={styles.supportCard}
                activeOpacity={0.7}
              >
                <View style={styles.supportIconBox}>
                  <Mail size={18} color="#111111" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>Email Support</Text>
                  <Text style={styles.supportSub}>support@urbanico.in</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>
                Frequently Asked Questions
              </Text>

              {[
                {
                  q: 'How do I track my order?',
                  a: 'Navigate to Bag > Orders & Tracking or tap My Orders & Dispatches in your profile to view real-time delivery status.',
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
                    style={styles.faqCard}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqHeaderRow}>
                      <Text style={styles.faqQuestionText}>{faq.q}</Text>
                      <ChevronDown
                        size={16}
                        color="#707072"
                        style={{
                          transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                        }}
                      />
                    </View>
                    {isExpanded && (
                      <Text style={styles.faqAnswerText}>{faq.a}</Text>
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

  /* Nike Guest Card */
  nikeGuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 20,
    gap: 16,
  },
  guestTextCol: {
    gap: 4,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.4,
  },
  guestSubText: {
    fontSize: 13,
    color: '#707072',
    lineHeight: 18,
  },
  guestLoginBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLoginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  /* Nike Member Card */
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  memberInfoCol: {
    flex: 1,
    gap: 4,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F4F4F5',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111111',
  },
  memberContactText: {
    fontSize: 13,
    color: '#707072',
  },
  editProfilePillBtn: {
    borderWidth: 1.2,
    borderColor: '#111111',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  editProfilePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },

  /* Nike Single Menu Container */
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuRowLast: {
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
  menuIconBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111111',
    letterSpacing: -0.2,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F4F4F5',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  subDetailText: {
    fontSize: 13,
    color: '#707072',
  },
  rewardPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
  },
  rewardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },

  /* Sign Out Button */
  signOutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#E11D48',
  },

  /* Shared Modals / Sub-Screens (Nike Style) */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.3,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalScrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
  modalSectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#707072',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#707072',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  primaryPillActionBtn: {
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 999,
  },
  primaryPillActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Orders Modal Cards */
  orderCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 14,
    gap: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
  },
  orderMaterialText: {
    fontSize: 12.5,
    color: '#707072',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
  },
  metaLabel: {
    fontSize: 11,
    color: '#707072',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111111',
  },
  metaValuePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111111',
  },
  orderActionsRow: {
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
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderTrackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
  orderInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },

  /* Addresses Modal */
  addAddressBox: {
    flexDirection: 'row',
    gap: 8,
  },
  addAddressInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111111',
  },
  addAddressBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnToCheckoutBtn: {
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  returnToCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gpsLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    paddingVertical: 11,
  },
  gpsLocationBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
  },
  addressCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  addressCardSelected: {
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
  },
  editAddressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  editAddressTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
    color: '#111111',
  },
  saveEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTouchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#707072',
  },
  addressTextActive: {
    color: '#111111',
    fontWeight: '600',
  },
  activeAddressPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  activeAddressPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 2,
  },
  iconActionBtn: {
    padding: 6,
  },

  /* Payment Methods Modal */
  paymentCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    padding: 14,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentBankTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111111',
  },
  paymentSubText: {
    fontSize: 12,
    color: '#707072',
    marginTop: 2,
  },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upiIconBox: {
    width: 34,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiIconText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#111111',
  },

  /* Refer & Earn Modal */
  referHeroBanner: {
    alignItems: 'center',
    textAlign: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  referIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  referHeroSubtitle: {
    fontSize: 12.5,
    color: '#707072',
    textAlign: 'center',
    lineHeight: 17,
  },
  codeBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
  },
  codeLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#707072',
    letterSpacing: 0.5,
  },
  codeValueText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 1,
    marginTop: 2,
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  copyCodeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
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
    color: '#111111',
  },
  statValuePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#707072',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  shareActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Edit Profile Form */
  inputFieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#111111',
  },
  modalFooterActions: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalSaveBtn: {
    height: 46,
    borderRadius: 999,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Support & FAQ Modal */
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    padding: 14,
  },
  supportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111111',
  },
  supportSub: {
    fontSize: 12,
    color: '#707072',
    marginTop: 1,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    padding: 14,
    gap: 8,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
    marginRight: 8,
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#707072',
    lineHeight: 18,
  },
});
