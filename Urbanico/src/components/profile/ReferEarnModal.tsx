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
import { Gift, X, Copy, Share2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface ReferEarnModalProps {
  visible: boolean;
  onClose: () => void;
  referralCode: string;
  onCopyReferralCode: () => void;
  onShareReferral: () => void;
}

export const ReferEarnModal: React.FC<ReferEarnModalProps> = ({
  visible,
  onClose,
  referralCode,
  onCopyReferralCode,
  onShareReferral,
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
              <Gift size={18} color={theme.textPrimary} />
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Refer & Earn</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.referHeroSection}>
              <View style={[styles.giftCircle, { backgroundColor: theme.mode === 'dark' ? '#334155' : '#F1F5F9' }]}>
                <Gift size={32} color={theme.textPrimary} />
              </View>
              <Text style={[styles.referHeroTitle, { color: theme.textPrimary }]}>
                Earn ₹100 for every builder you invite
              </Text>
              <Text style={[styles.referHeroSubtitle, { color: theme.textSecondary }]}>
                Share your referral link with contractor friends. When they place their first construction materials order, both of you receive ₹100 in Urbanico Wallet.
              </Text>
            </View>

            <View style={[styles.referCodeCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Text style={[styles.referCodeLabel, { color: theme.textMuted }]}>YOUR REFERRAL CODE</Text>
              <Text style={[styles.referCodeText, { color: theme.textPrimary }]}>{referralCode}</Text>
              <View style={styles.referActionButtons}>
                <TouchableOpacity onPress={onCopyReferralCode} style={styles.referCopyBtn} activeOpacity={0.75}>
                  <Copy size={14} color="#111111" />
                  <Text style={styles.referCopyBtnText}>Copy Code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onShareReferral} style={styles.referShareBtn} activeOpacity={0.8}>
                  <Share2 size={14} color="#FFFFFF" />
                  <Text style={styles.referShareBtnText}>Share on WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  referHeroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  giftCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  referHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  referHeroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  referCodeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  referCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  referCodeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  referActionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  referCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  referCopyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
  },
  referShareBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#25D366',
  },
  referShareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ReferEarnModal;
