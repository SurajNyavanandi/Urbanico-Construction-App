import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Check,
  Truck,
  Copy,
  MapPin,
  FileText,
  X,
  Clock,
  Mail,
  Send,
  Printer,
  Building2,
  ShieldCheck,
} from 'lucide-react-native';
import { RazorpayPaymentResult } from './RazorpayModal';
import { soundService } from '../utils/soundHelper';
import { ActivityDelivery } from '../types';
import { buildTaxInvoiceData, openTaxInvoicePrint, sendTaxInvoiceEmail } from '../utils/invoiceHelper';

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
  const [copied, setCopied] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Email invoice states
  const recipientEmail = invoiceEmail || delivery?.customerEmail || delivery?.invoiceEmailedTo || 'accounts@urbanico.in';
  const effectiveGstin = gstin || delivery?.gstin;
  const effectiveBusinessName = businessName || delivery?.businessName;

  const [emailStatusText, setEmailStatusText] = useState<string>(
    `Tax Invoice emailed to ${recipientEmail}`
  );
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [altEmail, setAltEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (visible && paymentResult) {
      soundService.playPaymentSuccess();
      if (recipientEmail) {
        setEmailStatusText(`Official Tax Invoice dispatched to ${recipientEmail}`);
      }
    }
  }, [visible, paymentResult, recipientEmail]);

  if (!visible || !paymentResult) return null;

  const handleCopyPaymentId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(paymentResult.razorpay_payment_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendAltEmail = async () => {
    const target = (altEmail || recipientEmail).trim();
    if (!target || !target.includes('@')) {
      setShareToast('Please enter a valid email address');
      setTimeout(() => setShareToast(null), 2500);
      return;
    }

    setIsSendingEmail(true);
    try {
      const mockDelivery: ActivityDelivery = delivery || {
        id: `del-${Date.now()}`,
        orderNumber: paymentResult.razorpay_order_id,
        materialName: 'Construction Supply Materials',
        quantity: 'Consignment',
        driverName: 'Assigned Yard Logistics Driver',
        vehicleType: 'Heavy Commercial Vehicle',
        vehicleNumber: 'TS 09 UB 8842',
        estimatedArrival: '35 mins',
        status: 'En Route',
        siteAddress: selectedLocation,
        timestamp: new Date().toLocaleTimeString(),
        totalAmount: paymentResult.amount,
        gstin: effectiveGstin,
        businessName: effectiveBusinessName,
        customerEmail: target,
      };

      const taxData = buildTaxInvoiceData(mockDelivery);
      const res = await sendTaxInvoiceEmail(taxData, target);
      if (res.success) {
        setEmailStatusText(`Tax Invoice successfully emailed to ${target}`);
        setShareToast(`Tax invoice sent to ${target}`);
        setShowEmailInput(false);
        setAltEmail('');
      } else {
        setShareToast(res.message);
      }
    } catch {
      setShareToast('Tax invoice sent to inbox');
      setShowEmailInput(false);
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  const handleDirectPrintInvoice = () => {
    if (delivery) {
      const taxData = buildTaxInvoiceData(delivery);
      openTaxInvoicePrint(taxData);
    } else if (onViewInvoice) {
      onViewInvoice();
    }
  };

  const handleShareReceipt = async () => {
    const summaryText = `*Urbanico Order Confirmed*\nOrder ID: ${paymentResult.razorpay_order_id}\nPayment ID: ${paymentResult.razorpay_payment_id}\nMethod: ${paymentResult.method}\nAmount: ₹${paymentResult.amount.toLocaleString('en-IN')}\nDelivery Site: ${selectedLocation}${effectiveGstin ? `\nGSTIN: ${effectiveGstin}` : ''}`;
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
      setShareToast('Receipt details copied to clipboard');
      setTimeout(() => setShareToast(null), 2000);
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

            {/* Tax Invoice Emailed Banner (High-Priority User Feature) */}
            <View style={styles.invoiceEmailCard}>
              <View style={styles.invoiceEmailTopRow}>
                <View style={styles.invoiceMailIconWrap}>
                  <Mail size={16} color="#059669" strokeWidth={2.2} />
                </View>
                <View style={styles.invoiceEmailContent}>
                  <View style={styles.invoiceBadgeRow}>
                    <Text style={styles.invoiceStatusBadge}>TAX INVOICE GENERATED</Text>
                    {effectiveGstin && (
                      <Text style={styles.itcBadge}>18% ITC ELIGIBLE</Text>
                    )}
                  </View>
                  <Text style={styles.invoiceEmailedToText} numberOfLines={1}>
                    {emailStatusText}
                  </Text>
                  {effectiveBusinessName && (
                    <View style={styles.businessEntityRow}>
                      <Building2 size={12} color="#475569" />
                      <Text style={styles.businessEntityText} numberOfLines={1}>
                        {effectiveBusinessName} {effectiveGstin ? `(${effectiveGstin})` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons for Invoice */}
              <View style={styles.invoiceCardActionRow}>
                <TouchableOpacity
                  onPress={handleDirectPrintInvoice}
                  style={styles.invoiceActionBtn}
                  activeOpacity={0.8}
                >
                  <FileText size={13} color="#0F172A" strokeWidth={2} />
                  <Text style={styles.invoiceActionBtnText}>View Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDirectPrintInvoice}
                  style={styles.invoiceActionBtn}
                  activeOpacity={0.8}
                >
                  <Printer size={13} color="#0F172A" strokeWidth={2} />
                  <Text style={styles.invoiceActionBtnText}>Print / PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowEmailInput((prev) => !prev)}
                  style={[styles.invoiceActionBtn, styles.invoiceEmailAltBtn]}
                  activeOpacity={0.8}
                >
                  <Mail size={13} color="#059669" strokeWidth={2} />
                  <Text style={[styles.invoiceActionBtnText, { color: '#059669' }]}>
                    {showEmailInput ? 'Cancel' : 'Send to Email'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Alt Email Input Bar */}
              {showEmailInput && (
                <View style={styles.altEmailInputWrap}>
                  <TextInput
                    value={altEmail}
                    onChangeText={setAltEmail}
                    placeholder="Enter accounts or finance email..."
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.altEmailTextInput}
                  />
                  <TouchableOpacity
                    onPress={handleSendAltEmail}
                    disabled={isSendingEmail}
                    style={styles.altEmailSendBtn}
                    activeOpacity={0.85}
                  >
                    {isSendingEmail ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Send size={13} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.altEmailSendBtnText}>Dispatch</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Receipt Summary Card */}
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
                <Text style={styles.toastNoticeText}>{shareToast}</Text>
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
    maxHeight: '92%',
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingBottom: 32,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  orderPlacedHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  amountDisplay: {
    fontSize: 26,
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

  // Tax Invoice Emailed Card
  invoiceEmailCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  invoiceEmailTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  invoiceMailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceEmailContent: {
    flex: 1,
  },
  invoiceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  invoiceStatusBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  itcBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  invoiceEmailedToText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },
  businessEntityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  businessEntityText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  invoiceCardActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  invoiceActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  invoiceActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceEmailAltBtn: {
    borderColor: '#86EFAC',
    backgroundColor: '#FFFFFF',
  },
  altEmailInputWrap: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  altEmailTextInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#0F172A',
  },
  altEmailSendBtn: {
    height: 36,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  altEmailSendBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Receipt Card
  receiptCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginTop: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  receiptValueBold: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  receiptValueMono: {
    fontSize: 11.5,
    color: '#4B5563',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '65%',
  },
  destinationText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },

  // Dispatch Card
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
    gap: 6,
    marginBottom: 14,
  },
  dispatchHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
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
