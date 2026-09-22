import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Check,
  Truck,
  Copy,
  MapPin,
  FileText,
  X,
  Clock,
  MailCheck,
  Building2,
} from 'lucide-react-native';
import { RazorpayPaymentResult } from './RazorpayModal';
import { soundService } from '../utils/soundHelper';
import { ActivityDelivery } from '../types';
import { buildTaxInvoiceData, openTaxInvoicePrint } from '../utils/invoiceHelper';
import { useClipboard, formatINR } from '../hooks';

interface PaymentSuccessModalProps {
  visible: boolean;
  paymentResult: RazorpayPaymentResult | null;
  selectedLocation: string;
  onClose: () => void;
  onTrackOrder: () => void;
  onContinueShopping?: () => void;
  onViewInvoice?: () => void;
  delivery?: ActivityDelivery | null;
  invoiceEmail?: string;
  businessName?: string;
  gstin?: string;
  user?: any;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  visible,
  paymentResult,
  selectedLocation,
  onClose,
  onTrackOrder,
  onContinueShopping,
  onViewInvoice,
  delivery,
  invoiceEmail,
  businessName,
  gstin,
}) => {
  const { copy, copied } = useClipboard({ timeout: 2000 });

  const recipientEmail =
    invoiceEmail ||
    delivery?.customerEmail ||
    delivery?.invoiceEmailedTo ||
    'your registered email';
  const effectiveGstin = gstin || delivery?.gstin;
  const effectiveBusinessName = businessName || delivery?.businessName;

  useEffect(() => {
    if (visible && paymentResult) {
      soundService.playPaymentSuccess();
    }
  }, [visible, paymentResult]);

  if (!visible || !paymentResult) return null;

  const handleCopyPaymentId = () => {
    copy(paymentResult.razorpay_payment_id);
  };

  const handleDownloadInvoice = () => {
    if (delivery) {
      const taxData = buildTaxInvoiceData(delivery);
      openTaxInvoicePrint(taxData);
    } else if (onViewInvoice) {
      onViewInvoice();
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
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              accessibilityLabel="Close"
            >
              <X size={18} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Order Placed</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Minimalist Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.checkCircle}>
                <Check size={28} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={styles.orderPlacedHeading}>Order Placed Successfully!</Text>
              <Text style={styles.amountDisplay}>
                {formatINR(paymentResult.amount)}
              </Text>
              <Text style={styles.paymentMethodNotice}>
                Paid via {paymentResult.method}
              </Text>
            </View>

            {/* Clean, Simple Email Confirmation Notice */}
            <View style={styles.emailNoticeBox}>
              <MailCheck size={16} color="#059669" strokeWidth={2} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.emailNoticeText}>
                  Order confirmation and tax invoice have been automatically sent to{' '}
                  <Text style={styles.emailNoticeBold}>{recipientEmail}</Text>.
                </Text>
                {Boolean(effectiveBusinessName) && (
                  <View style={styles.businessEntityRow}>
                    <Building2 size={12} color="#64748B" />
                    <Text style={styles.businessEntityText} numberOfLines={1}>
                      Billed to: {effectiveBusinessName} {effectiveGstin ? `(${effectiveGstin})` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Order Details Card */}
            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID</Text>
                <Text style={styles.receiptValueBold}>{paymentResult.razorpay_order_id}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment ID</Text>
                <TouchableOpacity onPress={handleCopyPaymentId} style={styles.copyRow} activeOpacity={0.7}>
                  <Text style={styles.receiptValueMono}>{paymentResult.razorpay_payment_id}</Text>
                  {copied ? (
                    <Check size={12} color="#059669" strokeWidth={2.5} />
                  ) : (
                    <Copy size={12} color="#94A3B8" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Address</Text>
                <View style={styles.destinationBox}>
                  <MapPin size={13} color="#111827" />
                  <Text style={styles.destinationText} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order Placed On</Text>
                <Text style={styles.receiptValue}>{formattedDate}</Text>
              </View>
            </View>

            {/* Estimated Delivery Banner */}
            <View style={styles.dispatchCard}>
              <Clock size={15} color="#059669" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.dispatchTitle}>Estimated Dispatch</Text>
                <Text style={styles.dispatchSub}>Delivery within 3 hours</Text>
              </View>
            </View>

            {/* Action Buttons */}
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
                <Text style={styles.primaryActionButtonText}>Track Order</Text>
              </TouchableOpacity>

              {Boolean(onContinueShopping) && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onContinueShopping();
                  }}
                  style={styles.secondaryActionButton}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryActionButtonText}>Continue Shopping</Text>
                </TouchableOpacity>
              )}

              {/* Single Clean Download Invoice Button */}
              <TouchableOpacity
                onPress={handleDownloadInvoice}
                style={styles.downloadInvoiceBtn}
                activeOpacity={0.7}
              >
                <FileText size={14} color="#475569" />
                <Text style={styles.downloadInvoiceBtnText}>Download Invoice</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  orderPlacedHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  paymentMethodNotice: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },

  // Clean Email Notice Box
  emailNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  emailNoticeText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  emailNoticeBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  businessEntityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  businessEntityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Receipt Card
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
    fontSize: 12,
    color: '#0F172A',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '65%',
  },
  destinationText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // Dispatch Banner
  dispatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  dispatchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  dispatchSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },

  // Actions
  actionsContainer: {
    marginTop: 18,
    gap: 10,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 13,
  },
  primaryActionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  downloadInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  downloadInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textDecorationLine: 'underline',
  },
});
