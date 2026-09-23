import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  ArrowLeft,
  Lock,
  Check,
  ShieldCheck,
  Truck,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Zap,
} from 'lucide-react-native';
import {
  createRazorpayOrder,
  getClientKeyMode,
  getClientRazorpayKey,
  openRazorpayStandardCheckout,
  fetchRazorpayConfig,
} from '../../services/razorpayService';
import {
  GooglePayIcon,
  PhonePeIcon,
  PaytmIcon,
  CredIcon,
  BhimIcon,
  VisaIcon,
  MastercardIcon,
  RupayIcon,
} from './PaymentBrandIcons';

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  amount: number;
  method: string;
  status: 'success' | 'failed';
  isLiveMode?: boolean;
  error?: string;
}

export interface RazorpayModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number; // in Rupees
  orderDescription?: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  selectedLocation?: string;
  onPaymentSuccess: (result: RazorpayPaymentResult) => void;
  onPaymentFailure?: (error: string) => void;
}

export type PaymentCategory = 'upi' | 'card' | 'netbanking' | 'site_pay';
export type UpiApp = 'gpay' | 'phonepe' | 'paytm' | 'cred' | 'bhim' | 'custom';
export type SectionId = PaymentCategory;
export type UpiAppId = UpiApp;

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  visible,
  onClose,
  amount,
  orderDescription = 'Direct Yard Materials Dispatch',
  userEmail = '',
  userPhone = '',
  userName = '',
  selectedLocation = 'Site Location',
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isRealOrder, setIsRealOrder] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'LIVE' | 'TEST'>('LIVE');
  const [paymentLink, setPaymentLink] = useState<string>('');

  const effectivePayableAmount = amount;

  useEffect(() => {
    if (visible) {
      setIsProcessing(false);
      setStatusMessage('');
      setErrorMessage('');
      setPaymentLink('');

      // Fetch active backend configuration
      fetchRazorpayConfig().then((cfg) => {
        if (cfg.key_id) {
          setActiveKey(cfg.key_id);
          setActiveMode(cfg.mode === 'LIVE' ? 'LIVE' : 'TEST');
        }
      });

      // Pre-create verified backend order
      createRazorpayOrder({
        amount: effectivePayableAmount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          location: selectedLocation,
          platform: 'urbanico_app',
          description: orderDescription,
          userName: userName || 'Customer',
          userEmail: userEmail || 'customer@urbanico.in',
          userPhone: userPhone || '',
        },
      })
        .then((res) => {
          if (res?.order_id) {
            setOrderId(res.order_id);
            setIsRealOrder(Boolean(res.isRealRazorpayOrder));
            if (res.key_id) {
              setActiveKey(res.key_id);
            }
            if (res.payment_link || res.short_url) {
              setPaymentLink(res.payment_link || res.short_url || '');
            }
          }
        })
        .catch((err) => {
          console.warn('[RazorpayModal] Pre-order creation notice:', err?.message || err);
        });
    }
  }, [visible, effectivePayableAmount, selectedLocation, orderDescription, userName, userEmail, userPhone]);

  const handlePayViaRazorpay = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setStatusMessage('Connecting to Razorpay Secure Gateway...');

    try {
      await openRazorpayStandardCheckout({
        amount: effectivePayableAmount,
        precreatedOrderId: isRealOrder ? orderId : undefined,
        paymentLink: paymentLink || undefined,
        isRealRazorpayOrder: isRealOrder,
        orderDescription,
        userName: userName || 'Customer',
        userEmail: userEmail || 'customer@urbanico.in',
        userPhone: userPhone || '',
        onSuccess: (paymentResult: any) => {
          setIsProcessing(false);
          setStatusMessage('Payment Verified! Processing order...');
          onPaymentSuccess({
            razorpay_payment_id: paymentResult.razorpay_payment_id,
            razorpay_order_id: paymentResult.razorpay_order_id || orderId,
            razorpay_signature: paymentResult.razorpay_signature,
            amount: effectivePayableAmount,
            method: paymentResult.method || 'Razorpay Gateway',
            isLiveMode: activeMode === 'LIVE',
            status: 'success',
          });
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setErrorMessage(err || 'Payment was not completed.');
          setStatusMessage('');
          if (onPaymentFailure) {
            onPaymentFailure(err);
          }
        },
        onDismiss: () => {
          setIsProcessing(false);
          setStatusMessage('');
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Unable to open Razorpay gateway');
      setStatusMessage('');
      if (onPaymentFailure) {
        onPaymentFailure(err?.message || 'Payment failed');
      }
    }
  };

  const handlePayOnSite = () => {
    setIsProcessing(true);
    setStatusMessage('Booking site dispatch order...');
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess({
        razorpay_payment_id: `POD_${Date.now().toString().slice(-8)}`,
        razorpay_order_id: orderId || `URB_${Date.now().toString().slice(-6)}`,
        razorpay_signature: 'pay_on_site_verified',
        amount: effectivePayableAmount,
        method: 'Pay on Site / COD',
        isLiveMode: activeMode === 'LIVE',
        status: 'success',
      });
    }, 600);
  };

  const currentKey = activeKey || getClientRazorpayKey();
  const maskedKey = currentKey.length > 8 ? `${currentKey.slice(0, 8)}...${currentKey.slice(-4)}` : currentKey;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} color="#0F172A" strokeWidth={2.2} />
            </TouchableOpacity>

            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerTitle}>Checkout</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {orderDescription}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Total Payable Card */}
            <View style={styles.amountCard}>
              <View style={styles.amountCardLeft}>
                <Text style={styles.amountLabel}>TOTAL PAYABLE</Text>
                <Text style={styles.amountValue}>
                  ₹{effectivePayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.amountSubtext} numberOfLines={1}>
                  Site: {selectedLocation}
                </Text>
              </View>

              <View style={styles.liveTagContainer}>
                <View style={[styles.liveDot, { backgroundColor: activeMode === 'LIVE' ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.liveTagText}>
                  {activeMode === 'LIVE' ? 'LIVE GATEWAY' : 'TEST MODE'}
                </Text>
              </View>
            </View>

            {/* Error Message if any */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Status Message if processing */}
            {statusMessage ? (
              <View style={styles.statusBox}>
                <ActivityIndicator size="small" color="#0284C7" />
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            ) : null}

            {/* Supported Payment Channels */}
            <View style={[styles.channelIconsRow, { marginVertical: 12, justifyContent: 'center' }]}>
              <View style={styles.brandIconWrap}><GooglePayIcon size={20} /></View>
              <View style={styles.brandIconWrap}><PhonePeIcon size={20} /></View>
              <View style={styles.brandIconWrap}><PaytmIcon size={20} /></View>
              <View style={styles.brandIconWrap}><CredIcon size={20} /></View>
              <View style={styles.brandIconWrap}><VisaIcon size={20} /></View>
              <View style={styles.brandIconWrap}><MastercardIcon size={20} /></View>
              <View style={styles.brandIconWrap}><RupayIcon size={20} /></View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handlePayViaRazorpay}
              disabled={isProcessing}
              style={[styles.primaryPayBtn, isProcessing && styles.btnDisabled]}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Lock size={18} color="#000000" strokeWidth={2.5} />
              )}
              <Text style={styles.primaryPayBtnText}>
                {isProcessing
                  ? 'Connecting to Gateway...'
                  : `PROCEED TO PAY ₹${effectivePayableAmount.toLocaleString('en-IN')}`}
              </Text>
              {!isProcessing && <ChevronRight size={18} color="#000000" strokeWidth={2.5} />}
            </TouchableOpacity>

            {/* Pay on Site Option */}
            <TouchableOpacity
              onPress={handlePayOnSite}
              disabled={isProcessing}
              style={styles.sitePayBtn}
              activeOpacity={0.7}
            >
              <Truck size={18} color="#334155" strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sitePayTitle}>Pay on Delivery / Site Dispatch</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.3,
  },
  scrollArea: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  amountCardLeft: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FCB026',
    marginTop: 2,
  },
  amountSubtext: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 3,
  },
  liveTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#B91C1C',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#0369A1',
  },
  gatewayInfoCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  gatewayInfoTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  gatewayInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  gatewayInfoDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  channelIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  brandIconWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featurePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featurePillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
  },
  primaryPayBtn: {
    backgroundColor: '#FCB026',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FCB026',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryPayBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  sitePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  sitePayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  sitePaySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  securityFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 10,
  },
  securityFootnoteText: {
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
  },
});
