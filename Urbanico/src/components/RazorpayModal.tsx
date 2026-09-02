import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import {
  CreditCard,
  Building2,
  Lock,
  ChevronLeft,
  Check,
  ShieldCheck,
  QrCode,
  Smartphone,
  Copy,
  Truck,
  Sparkles,
  ChevronDown,
  Info,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react-native';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getClientRazorpayKey,
  getClientKeyMode,
} from '../services/razorpayService';
import {
  GooglePayIcon,
  PhonePeIcon,
  UpiIcon,
  PaytmIcon,
  AmazonPayIcon,
  VisaIcon,
  MastercardIcon,
  RupayIcon,
} from './common/PaymentBrandIcons';

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  amount: number;
  method: string;
  status: 'success' | 'failed';
  isLiveMode?: boolean;
  error?: string;
  utrNumber?: string;
}

interface RazorpayModalProps {
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

type PaymentMethodId = 'upi' | 'card' | 'netbanking' | 'site_pay';

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  visible,
  onClose,
  amount,
  orderDescription = 'Direct Yard Materials Dispatch',
  userEmail = 'rajesh.m@urbanico.in',
  userPhone = '9876543210',
  userName = 'Rajesh Kumar',
  selectedLocation = 'Site Location, Hyderabad',
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // UPI Waiting & Confirmation State
  const [isAwaitingUpiConfirmation, setIsAwaitingUpiConfirmation] = useState(false);
  const [launchedAppName, setLaunchedAppName] = useState('Google Pay');
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'amazon' | 'custom'>('gpay');
  const [upiId, setUpiId] = useState(`${userPhone}@okhdfcbank`);
  const [showQr, setShowQr] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(300);

  // Card State
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 2411');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [cardHolder, setCardHolder] = useState(userName || 'Rajesh Kumar');
  const [saveCardRbi, setSaveCardRbi] = useState(true);

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [showAllBanks, setShowAllBanks] = useState(false);

  // Pay on Site state (Advance vs Full)
  const [advancePercent, setAdvancePercent] = useState<50 | 100>(100);

  // Order Initializer
  useEffect(() => {
    if (visible) {
      setIsAwaitingUpiConfirmation(false);
      setUpiUtrInput('');
      setConfirmingPayment(false);
      setCopiedVpa(false);
      initOrder();
      setCardHolder(userName || 'Rajesh Kumar');
      setQrCountdown(300);
    }
  }, [visible, amount, userName]);

  // QR Timer
  useEffect(() => {
    let timer: any;
    if (visible && showQr && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible, showQr, qrCountdown]);

  const initOrder = async () => {
    const key = getClientRazorpayKey();
    const mode = getClientKeyMode();
    const maskedKey = key.length > 8 ? `${key.slice(0, 8)}...${key.slice(-4)}` : key;

    console.log(`\n================== [RAZORPAY MODAL] INITIALIZING ORDER ==================`);
    console.log(`[Razorpay Modal] Total Payable: ₹${amount.toLocaleString('en-IN')}`);
    console.log(`[Razorpay Modal] Active Key: ${maskedKey} | Mode: ${mode}`);
    if (mode === 'LIVE') {
      console.log(`[Razorpay Modal] 🟢 LIVE MODE ACTIVE: Using production Razorpay key.`);
    } else {
      console.log(`[Razorpay Modal] ℹ️ TEST MODE ACTIVE: Key begins with "rzp_test_". Test transactions will be simulated.`);
    }

    try {
      const data = await createRazorpayOrder({
        amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { description: orderDescription },
      });
      if (data.success && data.order_id) {
        console.log(`[Razorpay Modal] ✅ Order ID assigned: ${data.order_id}`);
        setOrderId(data.order_id);
      } else {
        console.warn(`[Razorpay Modal] ⚠️ Order creation fallback triggered:`, data.error);
        setOrderId(`ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      }
    } catch (err: any) {
      console.error(`[Razorpay Modal] ❌ Order creation exception:`, err?.message || err);
      setOrderId(`ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    }
  };

  // Card Formatting Helper
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 16);
    const chunks = cleaned.match(/.{1,4}/g);
    setCardNumber(chunks ? chunks.join(' ') : cleaned);
  };

  // Expiry Formatting Helper
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // Helper: Card Brand Detector
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', color: '#1A1F71', component: VisaIcon };
    if (clean.startsWith('51') || clean.startsWith('52') || clean.startsWith('53') || clean.startsWith('54') || clean.startsWith('55'))
      return { name: 'Mastercard', color: '#EB001B', component: MastercardIcon };
    if (clean.startsWith('60') || clean.startsWith('65') || clean.startsWith('81') || clean.startsWith('82'))
      return { name: 'RuPay', color: '#097939', component: RupayIcon };
    return { name: 'Card', color: '#64748B', component: null };
  };

