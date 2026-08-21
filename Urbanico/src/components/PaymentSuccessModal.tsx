import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import {
  CheckCircle2,
  Receipt,
  Truck,
  ArrowRight,
  Copy,
  MapPin,
  Share2,
} from 'lucide-react-native';
import { RazorpayPaymentResult } from './RazorpayModal';

interface PaymentSuccessModalProps {
  visible: boolean;
  paymentResult: RazorpayPaymentResult | null;
  selectedLocation: string;
  onClose: () => void;
  onTrackOrder: () => void;
  onViewInvoice?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  visible,
  paymentResult,
  selectedLocation,
  onClose,
  onTrackOrder,
  onViewInvoice,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [shareToast, setShareToast] = React.useState(false);

  if (!visible || !paymentResult) return null;

  const handleCopyPaymentId = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareReceipt = async () => {
    const summaryText = `*Urbanico Construction Order Confirmed*\nOrder ID: ${paymentResult.razorpay_order_id}\nPayment ID: ${paymentResult.razorpay_payment_id}\nAmount: ₹${paymentResult.amount.toLocaleString('en-IN')}\nDelivery Site: ${selectedLocation}\nSupport Helpline: 1800-123-9876`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Urbanico Order Confirmation',
          text: summaryText,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText).catch(() => {});
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  };

  const formattedDate = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Top Minimalist Icon */}
            <View style={styles.iconBox}>
              <CheckCircle2 size={36} color="#059669" strokeWidth={2.2} />
            </View>

            {/* Success Heading */}
            <Text style={styles.successTitle}>Order Confirmed</Text>
            <Text style={styles.successSub}>
              Your payment of ₹{paymentResult.amount.toLocaleString('en-IN')} has been verified.
            </Text>

            {/* Transaction Receipt */}
            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment ID</Text>
                <TouchableOpacity onPress={handleCopyPaymentId} style={styles.copyRow}>
                  <Text style={styles.receiptValueMono}>{paymentResult.razorpay_payment_id}</Text>
                  <Copy size={12} color="#707072" />
                </TouchableOpacity>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID</Text>
                <Text style={styles.receiptValue}>{paymentResult.razorpay_order_id}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date</Text>
                <Text style={styles.receiptValue}>{formattedDate}</Text>
              </View>

              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.receiptLabel}>Delivery To</Text>
                <View style={styles.locRow}>
                  <MapPin size={12} color="#111111" />
                  <Text style={styles.receiptValueLoc} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>

              {copied && (
                <View style={styles.copiedToast}>
                  <Text style={styles.copiedText}>Payment ID copied</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onTrackOrder();
                }}
                style={styles.primaryBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Track Order</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>

              {onViewInvoice && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onViewInvoice();
                  }}
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                >
                  <Receipt size={16} color="#111111" />
                  <Text style={styles.secondaryBtnText}>View Invoice</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleShareReceipt}
                style={styles.secondaryBtn}
                activeOpacity={0.8}
              >
                <Share2 size={16} color="#111111" />
                <Text style={styles.secondaryBtnText}>Share Order Receipt</Text>
              </TouchableOpacity>

              {shareToast && (
                <View style={styles.copiedToast}>
                  <Text style={styles.copiedText}>Order receipt details copied!</Text>
                </View>
              )}

              <TouchableOpacity onPress={onClose} style={styles.tertiaryBtn} activeOpacity={0.7}>
                <Text style={styles.tertiaryBtnText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  successSub: {
    fontSize: 14,
    color: '#707072',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 14,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#707072',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 13,
    color: '#111111',
    fontWeight: '600',
  },
  receiptValueMono: {
    fontSize: 12,
    color: '#111111',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
  },
  receiptValueLoc: {
    fontSize: 12,
    color: '#111111',
    fontWeight: '600',
  },
  copiedToast: {
    marginTop: 8,
    backgroundColor: '#EEEEEE',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  copiedText: {
    fontSize: 11,
    color: '#111111',
    fontWeight: '600',
  },
  actionsGroup: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
  },
  tertiaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  tertiaryBtnText: {
    color: '#707072',
    fontSize: 13,
    fontWeight: '600',
  },
});
