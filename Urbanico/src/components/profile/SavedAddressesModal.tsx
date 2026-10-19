import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MapPin, X, Plus, Trash2, Check, AlertCircle, Building2, Home } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { INDIAN_STATES, ADDRESS_TYPE_OPTIONS } from '../../utils/addressHelper';

export interface SavedAddressesModalProps {
  visible: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  savedLocations: string[];
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  onDeleteLocation: (loc: string) => void;
  newSiteName: string;
  setNewSiteName: (val: string) => void;
  newStreet: string;
  setNewStreet: (val: string) => void;
  newPincode: string;
  setNewPincode: (val: string) => void;
  newCity: string;
  setNewCity: (val: string) => void;
  newState: string;
  setNewState: (val: string) => void;
  newAddrContact: string;
  setNewAddrContact: (val: string) => void;
  newAddrPhone: string;
  setNewAddrPhone: (val: string) => void;
  newAddressType: 'site' | 'warehouse' | 'office' | 'home';
  setNewAddressType: (val: 'site' | 'warehouse' | 'office' | 'home') => void;
  addrFormErrors: Record<string, string>;
  setAddrFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handlePincodeChange: (pin: string) => void;
  handleAddNewAddress: () => void;
  isAddingNewAddress: boolean;
  setIsAddingNewAddress: (val: boolean) => void;
}

export const SavedAddressesModal: React.FC<SavedAddressesModalProps> = ({
  visible,
  onClose,
  isLoggedIn,
  savedLocations,
  selectedLocation,
  onSelectLocation,
  onDeleteLocation,
  newSiteName,
  setNewSiteName,
  newStreet,
  setNewStreet,
  newPincode,
  newCity,
  setNewCity,
  newState,
  setNewState,
  newAddrContact,
  setNewAddrContact,
  newAddrPhone,
  setNewAddrPhone,
  newAddressType,
  setNewAddressType,
  addrFormErrors,
  setAddrFormErrors,
  handlePincodeChange,
  handleAddNewAddress,
  isAddingNewAddress,
  setIsAddingNewAddress,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrapper}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MapPin size={18} color={theme.textPrimary} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Saved Addresses</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                    Add your project sites, yards, or warehouse destinations for 1-click dispatch.
                  </Text>
                </View>
              ) : (
                <View style={styles.addressListContainer}>
                  {savedLocations.map((loc, idx) => {
                    const isSelected = selectedLocation === loc;
                    const parts = loc.split(',');
                    const primaryLine = parts[0]?.trim() || `Site Address #${idx + 1}`;
                    const secondaryLine = parts.slice(1).join(',').trim();

                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => onSelectLocation(loc)}
                        style={[
                          styles.addressCard,
                          {
                            backgroundColor: isSelected
                              ? (theme.mode === 'dark' ? '#1E293B' : '#F0F9FF')
                              : theme.surfaceSecondary,
                            borderColor: isSelected ? (theme.mode === 'dark' ? '#38BDF8' : '#BAE6FD') : theme.border,
                            borderWidth: 1,
                            borderRadius: 14,
                            padding: 14,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <View style={styles.addressCardHeader}>
                          <View style={styles.addressCardIconTitle}>
                            <MapPin size={16} color={isSelected ? theme.primary : theme.textSecondary} />
                            <Text
                              style={[
                                styles.addressCardTitle,
                                { color: theme.textPrimary, fontWeight: isSelected ? '700' : '600' },
                              ]}
                              numberOfLines={1}
                            >
                              {primaryLine}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.activePill,
                              {
                                backgroundColor: isSelected
                                  ? theme.primary
                                  : (theme.mode === 'dark' ? '#334155' : '#E2E8F0'),
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.activePillText,
                                {
                                  color: isSelected ? (theme.primaryText || '#18181B') : theme.textSecondary,
                                },
                              ]}
                            >
                              {isSelected ? 'DELIVERY SITE' : 'SAVED SITE'}
                            </Text>
                          </View>
                        </View>
                        {secondaryLine ? (
                          <Text style={[styles.addressCardBody, { color: theme.textSecondary }]} numberOfLines={2}>
                            {secondaryLine}
                          </Text>
                        ) : null}
                        <View style={styles.addressCardActions}>
                          <TouchableOpacity
                            onPress={() => onDeleteLocation(loc)}
                            style={styles.deleteAddressBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={13} color="#EF4444" />
                            <Text style={styles.deleteAddressText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Add New Address Form Section */}
              <View style={[styles.addNewSection, { borderColor: theme.border }]}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  + Add New Project Site Address
                </Text>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Site / Project Name <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  value={newSiteName}
                  onChangeText={(t) => {
                    setNewSiteName(t);
                    if (addrFormErrors.siteName) setAddrFormErrors((prev) => ({ ...prev, siteName: '' }));
                  }}
                  placeholder="e.g. Urbanico Sky Tower Site A"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: addrFormErrors.siteName ? '#EF4444' : theme.border }]}
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Street / Area / Landmark <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  value={newStreet}
                  onChangeText={(t) => {
                    setNewStreet(t);
                    if (addrFormErrors.street) setAddrFormErrors((prev) => ({ ...prev, street: '' }));
                  }}
                  placeholder="e.g. Plot 42, Financial District, Nanakramguda"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: addrFormErrors.street ? '#EF4444' : theme.border }]}
                />

                <View style={styles.inputRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      Pincode <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      value={newPincode}
                      onChangeText={handlePincodeChange}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="e.g. 500032"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: addrFormErrors.pincode ? '#EF4444' : theme.border }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      City <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <TextInput
                      value={newCity}
                      onChangeText={(t) => {
                        setNewCity(t);
                        if (addrFormErrors.city) setAddrFormErrors((prev) => ({ ...prev, city: '' }));
                      }}
                      placeholder="e.g. Hyderabad"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: addrFormErrors.city ? '#EF4444' : theme.border }]}
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>State</Text>
                <TextInput
                  value={newState}
                  onChangeText={setNewState}
                  placeholder="e.g. Telangana"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
                />

                <TouchableOpacity
                  onPress={handleAddNewAddress}
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>+ Save Delivery Address</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  emptyAddressBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyBoxSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  addressListContainer: {
    marginBottom: 20,
    gap: 10,
  },
  addressCard: {
    borderRadius: 14,
    padding: 14,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressCardIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressCardTitle: {
    fontSize: 14,
  },
  activePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  addressCardBody: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  addressCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteAddressText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  addNewSection: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
  },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SavedAddressesModal;