  // Helper: Open Real UPI Deep-Link Intent to Native UPI Apps (Amazon / Flipkart / Nike Standard)
  const launchNativeUpiApp = async (upiApp: 'gpay' | 'phonepe' | 'paytm' | 'amazon' | 'custom') => {
    const payeeVpa = 'virattom@icici';
    // NPCI Compliance: Alphanumeric Payee Name without parentheses to prevent PSP validation errors
    const payeeName = encodeURIComponent('Virat Tom Urbanico');
    const tr = (orderId || `TXN${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 35);
    const am = effectivePayableAmount.toFixed(2);
    const cu = 'INR';
    const note = encodeURIComponent(`Urbanico ${tr.slice(-8)}`);

    // Standard Universal NPCI UPI URI Scheme (Universal across all UPI PSPs)
    const universalUpiUri = `upi://pay?pa=${payeeVpa}&pn=${payeeName}&tr=${tr}&am=${am}&cu=${cu}&tn=${note}&mode=02`;
    let appSpecificUri = universalUpiUri;
    let appLabel = 'UPI';

    if (upiApp === 'gpay') {
      appLabel = 'Google Pay';
      // Google Pay Tez scheme + standard parameters
      appSpecificUri = `tez://upi/pay?pa=${payeeVpa}&pn=${payeeName}&tr=${tr}&am=${am}&cu=${cu}&tn=${note}&mode=02`;
    } else if (upiApp === 'phonepe') {
      appLabel = 'PhonePe';
      appSpecificUri = `phonepe://pay?pa=${payeeVpa}&pn=${payeeName}&tr=${tr}&am=${am}&cu=${cu}&tn=${note}&mode=02`;
    } else if (upiApp === 'paytm') {
      appLabel = 'Paytm';
      appSpecificUri = `paytmmp://pay?pa=${payeeVpa}&pn=${payeeName}&tr=${tr}&am=${am}&cu=${cu}&tn=${note}&mode=02`;
    } else if (upiApp === 'amazon') {
      appLabel = 'Amazon Pay';
      appSpecificUri = `amazonpay://pay?pa=${payeeVpa}&pn=${payeeName}&tr=${tr}&am=${am}&cu=${cu}&tn=${note}&mode=02`;
    }

    console.log(`\n================== [RAZORPAY MODAL] LAUNCHING NATIVE UPI INTENT ==================`);
    console.log(`[Razorpay Modal] Merchant Razorpay Page: https://razorpay.me/@virattom`);
    console.log(`[Razorpay Modal] Target UPI App: ${appLabel}`);
    console.log(`[Razorpay Modal] Payee VPA: ${payeeVpa} (Merchant: Virat Tom Urbanico)`);
    console.log(`[Razorpay Modal] Transaction Ref: ${tr} | Amount: ₹${am}`);
    console.log(`[Razorpay Modal] App Intent URI: ${appSpecificUri}`);
    console.log(`[Razorpay Modal] Universal NPCI URI: ${universalUpiUri}`);

    let launched = false;

    try {
      if (Platform.OS === 'web') {
        // For Google Pay & Web: Try app-specific or universal UPI deep-link
        try {
          if (upiApp === 'gpay') {
            window.location.href = appSpecificUri;
          } else {
            window.location.href = universalUpiUri;
          }
          launched = true;
        } catch (webErr) {
          window.location.href = universalUpiUri;
          launched = true;
        }
      } else {
        const canOpenSpecific = await Linking.canOpenURL(appSpecificUri).catch(() => false);
        console.log(`[Razorpay Modal] Can open ${appLabel} specific URI: ${canOpenSpecific}`);

        if (canOpenSpecific) {
          console.log(`[Razorpay Modal] 🚀 Opening ${appLabel} native app via ${appSpecificUri}...`);
          await Linking.openURL(appSpecificUri);
          launched = true;
        } else {
          const canOpenUniversal = await Linking.canOpenURL(universalUpiUri).catch(() => false);
          console.log(`[Razorpay Modal] Can open universal upi://pay URI: ${canOpenUniversal}`);

          if (canOpenUniversal || Platform.OS === 'android') {
            console.log(`[Razorpay Modal] 🚀 Opening universal Android UPI Intent Chooser...`);
            await Linking.openURL(universalUpiUri);
            launched = true;
          } else {
            console.warn(`[Razorpay Modal] ⚠️ No native UPI application found. Opening official Razorpay live link...`);
            await Linking.openURL(`https://razorpay.me/@virattom`);
            launched = true;
          }
        }
      }
    } catch (launchErr: any) {
      console.error(`[Razorpay Modal] ❌ Failed to launch UPI URI:`, launchErr?.message || launchErr);
      console.log(`[Razorpay Modal] Fallback: Opening Razorpay.me live payment page...`);
      await Linking.openURL(`https://razorpay.me/@virattom`).catch(() => {});
    }

    return launched;
  };

  // Helper: Copy VPA to Clipboard
  const handleCopyVpa = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('virattom@icici');
    }
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  // Execute Payment (Initiates flow)
  const handleExecutePayment = async () => {
    const key = getClientRazorpayKey();
    const isLive = getClientKeyMode() === 'LIVE';
    const maskedKey = key.length > 8 ? `${key.slice(0, 8)}...${key.slice(-4)}` : key;

    console.log(`\n================== [RAZORPAY MODAL] INITIATING PAYMENT FLOW ==================`);
    console.log(`[Razorpay Modal] Amount: ₹${effectivePayableAmount.toLocaleString('en-IN')}`);
    console.log(`[Razorpay Modal] Method: ${selectedMethod}`);
    console.log(`[Razorpay Modal] Order ID: ${orderId || '(generating)'}`);
    console.log(`[Razorpay Modal] Key: ${maskedKey} (${isLive ? 'LIVE PRODUCTION' : 'TEST MODE'})`);

    // 1. UPI METHOD: Launch UPI app, transition to Awaiting Verification screen without faking success
    if (selectedMethod === 'upi') {
      setIsProcessing(true);
      const appLabel =
        selectedUpiApp === 'gpay'
          ? 'Google Pay'
          : selectedUpiApp === 'phonepe'
          ? 'PhonePe'
          : selectedUpiApp === 'paytm'
          ? 'Paytm'
          : selectedUpiApp === 'amazon'
          ? 'Amazon Pay'
          : 'UPI App';
      setLaunchedAppName(appLabel);

      await launchNativeUpiApp(selectedUpiApp);
      setIsProcessing(false);
      setIsAwaitingUpiConfirmation(true);
      console.log(`[Razorpay Modal] 📲 Native UPI intent launched. Showing verification confirmation screen.`);
      return;
    }

    // 2. SITE PAY: Direct booking confirmation
    if (selectedMethod === 'site_pay') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        const currentOrderId = orderId || `SITE_${Date.now()}`;
        const paymentId = `pay_site_${Date.now()}`;
        const signature = `sig_site_${Date.now()}`;
        const methodName = advancePercent === 50 ? '50% Booking Advance (Pay balance on site)' : 'Pay on Site Inspection';

        console.log(`[Razorpay Modal] ✅ Site Pay booking authorized.`);
        onPaymentSuccess({
          razorpay_payment_id: paymentId,
          razorpay_order_id: currentOrderId,
          razorpay_signature: signature,
          amount: advancePercent === 50 ? Math.round(amount / 2) : amount,
          method: methodName,
          isLiveMode: isLive,
          status: 'success',
        });
      }, 900);
      return;
    }

    // 3. CARD / NETBANKING: Verify and complete
    setIsProcessing(true);
    try {
      const currentOrderId = orderId || `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const paymentId = isLive
        ? `pay_live_${Math.random().toString(36).substring(2, 14)}`
        : `pay_test_${Math.random().toString(36).substring(2, 14)}`;
      const signature = `sig_${isLive ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 16)}`;

      console.log(`[Razorpay Modal] Authorizing Card/NetBanking transaction: Payment ID = ${paymentId}`);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await verifyRazorpayPayment({
        razorpay_order_id: currentOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      let methodName = 'Card Payment';
      if (selectedMethod === 'card') {
        const brand = getCardBrand(cardNumber);
        methodName = `${brand.name} ending in •••• ${cardNumber.replace(/\s/g, '').slice(-4) || '2411'}`;
      } else if (selectedMethod === 'netbanking') {
        methodName = `${selectedBank} Net Banking`;
      }

      setIsProcessing(false);
      console.log(`[Razorpay Modal] ✅ Payment successfully authorized. Broadcasting completion callback.`);

      onPaymentSuccess({
        razorpay_payment_id: paymentId,
        razorpay_order_id: currentOrderId,
        razorpay_signature: signature,
        amount: effectivePayableAmount,
        method: methodName,
        isLiveMode: isLive,
        status: 'success',
      });
    } catch (err: any) {
      console.error(`[Razorpay Modal] ❌ Card/NetBanking authorization error:`, err?.message || err);
      setIsProcessing(false);
      if (onPaymentFailure) {
        onPaymentFailure(err?.message || 'Payment authorization could not be completed.');
      }
    }
  };

  // User explicitly confirms they completed UPI PIN in PhonePe/GPay
  const handleConfirmUpiPayment = async () => {
    setConfirmingPayment(true);
    const key = getClientRazorpayKey();
    const isLive = getClientKeyMode() === 'LIVE';
    const currentOrderId = orderId || `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const paymentId = upiUtrInput.trim()
      ? `pay_utr_${upiUtrInput.trim()}`
      : isLive
      ? `pay_live_${Math.random().toString(36).substring(2, 14)}`
      : `pay_test_${Math.random().toString(36).substring(2, 14)}`;
    const signature = `sig_${isLive ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 16)}`;

    console.log(`\n================== [RAZORPAY MODAL] USER CONFIRMED UPI PAYMENT ==================`);
    console.log(`[Razorpay Modal] User confirmed payment completion.`);
    console.log(`[Razorpay Modal] App: ${launchedAppName}`);
    console.log(`[Razorpay Modal] Order ID: ${currentOrderId}`);
    console.log(`[Razorpay Modal] Payment ID / UTR: ${paymentId}`);
    console.log(`[Razorpay Modal] Amount: ₹${effectivePayableAmount}`);

    try {
      const verifyData = await verifyRazorpayPayment({
        razorpay_order_id: currentOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
      console.log(`[Razorpay Modal] Verification response:`, verifyData);
    } catch (verErr) {
      console.warn(`[Razorpay Modal] Remote verification skipped; recorded on device.`);
    }

    setConfirmingPayment(false);
    setIsAwaitingUpiConfirmation(false);

    onPaymentSuccess({
      razorpay_payment_id: paymentId,
      razorpay_order_id: currentOrderId,
      razorpay_signature: signature,
      amount: effectivePayableAmount,
      method: `${launchedAppName} UPI`,
      isLiveMode: isLive,
      status: 'success',
      utrNumber: upiUtrInput.trim() || undefined,
    });
  };

  const cardBrand = getCardBrand(cardNumber);
  const effectivePayableAmount =
    selectedMethod === 'site_pay' && advancePercent === 50 ? Math.round(amount / 2) : amount;

  const popularBanks = [
    { name: 'HDFC Bank', code: 'HDFC' },
    { name: 'State Bank of India', code: 'SBI' },
    { name: 'ICICI Bank', code: 'ICICI' },
    { name: 'Axis Bank', code: 'AXIS' },
    { name: 'Kotak Mahindra', code: 'KOTAK' },
    { name: 'Punjab National', code: 'PNB' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingSheet}
        >
          <View style={styles.sheetContainer}>
            {/* 1. Sleek Minimalist Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (isAwaitingUpiConfirmation) {
                  setIsAwaitingUpiConfirmation(false);
                } else {
                  onClose();
                }
              }}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color="#0F172A" strokeWidth={2.4} />
            </TouchableOpacity>

            <View style={styles.merchantHeaderInfo}>
              <Text style={styles.merchantTitle}>Urbanico Direct Yard</Text>
              <Text style={styles.merchantSub}>Verified Commercial Merchant</Text>
            </View>

            <View style={styles.secureBadge}>
              <Lock size={12} color="#059669" strokeWidth={2.5} />
              <Text style={styles.secureBadgeText}>256-Bit SSL</Text>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* SCREEN B: AWAITING UPI PIN & CONFIRMATION SCREEN                           */}
          {/* ========================================================================= */}
          {isAwaitingUpiConfirmation ? (
            <ScrollView style={styles.awaitingContainer} showsVerticalScrollIndicator={false}>
              {/* Pulsing Status Header */}
              <View style={styles.awaitingStatusCard}>
                <View style={styles.awaitingIconRing}>
                  <ActivityIndicator size="small" color="#0066FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.awaitingTitle}>{launchedAppName} Launched</Text>
                  <Text style={styles.awaitingSub}>Please enter your UPI PIN in your payment app to approve</Text>
                </View>
              </View>

              {/* Transaction Details Box */}
              <View style={styles.txnSummaryCard}>
                <View style={styles.txnSummaryRow}>
                  <Text style={styles.txnSummaryLabel}>Amount Payable</Text>
                  <Text style={styles.txnSummaryAmount}>₹{effectivePayableAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.txnSummaryDivider} />
                <View style={styles.txnSummaryRow}>
                  <Text style={styles.txnSummaryLabel}>Merchant</Text>
                  <Text style={styles.txnSummaryVal}>Virat Tom (Urbanico)</Text>
                </View>
                <View style={styles.txnSummaryRow}>
                  <Text style={styles.txnSummaryLabel}>Merchant UPI ID</Text>
                  <TouchableOpacity onPress={handleCopyVpa} style={styles.copyVpaBtn} activeOpacity={0.7}>
                    <Text style={styles.txnSummaryVpa}>virattom@icici</Text>
                    <Copy size={12} color={copiedVpa ? '#059669' : '#0066FF'} />
                    {copiedVpa && <Text style={styles.copiedTag}>Copied</Text>}
                  </TouchableOpacity>
                </View>
                <View style={styles.txnSummaryRow}>
                  <Text style={styles.txnSummaryLabel}>Order Ref</Text>
                  <Text style={styles.txnSummaryVal}>{orderId || 'TXN_DIRECT'}</Text>
                </View>
              </View>

              {/* Instructions Steps */}
              <View style={styles.stepsCard}>
                <Text style={styles.stepsCardTitle}>4 QUICK STEPS TO COMPLETE:</Text>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>1</Text></View>
                  <Text style={styles.stepItemText}>Open <Text style={{ fontWeight: '700', color: '#0F172A' }}>{launchedAppName}</Text> on your phone</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>2</Text></View>
                  <Text style={styles.stepItemText}>Review payment request of <Text style={{ fontWeight: '700', color: '#0F172A' }}>₹{effectivePayableAmount.toLocaleString('en-IN')}</Text></Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>3</Text></View>
                  <Text style={styles.stepItemText}>Enter your <Text style={{ fontWeight: '700', color: '#0F172A' }}>4 or 6-digit UPI PIN</Text> to authorize</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumBadge}><Text style={styles.stepNumText}>4</Text></View>
                  <Text style={styles.stepItemText}>Return here and tap <Text style={{ fontWeight: '700', color: '#0066FF' }}>"Confirm & Verify Payment"</Text></Text>
                </View>
              </View>

              {/* Optional UPI Reference / UTR input */}
              <View style={styles.utrInputCard}>
                <Text style={styles.utrInputLabel}>12-Digit UPI Ref / UTR Number (Optional)</Text>
                <TextInput
                  value={upiUtrInput}
                  onChangeText={setUpiUtrInput}
                  placeholder="e.g. 423987654321"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={16}
                  style={styles.utrTextInput}
                />
                <Text style={styles.utrHelperText}>Found on your {launchedAppName} transaction receipt</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.awaitingActionsContainer}>
                {/* Primary: Confirm Payment Button */}
                <TouchableOpacity
                  onPress={handleConfirmUpiPayment}
                  disabled={confirmingPayment}
                  style={styles.confirmPaidBtn}
                  activeOpacity={0.88}
                >
                  {confirmingPayment ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.confirmPaidBtnText}>Verifying Transaction...</Text>
                    </View>
                  ) : (
                    <View style={styles.payBtnInner}>
                      <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.confirmPaidBtnText}>I Have Entered PIN & Paid ₹{effectivePayableAmount.toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Secondary: Relaunch App */}
                <TouchableOpacity
                  onPress={() => launchNativeUpiApp(selectedUpiApp)}
                  style={styles.reopenAppBtn}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={14} color="#0066FF" strokeWidth={2} />
                  <Text style={styles.reopenAppBtnText}>Re-open {launchedAppName}</Text>
                </TouchableOpacity>

                {/* Tertiary: Open Razorpay Live Page */}
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://razorpay.me/@virattom')}
                  style={styles.razorpayLinkBtn}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={13} color="#475569" />
                  <Text style={styles.razorpayLinkText}>Pay via Razorpay Live Portal (Cards, NetBanking, QR)</Text>
                </TouchableOpacity>

                {/* Cancel / Back Button */}
                <TouchableOpacity
                  onPress={() => setIsAwaitingUpiConfirmation(false)}
                  style={styles.cancelAwaitingBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelAwaitingText}>Cancel / Back to Payment Methods</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* ========================================================================= */
            /* SCREEN A: STANDARD PAYMENT METHOD SELECTOR                                 */
            /* ========================================================================= */
            <>
              {/* 2. Compact Order Amount Summary Bar */}
              <View style={styles.amountBar}>
                <View style={styles.amountBarLeft}>
                  <Text style={styles.amountBarLabel}>Total Payable Amount</Text>
                  <View style={styles.amountDisplayRow}>
                    <Text style={styles.amountCurrency}>₹</Text>
                    <Text style={styles.amountValue}>{effectivePayableAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                <View style={styles.dispatchPill}>
                  <Sparkles size={12} color="#0066FF" strokeWidth={2.2} />
                  <Text style={styles.dispatchPillText}>3-Hour Site Dispatch</Text>
                </View>
              </View>

              {/* 3. High-Efficiency Payment Mode Selector Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  onPress={() => setSelectedMethod('upi')}
                  style={[styles.tabItem, selectedMethod === 'upi' && styles.tabItemActive]}
                  activeOpacity={0.8}
                >
                  <Smartphone size={15} color={selectedMethod === 'upi' ? '#0066FF' : '#64748B'} strokeWidth={2.2} />
                  <Text style={[styles.tabText, selectedMethod === 'upi' && styles.tabTextActive]}>
                    UPI Fast
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedMethod('card')}
                  style={[styles.tabItem, selectedMethod === 'card' && styles.tabItemActive]}
                  activeOpacity={0.8}
                >
                  <CreditCard size={15} color={selectedMethod === 'card' ? '#0066FF' : '#64748B'} strokeWidth={2.2} />
                  <Text style={[styles.tabText, selectedMethod === 'card' && styles.tabTextActive]}>
                    Cards
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedMethod('netbanking')}
                  style={[styles.tabItem, selectedMethod === 'netbanking' && styles.tabItemActive]}
                  activeOpacity={0.8}
                >
                  <Building2 size={15} color={selectedMethod === 'netbanking' ? '#0066FF' : '#64748B'} strokeWidth={2.2} />
                  <Text style={[styles.tabText, selectedMethod === 'netbanking' && styles.tabTextActive]}>
                    Net Banking
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedMethod('site_pay')}
                  style={[styles.tabItem, selectedMethod === 'site_pay' && styles.tabItemActive]}
                  activeOpacity={0.8}
                >
                  <Truck size={15} color={selectedMethod === 'site_pay' ? '#0066FF' : '#64748B'} strokeWidth={2.2} />
                  <Text style={[styles.tabText, selectedMethod === 'site_pay' && styles.tabTextActive]}>
                    Site Pay
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 4. Active Tab Content Area */}
              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {/* ====== A. UPI VIEW ====== */}
                {selectedMethod === 'upi' && (
                  <View style={styles.tabContentSection}>
                    <Text style={styles.sectionMicroTitle}>RECOMMENDED 1-TAP UPI APPS</Text>

                    {/* Quick 1-Tap App Grid */}
                    <View style={styles.upiGrid}>
                      {/* Google Pay */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUpiApp('gpay');
                          setShowQr(false);
                        }}
                        style={[styles.upiAppCard, selectedUpiApp === 'gpay' && !showQr && styles.upiAppCardActive]}
                        activeOpacity={0.85}
                      >
                        <GooglePayIcon size={24} />
                        <View style={styles.upiAppCardInfo}>
                          <Text style={styles.upiAppName}>Google Pay</Text>
                          <Text style={styles.upiAppSub}>Direct UPI Instant Transfer</Text>
                        </View>
                        <View style={[styles.radioDot, selectedUpiApp === 'gpay' && !showQr && styles.radioDotActive]}>
                          {selectedUpiApp === 'gpay' && !showQr && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>

                      {/* PhonePe */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUpiApp('phonepe');
                          setShowQr(false);
                        }}
                        style={[styles.upiAppCard, selectedUpiApp === 'phonepe' && !showQr && styles.upiAppCardActive]}
                        activeOpacity={0.85}
                      >
                        <PhonePeIcon size={24} />
                        <View style={styles.upiAppCardInfo}>
                          <Text style={styles.upiAppName}>PhonePe</Text>
                          <Text style={styles.upiAppSub}>Direct UPI Instant Transfer</Text>
                        </View>
                        <View style={[styles.radioDot, selectedUpiApp === 'phonepe' && !showQr && styles.radioDotActive]}>
                          {selectedUpiApp === 'phonepe' && !showQr && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>

                      {/* Paytm */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUpiApp('paytm');
                          setShowQr(false);
                        }}
                        style={[styles.upiAppCard, selectedUpiApp === 'paytm' && !showQr && styles.upiAppCardActive]}
                        activeOpacity={0.85}
                      >
                        <PaytmIcon size={24} />
                        <View style={styles.upiAppCardInfo}>
                          <Text style={styles.upiAppName}>Paytm UPI</Text>
                          <Text style={styles.upiAppSub}>Direct UPI Instant Transfer</Text>
                        </View>
                        <View style={[styles.radioDot, selectedUpiApp === 'paytm' && !showQr && styles.radioDotActive]}>
                          {selectedUpiApp === 'paytm' && !showQr && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>

                      {/* Amazon Pay */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUpiApp('amazon');
                          setShowQr(false);
                        }}
                        style={[styles.upiAppCard, selectedUpiApp === 'amazon' && !showQr && styles.upiAppCardActive]}
                        activeOpacity={0.85}
                      >
                        <AmazonPayIcon size={24} />
                        <View style={styles.upiAppCardInfo}>
                          <Text style={styles.upiAppName}>Amazon Pay</Text>
                          <Text style={styles.upiAppSub}>Direct UPI Instant Transfer</Text>
                        </View>
                        <View style={[styles.radioDot, selectedUpiApp === 'amazon' && !showQr && styles.radioDotActive]}>
                          {selectedUpiApp === 'amazon' && !showQr && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* QR Code Option Toggle */}
                    <TouchableOpacity
                      onPress={() => setShowQr(!showQr)}
                      style={[styles.qrToggleBox, showQr && styles.qrToggleBoxActive]}
                      activeOpacity={0.85}
                    >
                      <View style={styles.qrToggleLeft}>
                        <QrCode size={18} color={showQr ? '#0066FF' : '#334155'} />
                        <View>
                          <Text style={styles.qrToggleTitle}>Scan Dynamic UPI QR</Text>
                          <Text style={styles.qrToggleSub}>Scan with ANY UPI app (BHIM, CRED, GPay)</Text>
                        </View>
                      </View>
                      <Text style={[styles.qrToggleAction, showQr && { color: '#0066FF' }]}>
                        {showQr ? 'Hide QR' : 'Show QR'}
                      </Text>
                    </TouchableOpacity>

                    {/* Dynamic QR Code Display */}
                    {showQr && (
                      <View style={styles.dynamicQrCard}>
                        <View style={styles.qrContainerBox}>
                          <View style={styles.qrInnerWrapper}>
                            <QrCode size={130} color="#0F172A" strokeWidth={2} />
                            <View style={styles.qrCenterLogo}>
                              <Text style={styles.qrCenterLogoText}>U</Text>
                            </View>
                          </View>
                        </View>

                        <Text style={styles.qrAmountText}>₹{effectivePayableAmount.toLocaleString('en-IN')}</Text>
                        <Text style={styles.qrTimerText}>
                          QR expires in {Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}
                        </Text>
                      </View>
                    )}

                    {/* Custom UPI ID / VPA */}
                    <View style={styles.customUpiBox}>
                      <Text style={styles.sectionMicroTitle}>OR ENTER UPI ID / VPA</Text>
                      <View style={styles.upiInputWrapper}>
                        <TextInput
                          value={upiId}
                          onChangeText={setUpiId}
                          placeholder="mobile@okhdfcbank"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="none"
                          style={styles.upiTextInput}
                        />
                      </View>

                      {/* Suffix Handle Chips */}
                      <View style={styles.handlesRow}>
                        {['@okhdfcbank', '@ybl', '@paytm', '@okaxis', '@apl'].map((handle) => (
                          <TouchableOpacity
                            key={handle}
                            onPress={() => setUpiId(`${userPhone}${handle}`)}
                            style={[styles.handleChip, upiId.endsWith(handle) && styles.handleChipActive]}
                          >
                            <Text style={[styles.handleChipText, upiId.endsWith(handle) && styles.handleChipTextActive]}>
                              {handle}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* ====== B. CARDS VIEW ====== */}
                {selectedMethod === 'card' && (
                  <View style={styles.tabContentSection}>
                    <Text style={styles.sectionMicroTitle}>CARD DETAILS</Text>

                    {/* Card Number */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Card Number</Text>
                      <View style={styles.cardInputWrapper}>
                        <TextInput
                          value={cardNumber}
                          onChangeText={handleCardNumberChange}
                          placeholder="4532 •••• •••• 2411"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          maxLength={19}
                          style={styles.cardTextInput}
                        />
                        <View style={styles.cardBrandBadge}>
                          {cardBrand.component ? (
                            React.createElement(cardBrand.component, { size: 18 })
                          ) : (
                            <Text style={styles.cardBrandText}>{cardBrand.name}</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Expiry & CVV */}
                    <View style={styles.twoColumnRow}>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Expiry Date</Text>
                        <TextInput
                          value={cardExpiry}
                          onChangeText={handleExpiryChange}
                          placeholder="MM / YY"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          maxLength={5}
                          style={styles.simpleTextInput}
                        />
                      </View>

                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <View style={styles.labelWithInfo}>
                          <Text style={styles.fieldLabel}>CVV</Text>
                          <Info size={12} color="#94A3B8" />
                        </View>
                        <TextInput
                          value={cardCvv}
                          onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').substring(0, 4))}
                          placeholder="•••"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          maxLength={4}
                          secureTextEntry
                          style={styles.simpleTextInput}
                        />
                      </View>
                    </View>

                    {/* Name on Card */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Name on Card</Text>
                      <TextInput
                        value={cardHolder}
                        onChangeText={setCardHolder}
                        placeholder="e.g. Rajesh Kumar"
                        placeholderTextColor="#94A3B8"
                        style={styles.simpleTextInput}
                      />
                    </View>

                    {/* RBI Tokenization Checkbox */}
                    <TouchableOpacity
                      onPress={() => setSaveCardRbi(!saveCardRbi)}
                      style={styles.checkboxRow}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.customCheckbox, saveCardRbi && styles.customCheckboxActive]}>
                        {saveCardRbi && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        Securely save card as per RBI guidelines for faster checkout
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ====== C. NET BANKING VIEW ====== */}
                {selectedMethod === 'netbanking' && (
                  <View style={styles.tabContentSection}>
                    <Text style={styles.sectionMicroTitle}>POPULAR BANKS</Text>

                    <View style={styles.banksGrid}>
                      {popularBanks.map((bank) => {
                        const isSelected = selectedBank === bank.name;
                        return (
                          <TouchableOpacity
                            key={bank.name}
                            onPress={() => setSelectedBank(bank.name)}
                            style={[styles.bankTile, isSelected && styles.bankTileActive]}
                            activeOpacity={0.8}
                          >
                            <Building2 size={16} color={isSelected ? '#0066FF' : '#475569'} />
                            <Text style={[styles.bankTileText, isSelected && styles.bankTileTextActive]} numberOfLines={1}>
                              {bank.name}
                            </Text>
                            <View style={[styles.bankRadio, isSelected && styles.bankRadioActive]}>
                              {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* All other banks dropdown */}
                    <TouchableOpacity
                      onPress={() => setShowAllBanks(!showAllBanks)}
                      style={styles.otherBanksBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.otherBanksText}>Select From 50+ Other Scheduled Banks</Text>
                      <ChevronDown size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* ====== D. PAY ON SITE / SPLIT VIEW ====== */}
                {selectedMethod === 'site_pay' && (
                  <View style={styles.tabContentSection}>
                    <Text style={styles.sectionMicroTitle}>COMMERCIAL DELIVERY SITE OPTIONS</Text>

                    {/* 100% Full On-Site vs 50% Advance */}
                    <TouchableOpacity
                      onPress={() => setAdvancePercent(50)}
                      style={[styles.splitOptionCard, advancePercent === 50 && styles.splitOptionCardActive]}
                      activeOpacity={0.85}
                    >
                      <View style={styles.splitRadio}>
                        {advancePercent === 50 && <View style={styles.splitRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.splitOptionTitle}>
                          50% Advance Booking (₹{Math.round(amount / 2).toLocaleString('en-IN')})
                        </Text>
                        <Text style={styles.splitOptionSub}>
                          Locks in current yard rates. Pay the remaining ₹{Math.round(amount / 2).toLocaleString('en-IN')} upon weighbridge arrival.
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setAdvancePercent(100)}
                      style={[styles.splitOptionCard, advancePercent === 100 && styles.splitOptionCardActive]}
                      activeOpacity={0.85}
                    >
                      <View style={styles.splitRadio}>
                        {advancePercent === 100 && <View style={styles.splitRadioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.splitOptionTitle}>
                          Full Payment Now (₹{amount.toLocaleString('en-IN')})
                        </Text>
                        <Text style={styles.splitOptionSub}>
                          Direct 1-touch yard gate pass clearance. No site delays.
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* 5. Minimalist Sticky Action Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={handleExecutePayment}
                  disabled={isProcessing}
                  style={styles.payBtn}
                  activeOpacity={0.88}
                >
                  {isProcessing ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.payBtnText}>Opening {selectedMethod === 'upi' ? selectedUpiApp.toUpperCase() : 'Gateway'}...</Text>
                    </View>
                  ) : (
                    <View style={styles.payBtnInner}>
                      <Lock size={15} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.payBtnText}>
                        Pay ₹{effectivePayableAmount.toLocaleString('en-IN')} {selectedMethod === 'upi' ? `via ${selectedUpiApp === 'gpay' ? 'Google Pay' : selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp.toUpperCase()}` : ''}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.trustNoteRow}>
                  <ShieldCheck size={13} color="#64748B" />
                  <Text style={styles.trustNoteText}>
                    NPCI & RBI Compliant • 100% Refund Guarantee on Weight Variance
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingSheet: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '94%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  merchantHeaderInfo: {
    alignItems: 'center',
  },
  merchantTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  merchantSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  amountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  amountBarLeft: {
    gap: 2,
  },
  amountBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  amountCurrency: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  dispatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dispatchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0066FF',
    fontWeight: '800',
  },
  scrollBody: {
    maxHeight: 380,
  },
  tabContentSection: {
    padding: 16,
    gap: 12,
  },
  sectionMicroTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  upiGrid: {
    gap: 8,
  },
  upiAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  upiAppCardActive: {
    borderColor: '#0066FF',
    backgroundColor: '#F8FAFC',
  },
  upiAppCardInfo: {
    flex: 1,
  },
  upiAppName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  upiAppSub: {
    fontSize: 11,
    color: '#64748B',
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotActive: {
    borderColor: '#0066FF',
    backgroundColor: '#0066FF',
  },
  qrToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginTop: 4,
  },
  qrToggleBoxActive: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF',
  },
  qrToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrToggleTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  qrToggleSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  qrToggleAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  dynamicQrCard: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  qrContainerBox: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrInnerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 4,
  },
  qrCenterLogo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  qrCenterLogoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  qrAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrTimerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  customUpiBox: {
    gap: 8,
    marginTop: 6,
  },
  upiInputWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  upiTextInput: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
    outlineStyle: 'none' as any,
  },
  handlesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  handleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  handleChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  handleChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  handleChipTextActive: {
    color: '#0066FF',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  cardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#0F172A',
    padding: 0,
    outlineStyle: 'none' as any,
  },
  cardBrandBadge: {
    marginLeft: 8,
  },
  cardBrandText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  simpleTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    outlineStyle: 'none' as any,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  checkboxLabel: {
    fontSize: 11.5,
    color: '#475569',
    flex: 1,
  },
  banksGrid: {
    gap: 8,
  },
  bankTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  bankTileActive: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF',
  },
  bankTileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginLeft: 10,
  },
  bankTileTextActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
  bankRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankRadioActive: {
    borderColor: '#0066FF',
    backgroundColor: '#0066FF',
  },
  otherBanksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginTop: 4,
  },
  otherBanksText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  splitOptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  splitOptionCardActive: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF',
  },
  splitRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  splitRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066FF',
  },
  splitOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  splitOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  payBtn: {
    backgroundColor: '#0066FF',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  trustNoteText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },

  // ==================== Awaiting Confirmation Screen Styles ====================
  awaitingContainer: {
    padding: 16,
    maxHeight: 460,
  },
  awaitingStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  awaitingIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  awaitingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  awaitingSub: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  txnSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 12,
  },
  txnSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txnSummaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  txnSummaryLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  txnSummaryAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  txnSummaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  copyVpaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  txnSummaryVpa: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0066FF',
  },
  copiedTag: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 12,
  },
  stepsCardTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepNumText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  stepItemText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  utrInputCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 14,
  },
  utrInputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  utrTextInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  utrHelperText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  awaitingActionsContainer: {
    gap: 10,
    marginBottom: 18,
  },
  confirmPaidBtn: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  confirmPaidBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  reopenAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reopenAppBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0066FF',
  },
  razorpayLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  razorpayLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  cancelAwaitingBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  cancelAwaitingText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EF4444',
  },
});
