import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, MapPin, Building2, Home, Briefcase, Warehouse } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAddressForm, AddressFormData } from '../../hooks/useAddressForm';

export interface DeliveryAddressFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (fullAddress: string, data: AddressFormData) => void;
  initialData?: Partial<AddressFormData>;
  title?: string;
}

export const DeliveryAddressFormModal: React.FC<DeliveryAddressFormModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
  title = 'Add Delivery Address',
}) => {
  const { theme } = useTheme();
  const {
    formData,
    errors,
    updateField,
    handlePincodeChange,
    validate,
    resetForm,
  } = useAddressForm(initialData);

  const handleSubmit = () => {
    const result = validate();
    if (result.isValid) {
      onSave(result.fullAddress, formData);
      resetForm();
      onClose();
    }
  };

  const addressTypes: Array<'Site' | 'Home' | 'Office' | 'Warehouse'> = [
    'Site',
    'Home',
    'Office',
    'Warehouse',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 16, gap: 14 }}>
            {/* Address Type Selector */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Address Type</Text>
              <View style={styles.typeSelectorRow}>
                {addressTypes.map((t) => {
                  const isSelected = formData.addressType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => updateField('addressType', t)}
                      style={[
                        styles.typeChip,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: isSelected
                            ? theme.mode === 'dark'
                              ? '#064E3B30'
                              : '#ECFDF5'
                            : theme.surfaceSecondary,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      {t === 'Site' && <Building2 size={13} color={isSelected ? theme.primary : theme.textSecondary} />}
                      {t === 'Home' && <Home size={13} color={isSelected ? theme.primary : theme.textSecondary} />}
                      {t === 'Office' && <Briefcase size={13} color={isSelected ? theme.primary : theme.textSecondary} />}
                      {t === 'Warehouse' && <Warehouse size={13} color={isSelected ? theme.primary : theme.textSecondary} />}
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: isSelected ? theme.primary : theme.textSecondary },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Name & Phone */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  Contact / Incharge *
                </Text>
                <TextInput
                  value={formData.fullName}
                  onChangeText={(t) => updateField('fullName', t)}
                  placeholder="e.g. Ramesh Reddy"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: errors.fullName ? '#EF4444' : theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
                {Boolean(errors.fullName) && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              <View style={styles.col}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  10-Digit Mobile *
                </Text>
                <TextInput
                  value={formData.mobile}
                  onChangeText={(t) => updateField('mobile', t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98480 12345"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: errors.mobile ? '#EF4444' : theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
                {Boolean(errors.mobile) && <Text style={styles.errorText}>{errors.mobile}</Text>}
              </View>
            </View>

            {/* Pincode & City/State */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  6-Digit Pincode *
                </Text>
                <TextInput
                  value={formData.pincode}
                  onChangeText={handlePincodeChange}
                  placeholder="500081"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  maxLength={6}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: errors.pincode ? '#EF4444' : theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
                {Boolean(errors.pincode) && <Text style={styles.errorText}>{errors.pincode}</Text>}
              </View>

              <View style={styles.col}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  City & State (Auto)
                </Text>
                <TextInput
                  value={`${formData.city}, ${formData.state}`}
                  editable={false}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.border,
                      color: theme.textSecondary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Flat / Building / Site */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Plot / Flat / Building / Site Name *
              </Text>
              <TextInput
                value={formData.flatBuilding}
                onChangeText={(t) => updateField('flatBuilding', t)}
                placeholder="e.g. Plot #42, Block C, Silver Oak Heights"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: errors.flatBuilding ? '#EF4444' : theme.border,
                    color: theme.textPrimary,
                  },
                ]}
              />
              {Boolean(errors.flatBuilding) && <Text style={styles.errorText}>{errors.flatBuilding}</Text>}
            </View>

            {/* Area / Street */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Street / Area / Sector *
              </Text>
              <TextInput
                value={formData.areaStreet}
                onChangeText={(t) => updateField('areaStreet', t)}
                placeholder="e.g. Road #12, Jubilee Hills"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: errors.areaStreet ? '#EF4444' : theme.border,
                    color: theme.textPrimary,
                  },
                ]}
              />
              {Boolean(errors.areaStreet) && <Text style={styles.errorText}>{errors.areaStreet}</Text>}
            </View>

            {/* Landmark (Optional) */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Landmark (Optional)
              </Text>
              <TextInput
                value={formData.landmark}
                onChangeText={(t) => updateField('landmark', t)}
                placeholder="e.g. Near Metro Station / Opposite Apollo Pharmacy"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Delivery Instructions (Optional) */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Site Unloading Notes (Optional)
              </Text>
              <TextInput
                value={formData.deliveryInstructions}
                onChangeText={(t) => updateField('deliveryInstructions', t)}
                placeholder="e.g. Call incharge before entry; heavy tipper accessible gate"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Save Delivery Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    maxHeight: 520,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 10.5,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
