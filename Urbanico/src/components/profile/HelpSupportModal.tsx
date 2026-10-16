import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { HelpCircle, X, Phone, Mail, MessageSquare, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <HelpCircle size={18} color={theme.textPrimary} />
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Help & Support</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.open('tel:+918297474332', '_self');
                }
              }}
              style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              activeOpacity={0.75}
            >
              <View style={styles.helpItemLeft}>
                <Phone size={18} color={theme.primary} />
                <View>
                  <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>Customer Support</Text>
                  <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>Direct helpline: +91 8297474332</Text>
                </View>
              </View>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.open('mailto:urbanicoapp@gmail.com', '_self');
                }
              }}
              style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 10 }]}
              activeOpacity={0.75}
            >
              <View style={styles.helpItemLeft}>
                <Mail size={18} color={theme.primary} />
                <View>
                  <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>Commercial Invoicing & Support</Text>
                  <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>urbanicoapp@gmail.com</Text>
                </View>
              </View>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.open('https://wa.me/918297474332', '_blank');
                }
              }}
              style={[styles.helpItemRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, marginTop: 10 }]}
              activeOpacity={0.75}
            >
              <View style={styles.helpItemLeft}>
                <MessageSquare size={18} color="#25D366" />
                <View>
                  <Text style={[styles.helpItemTitle, { color: theme.textPrimary }]}>WhatsApp Dispatch Desk</Text>
                  <Text style={[styles.helpItemSub, { color: theme.textSecondary }]}>+91 8297474332 (Direct WhatsApp support)</Text>
                </View>
              </View>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  modalContent: {
    width: '100%',
    maxWidth: 480,
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
  helpItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  helpItemSub: {
    fontSize: 12,
  },
});

export default HelpSupportModal;
