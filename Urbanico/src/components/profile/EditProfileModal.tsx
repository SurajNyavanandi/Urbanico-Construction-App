import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Check, Mail } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile } from '../../types';

const CLOUDINARY_PROFILE_PIC = 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile;
  editName: string;
  setEditName: (val: string) => void;
  editCompany: string;
  setEditCompany: (val: string) => void;
  editGstin: string;
  setEditGstin: (val: string) => void;
  editEmail: string;
  setEditEmail: (val: string) => void;
  profileErrors: Record<string, string>;
  setProfileErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSavingProfile: boolean;
  isSendingEmailOtp: boolean;
  isVerifyingEmailOtp: boolean;
  showEmailOtpBox: boolean;
  emailOtp: string;
  setEmailOtp: (val: string) => void;
  handleSendEmailOtp: () => void;
  handleVerifyEmailOtp: () => void;
  handleSaveProfile: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  user,
  editName,
  setEditName,
  editCompany,
  setEditCompany,
  editGstin,
  setEditGstin,
  editEmail,
  setEditEmail,
  profileErrors,
  setProfileErrors,
  isSavingProfile,
  isSendingEmailOtp,
  isVerifyingEmailOtp,
  showEmailOtpBox,
  emailOtp,
  setEmailOtp,
  handleSendEmailOtp,
  handleVerifyEmailOtp,
  handleSaveProfile,
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
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Contractor Details</Text>
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
              <View style={styles.avatarRow}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: user.avatarUrl || CLOUDINARY_PROFILE_PIC }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                  />
                  <View style={styles.avatarBadge}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.avatarRoleTag, { color: theme.textPrimary }]}>Contractor Profile</Text>
                  <Text style={[styles.avatarSubtext, { color: theme.textSecondary }]}>Account details & GST</Text>
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
                  { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: profileErrors.name ? '#EF4444' : theme.border },
                ]}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Company / Firm Name</Text>
              <TextInput
                value={editCompany}
                onChangeText={setEditCompany}
                placeholder="e.g. Sree Infra Projects Pvt Ltd"
                placeholderTextColor={theme.textMuted}
                style={[styles.modalInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.border }]}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>GSTIN (15-Digit Tax ID)</Text>
              <TextInput
                value={editGstin}
                onChangeText={(val) => setEditGstin(val.toUpperCase())}
                placeholder="e.g. 36AAACU9812A1Z4"
                placeholderTextColor={theme.textMuted}
                maxLength={15}
                autoCapitalize="characters"
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: profileErrors.gstin ? '#EF4444' : theme.border },
                ]}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Business Email</Text>
              <TextInput
                value={editEmail}
                onChangeText={(t) => {
                  setEditEmail(t);
                  if (profileErrors.email) setProfileErrors((prev) => ({ ...prev, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="e.g. procure@infra.com"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: profileErrors.email ? '#EF4444' : theme.border },
                ]}
              />

              {Boolean(showEmailOtpBox) && (
                <View style={[styles.emailOtpBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View style={styles.otpHeaderRow}>
                    <Mail size={15} color="#059669" />
                    <Text style={[styles.otpHeaderTitle, { color: theme.textPrimary }]}>Enter 4-Digit Code</Text>
                  </View>
                  <Text style={[styles.otpSubText, { color: theme.textSecondary }]}>
                    Verification code sent to {editEmail.trim()}.
                  </Text>
                  <View style={styles.otpInputRow}>
                    <TextInput
                      value={emailOtp}
                      onChangeText={(val) => setEmailOtp(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="• • • •"
                      placeholderTextColor={theme.textMuted}
                      style={[styles.otpInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleVerifyEmailOtp} style={styles.otpConfirmBtn} activeOpacity={0.85}>
                      <Text style={styles.otpConfirmBtnText}>Verify</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
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
    maxWidth: 500,
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarBadge: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  avatarSubtext: {
    fontSize: 12,
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
  emailOtpBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  otpHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  otpSubText: {
    fontSize: 11.5,
    marginBottom: 10,
  },
  otpInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  otpConfirmBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default EditProfileModal;
