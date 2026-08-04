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
  ShieldCheck,
  Copy,
  Building2,
  MapPin,
  Sparkles,
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

  if (!visible || !paymentResult) return null;

  const handleCopyPaymentId = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            {/* Top Celebration Icon */}
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircleInner}>
                <CheckCircle2 size={44} color="#10B981" strokeWidth={2.5} />
              </View>
            </View>

            {/* Success Heading */}
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSub}>
              Your order is verified via Razorpay & dispatched to nearest manufacturer yard.
            </Text>

            {/* Amount Badge */}
            <View style={styles.amountBanner}>
              <Text style={styles.amountLabel}>AMOUNT PAID</Text>
              <Text style={styles.amountValue}>₹{paymentResult.amount.toLocaleString('en-IN')}</Text>
              <View style={styles.testTag}>
                <Sparkles size={10} color="#D97706" />
                <Text style={styles.testTagText}>RAZORPAY TEST GATEWAY</Text>
              </View>
            </View>

            {/* Transaction Receipts Box */}
            <View style={styles.receiptCard}>
              <Text style={styles.receiptHeaderTitle}>TRANSACTION RECEIPT</Text>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Razorpay Payment ID</Text>
                <TouchableOpacity onPress={handleCopyPaymentId} style={styles.copyRow}>
                  <Text style={styles.receiptValueMono}>{paymentResult.razorpay_payment_id}</Text>
                  <Copy size={12} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID</Text>
                <Text style={styles.receiptValue}>{paymentResult.razorpay_order_id}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment Mode</Text>
                <Text style={styles.receiptValue}>
                  {paymentResult.method} (Razorpay Test Mode)
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date & Time</Text>
                <Text style={styles.receiptValue}>{formattedDate}</Text>
              </View>

              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.receiptLabel}>Delivery Location</Text>
                <View style={styles.locRow}>
                  <MapPin size={12} color="#EF4444" />
                  <Text style={styles.receiptValueLoc} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>

              {copied && (
                <View style={styles.copiedToast}>
                  <Text style={styles.copiedText}>Payment ID copied to clipboard!</Text>
                </View>
              )}
            </View>

            {/* Dispatch ETA banner */}
            <View style={styles.etaBanner}>
              <Truck size={20} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.etaTitle}>Scheduled Yard Dispatch</Text>
                <Text style={styles.etaSub}>Estimated arrival: Within 2 Hours (GPS Tracked)</Text>
              </View>
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
                <Truck size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Track Order in Real-Time</Text>
                <ArrowRight size={16} color="#FFFFFF" />
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
                  <Receipt size={16} color="#0F172A" />
                  <Text style={styles.secondaryBtnText}>View GST Tax Invoice</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onClose} style={styles.tertiaryBtn} activeOpacity={0.7}>
                <Text style={styles.tertiaryBtnText}>Back to Catalog</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Assurance */}
            <View style={styles.footerRow}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.footerText}>Verified Weighbridge Slips Provided Upon Unloading</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 12,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircleOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  amountBanner: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  testTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  receiptHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  receiptValueMono: {
    fontSize: 12,
    color: '#2563EB',
    fontFamily: 'monospace',
    fontWeight: '700',
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
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  copiedToast: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  copiedText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  etaBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  etaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  etaSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  actionsGroup: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  tertiaryBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  tertiaryBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
});
