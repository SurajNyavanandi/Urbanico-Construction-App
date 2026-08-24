import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Pressable } from 'react-native';
import { UserCheck, Phone, ShieldCheck, X, Check, Users } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

interface SupervisorHandoffModalProps {
  visible: boolean;
  onClose: () => void;
  orderNumber?: string;
  currentSupervisorName?: string;
  currentSupervisorPhone?: string;
  onSaveSupervisor: (name: string, phone: string) => void;
}

export const SupervisorHandoffModal: React.FC<SupervisorHandoffModalProps> = ({
  visible,
  onClose,
  orderNumber = 'URB-HYD-9821',
  currentSupervisorName = 'Anand Verma',
  currentSupervisorPhone = '9876543210',
  onSaveSupervisor,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(currentSupervisorName);
  const [phone, setPhone] = useState(currentSupervisorPhone);

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Please enter supervisor name', 'error');
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    onSaveSupervisor(name.trim(), phone.trim());
    showToast(`Delivery OTP authorization delegated to ${name} (${phone})`, 'success');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleRow}>
              <Users size={18} color="#111111" />
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Site Supervisor OTP Handoff
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.desc, { color: theme.textSecondary }]}>
              Delegate physical gate delivery verification and OTP reception to your site foreman or on-duty supervisor:
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Supervisor / Foreman Name</Text>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Verma (Site Engineer)"
                style={{
                  padding: '10px 12px',
                  fontSize: 13,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.textPrimary,
                  outline: 'none',
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>10-Digit Mobile (For Delivery OTP SMS)</Text>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 9876543210"
                style={{
                  padding: '10px 12px',
                  fontSize: 13,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.textPrimary,
                  outline: 'none',
                }}
              />
            </View>

            <View style={styles.infoCard}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.infoText}>
                The assigned supervisor will receive a direct SMS with 4-digit Delivery OTP upon truck arrival at gate.
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.85}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Confirm Delegation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    padding: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
  },
  formGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
  },
  infoText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 15,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
