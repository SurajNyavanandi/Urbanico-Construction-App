import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Check,
  Truck,
  ArrowRight,
  Copy,
  MapPin,
  Share2,
  FileText,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { RazorpayPaymentResult } from './RazorpayModal';
import { soundService } from '../utils/soundHelper';

interface PaymentSuccessModalProps {
  visible: boolean;
  paymentResult: RazorpayPaymentResult | null;
  selectedLocation: string;
  onClose: () => void;
  onTrackOrder: () => void;
  onContinueShopping?: () => void;
  onViewInvoice?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  visible,
  paymentResult,
  selectedLocation,
  onClose,
  onTrackOrder,
  onContinueShopping,
  onViewInvoice,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    if (visible && paymentResult) {
      soundService.playPaymentSuccess();
    }
  }, [visible, paymentResult]);

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 1. Google Pay / PhonePe Inspired Minimalist Success Badge */}
            <View style={styles.successHeader}>
              <View style={styles.outerPulseRing}>
                <View style={styles.innerSuccessBadge}>
                  <Check size={32} color="#FFFFFF" strokeWidth={3.5} />
                </View>
              </View>

              <Text style={styles.successTitle}>Payment Successful</Text>
              <Text style={styles.successMerchant}>Paid to Urbanico Direct Materials Yard</Text>

              <View style={styles.amountHeroRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.heroAmountText}>
                  {paymentResult.amount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.verifiedBadge}>
                <ShieldCheck size={13} color="#059669" strokeWidth={2.2} />
                <Text style={styles.verifiedBadgeText}>Official GST Tax Invoice Generated</Text>
              </View>
            </View>

            {/* 2. Order & Payment Breakdown Card */}
            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Transaction UTR / ID</Text>
                <TouchableOpacity onPress={handleCopyPaymentId} style={styles.copyPill} activeOpacity={0.7}>
                  <Text style={styles.receiptValueMono}>{paymentResult.razorpay_payment_id}</Text>
                  {copied ? (
                    <Check size={12} color="#059669" strokeWidth={2.5} />
                  ) : (
                    <Copy size={12} color="#94A3B8" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order Reference</Text>
                <Text style={styles.receiptValueBold}>{paymentResult.razorpay_order_id}</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment Method</Text>
                <Text style={styles.receiptValue}>{paymentResult.method}</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date & Time</Text>
                <Text style={styles.receiptValue}>{formattedDate}</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Site</Text>
                <View style={styles.siteLocationWrapper}>
                  <MapPin size={12} color="#0066FF" strokeWidth={2} />
                  <Text style={styles.siteLocationText} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Live 3-Hour Site Dispatch Progress Timeline */}
            <View style={styles.dispatchTimelineCard}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineHeaderLeft}>
                  <Clock size={14} color="#0066FF" strokeWidth={2.2} />
                  <Text style={styles.timelineHeaderTitle}>Dispatch Status</Text>
                </View>
                <Text style={styles.timelineHeaderEta}>Est. 3 Hours</Text>
              </View>

              <View style={styles.stepsList}>
                {/* Step 1: Confirmed */}
                <View style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={styles.stepDotCompleted}>
                      <Check size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                    <View style={styles.stepLineActive} />
                  </View>
                  <View style={styles.stepTextCol}>
                    <Text style={styles.stepTitleCompleted}>Order & Advance Confirmed</Text>
                    <Text style={styles.stepSub}>Payment verified by bank gateway</Text>
                  </View>
                </View>

                {/* Step 2: Yard Picking */}
                <View style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={styles.stepDotCurrent}>
                      <View style={styles.stepDotCurrentInner} />
                    </View>
                    <View style={styles.stepLineInactive} />
                  </View>
                  <View style={styles.stepTextCol}>
                    <Text style={styles.stepTitleCurrent}>Yard Picking & Weighbridge Test</Text>
                    <Text style={styles.stepSub}>Hydraulic crane loader assigned</Text>
                  </View>
                </View>

                {/* Step 3: Truck Dispatch */}
                <View style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={styles.stepDotPending} />
                  </View>
                  <View style={styles.stepTextCol}>
                    <Text style={styles.stepTitlePending}>Truck Dispatch & Site Arrival</Text>
                    <Text style={styles.stepSub}>Driver OTP will be shared upon gate exit</Text>
                  </View>
                </View>
              </View>
            </View>

            {copied && (
              <View style={styles.toastBanner}>
                <Text style={styles.toastBannerText}>Transaction ID copied to clipboard</Text>
              </View>
            )}

            {shareToast && (
              <View style={styles.toastBanner}>
                <Text style={styles.toastBannerText}>Order receipt copied to clipboard</Text>
              </View>
            )}

            {/* 4. Action Buttons */}
            <View style={styles.actionsSection}>
              {/* Primary: Track Order */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onTrackOrder();
                }}
                style={styles.primaryBtn}
                activeOpacity={0.88}
              >
                <Truck size={17} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.primaryBtnText}>Track Live Dispatch</Text>
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Continue Shopping Button */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  if (onContinueShopping) {
                    onContinueShopping();
                  }
                }}
                style={styles.continueShoppingBtn}
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#0F172A" strokeWidth={2} />
                <Text style={styles.continueShoppingBtnText}>Continue Shopping</Text>
              </TouchableOpacity>

              {/* Secondary Buttons Row */}
              <View style={styles.secondaryBtnRow}>
                {onViewInvoice && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onViewInvoice();
                    }}
                    style={styles.secondaryBtn}
                    activeOpacity={0.8}
                  >
                    <FileText size={15} color="#334155" strokeWidth={2} />
                    <Text style={styles.secondaryBtnText}>Tax Invoice</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleShareReceipt}
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                >
                  <Share2 size={15} color="#334155" strokeWidth={2} />
                  <Text style={styles.secondaryBtnText}>Share Receipt</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 16,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: 8,
  },
  outerPulseRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  innerSuccessBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  successMerchant: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  amountHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 10,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroAmountText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 8,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  receiptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  receiptValueBold: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  receiptValueMono: {
    fontSize: 11.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#334155',
    fontWeight: '600',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  siteLocationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
  },
  siteLocationText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  dispatchTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineHeaderEta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepsList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 18,
  },
  stepDotCompleted: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepDotCurrentInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066FF',
  },
  stepDotPending: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
  },
  stepLineActive: {
    width: 2,
    height: 24,
    backgroundColor: '#16A34A',
  },
  stepLineInactive: {
    width: 2,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  stepTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  stepTitleCompleted: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepTitleCurrent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
  },
  stepTitlePending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  toastBanner: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  actionsSection: {
    gap: 8,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: '#0066FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  continueShoppingBtn: {
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  continueShoppingBtnText: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
