import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Check,
  Truck,
  Copy,
  MapPin,
  Share2,
  FileText,
  X,
  Clock,
  ShieldCheck,
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
          title: 'Urbanico Direct Order Receipt',
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
      setTimeout(() => setShareToast(false), 2000);
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Top Android Close / Back */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              accessibilityLabel="Close confirmation"
            >
              <X size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Order Confirmation</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Minimalist Android Success Hero */}
            <View style={styles.heroSection}>
              <View style={styles.checkCircle}>
                <Check size={28} color="#FFFFFF" strokeWidth={3} />
              </View>

              <Text style={styles.orderPlacedHeading}>Order Placed Successfully!</Text>
              <Text style={styles.amountDisplay}>
                ₹{paymentResult.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.paymentMethodNotice}>
                Paid via {paymentResult.method}
              </Text>
            </View>

            {/* Receipt Summary Card (Amazon / Flipkart Android Style) */}
            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID</Text>
                <Text style={styles.receiptValueBold}>{paymentResult.razorpay_order_id}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment Reference</Text>
                <TouchableOpacity onPress={handleCopyPaymentId} style={styles.copyRow} activeOpacity={0.7}>
                  <Text style={styles.receiptValueMono}>{paymentResult.razorpay_payment_id}</Text>
                  {copied ? (
                    <Check size={12} color="#059669" strokeWidth={2.5} />
                  ) : (
                    <Copy size={12} color="#6B7280" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Destination</Text>
                <View style={styles.destinationBox}>
                  <MapPin size={13} color="#111827" />
                  <Text style={styles.destinationText} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date & Time</Text>
                <Text style={styles.receiptValue}>{formattedDate}</Text>
              </View>
            </View>

            {/* Dispatch Tracker Card */}
            <View style={styles.dispatchCard}>
              <View style={styles.dispatchHeader}>
                <Clock size={14} color="#059669" />
                <Text style={styles.dispatchHeaderTitle}>DIRECT YARD DISPATCH • 3 HOURS</Text>
              </View>

              <View style={styles.progressTracker}>
                <View style={styles.trackerStep}>
                  <View style={[styles.trackerDot, styles.trackerDotDone]}>
                    <Check size={9} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={styles.trackerLabelDone}>Confirmed</Text>
                </View>

                <View style={[styles.trackerLine, styles.trackerLineDone]} />

                <View style={styles.trackerStep}>
                  <View style={[styles.trackerDot, styles.trackerDotDone]}>
                    <Check size={9} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={styles.trackerLabelDone}>Truck Loading</Text>
                </View>

                <View style={styles.trackerLine} />

                <View style={styles.trackerStep}>
                  <View style={styles.trackerDot} />
                  <Text style={styles.trackerLabel}>Site Delivery</Text>
                </View>
              </View>
            </View>

            {copied && (
              <View style={styles.toastNotice}>
                <Text style={styles.toastNoticeText}>Payment Reference copied to clipboard</Text>
              </View>
            )}

            {shareToast && (
              <View style={styles.toastNotice}>
                <Text style={styles.toastNoticeText}>Receipt details copied to clipboard</Text>
              </View>
            )}

            {/* Bottom Primary Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onTrackOrder();
                }}
                style={styles.primaryActionButton}
                activeOpacity={0.88}
              >
                <Truck size={16} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.primaryActionButtonText}>TRACK ORDER STATUS</Text>
              </TouchableOpacity>

              {onContinueShopping && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onContinueShopping();
                  }}
                  style={styles.secondaryActionButton}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryActionButtonText}>CONTINUE SHOPPING</Text>
                </TouchableOpacity>
              )}

              {/* Utility Links */}
              <View style={styles.utilityLinksRow}>
                {onViewInvoice && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onViewInvoice();
                    }}
                    style={styles.utilityLink}
                    activeOpacity={0.7}
                  >
                    <FileText size={13} color="#6B7280" />
                    <Text style={styles.utilityLinkText}>Tax Invoice</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleShareReceipt}
                  style={styles.utilityLink}
                  activeOpacity={0.7}
                >
                  <Share2 size={13} color="#6B7280" />
                  <Text style={styles.utilityLinkText}>Share Receipt</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  orderPlacedHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  amountDisplay: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  paymentMethodNotice: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 4,
  },

  // Receipt Card
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  receiptValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  receiptValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  receiptValueMono: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#111827',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '65%',
  },
  destinationText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },

  // Dispatch Tracker
  dispatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginTop: 12,
  },
  dispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dispatchHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  progressTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  trackerStep: {
    alignItems: 'center',
  },
  trackerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  trackerDotDone: {
    backgroundColor: '#059669',
  },
  trackerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
    marginBottom: 22,
  },
  trackerLineDone: {
    backgroundColor: '#059669',
  },
  trackerLabel: {
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  trackerLabelDone: {
    fontSize: 10.5,
    color: '#111827',
    fontWeight: '700',
  },

  toastNotice: {
    backgroundColor: '#111827',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  toastNoticeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '500',
  },

  // Actions
  actionsContainer: {
    marginTop: 16,
    gap: 10,
  },
  primaryActionButton: {
    width: '100%',
    height: 46,
    backgroundColor: '#111827',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  secondaryActionButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  utilityLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
  },
  utilityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  utilityLinkText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
