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
  Check,
  ShieldCheck,
  Zap,
  FlaskConical,
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
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(paymentResult.razorpay_payment_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareReceipt = async () => {
    const summaryText = `*Urbanico Direct Order Confirmed*\nOrder ID: ${paymentResult.razorpay_order_id}\nPayment ID: ${paymentResult.razorpay_payment_id}\nMethod: ${paymentResult.method}\nAmount: ₹${paymentResult.amount.toLocaleString('en-IN')}\nDelivery Site: ${selectedLocation}\nHelpline: 1800-123-9876`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Urbanico Order Receipt',
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

  const isLive = paymentResult.isLiveMode ?? true;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetCard}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Top Minimalist Apple/Nike Icon Box */}
            <View style={styles.iconBox}>
              <CheckCircle2 size={36} color="#0071E3" strokeWidth={2.4} />
            </View>

            {/* Mode Badge (Live vs Test) */}
            <View style={[styles.modePill, isLive ? styles.modePillLive : styles.modePillTest]}>
              {isLive ? (
                <Zap size={11} color="#0071E3" strokeWidth={2.5} />
              ) : (
                <FlaskConical size={11} color="#707072" strokeWidth={2.2} />
              )}
              <Text style={[styles.modePillText, isLive ? styles.modePillTextLive : styles.modePillTextTest]}>
                {isLive ? 'LIVE TRANSACTION SETTLED' : 'RAZORPAY TEST SIMULATION'}
              </Text>
            </View>

            {/* Success Heading */}
            <Text style={styles.successTitle}>Payment Verified</Text>
            <Text style={styles.successSub}>
              ₹{paymentResult.amount.toLocaleString('en-IN')} successfully authorized via {paymentResult.method}
            </Text>

            {/* Transaction Receipt Card */}
            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment ID</Text>
                <TouchableOpacity onPress={handleCopyPaymentId} style={styles.copyRow} activeOpacity={0.7}>
                  <Text style={styles.receiptValueMono}>{paymentResult.razorpay_payment_id}</Text>
                  {copied ? (
                    <Check size={13} color="#0071E3" strokeWidth={2.5} />
                  ) : (
                    <Copy size={13} color="#86868B" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID</Text>
                <Text style={styles.receiptValue}>{paymentResult.razorpay_order_id}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Timestamp</Text>
                <Text style={styles.receiptValue}>{formattedDate}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment Method</Text>
                <Text style={styles.receiptValue}>{paymentResult.method}</Text>
              </View>

              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.receiptLabel}>Delivery Site</Text>
                <View style={styles.locRow}>
                  <MapPin size={13} color="#0071E3" strokeWidth={2.2} />
                  <Text style={styles.receiptValueLoc} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>

              {copied && (
                <View style={styles.copiedToast}>
                  <Text style={styles.copiedText}>Payment reference copied to clipboard</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsGroup}>
              {/* Primary Nike-Style Track Order Button */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onTrackOrder();
                }}
                style={styles.nikePrimaryBtn}
                activeOpacity={0.85}
              >
                <Truck size={17} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.nikePrimaryBtnText}>Track Live Dispatch</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* View Invoice */}
              {onViewInvoice && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onViewInvoice();
                  }}
                  style={styles.nikeSecondaryBtn}
                  activeOpacity={0.8}
                >
                  <Receipt size={16} color="#1D1D1F" strokeWidth={2} />
                  <Text style={styles.nikeSecondaryBtnText}>View Digital Tax Invoice</Text>
                </TouchableOpacity>
              )}

              {/* Share Order Receipt */}
              <TouchableOpacity
                onPress={handleShareReceipt}
                style={styles.nikeSecondaryBtn}
                activeOpacity={0.8}
              >
                <Share2 size={16} color="#1D1D1F" strokeWidth={2} />
                <Text style={styles.nikeSecondaryBtnText}>Share Order Confirmation</Text>
              </TouchableOpacity>

              {shareToast && (
                <View style={styles.copiedToast}>
                  <Text style={styles.copiedText}>Receipt summary copied to clipboard</Text>
                </View>
              )}

              <TouchableOpacity onPress={onClose} style={styles.dismissBtn} activeOpacity={0.7}>
                <Text style={styles.dismissBtnText}>Return to Catalog</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 14,
    maxHeight: '92%',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D0E6FF',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
  },
  modePillLive: {
    backgroundColor: '#F0F7FF',
    borderColor: '#D0E6FF',
  },
  modePillTest: {
    backgroundColor: '#F5F5F7',
    borderColor: '#E5E5E7',
  },
  modePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modePillTextLive: {
    color: '#0071E3',
  },
  modePillTextTest: {
    color: '#707072',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  successSub: {
    fontSize: 13,
    color: '#86868B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    padding: 14,
    marginBottom: 18,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#86868B',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12.5,
    color: '#1D1D1F',
    fontWeight: '600',
  },
  receiptValueMono: {
    fontSize: 12,
    color: '#1D1D1F',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '60%',
  },
  receiptValueLoc: {
    fontSize: 12,
    color: '#1D1D1F',
    fontWeight: '600',
  },
  copiedToast: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  copiedText: {
    fontSize: 10.5,
    color: '#0071E3',
    fontWeight: '600',
  },
  actionsGroup: {
    width: '100%',
    gap: 8,
  },
  nikePrimaryBtn: {
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  nikePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  nikeSecondaryBtn: {
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  nikeSecondaryBtnText: {
    color: '#1D1D1F',
    fontSize: 13,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#86868B',
    fontSize: 12.5,
    fontWeight: '500',
  },
});
