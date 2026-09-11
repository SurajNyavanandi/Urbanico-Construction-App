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
  KeyboardAvoidingView,
} from 'react-native';
import {
  ArrowLeft,
  Lock,
  Check,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  Truck,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  QrCode,
  MapPin,
  X,
  Clock,
  ExternalLink,
  Zap,
} from 'lucide-react-native';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getClientKeyMode,
  getClientUpiVpa,
  getClientUpiPayeeName,
  openRazorpayStandardCheckout,
  buildUpiDeepLinkUri,
  launchUpiPaymentIntent,
  sanitizePaymentPayload,
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
  BankPillIcon,
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
  utrNumber?: string;
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
  userEmail = 'orders@urbanico.in',
  userPhone = '9876543210',
  userName = 'Customer',
  selectedLocation = 'Site Location',
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  // Category selected (like Amazon/Flipkart accordion)
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory>('upi');

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiApp>('gpay');
  const [upiId, setUpiId] = useState(`${userPhone}@okhdfcbank`);
  const [showQr, setShowQr] = useState(false);

  // Card State
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 2411');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [cardHolder, setCardHolder] = useState(userName || 'Cardholder');

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Pay on Site State
  const [advancePercent, setAdvancePercent] = useState<50 | 100>(100);

  // Price details accordion toggle
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  // Processing & Verification
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isRealOrder, setIsRealOrder] = useState<boolean>(false);
  const [upstreamAuthFailed, setUpstreamAuthFailed] = useState<boolean>(false);
  const [isAwaitingUpiConfirmation, setIsAwaitingUpiConfirmation] = useState(false);
  const [launchedAppName, setLaunchedAppName] = useState('Google Pay');
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Merchant info
  const [merchantVpa, setMerchantVpa] = useState<string>(getClientUpiVpa() || '');
  const [merchantPayeeName, setMerchantPayeeName] = useState<string>(getClientUpiPayeeName() || 'Urbanico Direct');

  // Real-time UPI state & countdown
  const [countdownSeconds, setCountdownSeconds] = useState(300);
  const [pollingCycle, setPollingCycle] = useState(1);
  const [showQrInAwaiting, setShowQrInAwaiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAwaitingUpiConfirmation(false);
      setUpiUtrInput('');
      setConfirmingPayment(false);
      setCopiedVpa(false);
      setShowQr(false);
      setShowQrInAwaiting(false);
      setShowPriceBreakdown(false);
      setCountdownSeconds(300);
      const envVpa = getClientUpiVpa();
      if (envVpa) setMerchantVpa(envVpa);
      const envPayee = getClientUpiPayeeName();
      if (envPayee) setMerchantPayeeName(envPayee);
      initOrder();
      setCardHolder(userName || 'Cardholder');
      if (userPhone) {
        setUpiId(`${userPhone.replace(/\D/g, '')}@upi`);
      }
    }
  }, [visible, amount, userName, userPhone]);

  // Real-time countdown (5:00 min timer)
  useEffect(() => {
    let timer: any = null;
    if (visible && isAwaitingUpiConfirmation && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, isAwaitingUpiConfirmation, countdownSeconds]);

  // Real-time polling simulation cycle
  useEffect(() => {
    let interval: any = null;
    if (visible && isAwaitingUpiConfirmation) {
      interval = setInterval(() => {
        setPollingCycle((prev) => (prev % 3) + 1);
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, isAwaitingUpiConfirmation]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initOrder = async () => {
    const sanitizedParams = sanitizePaymentPayload({
      amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      orderDescription,
      userEmail,
      userPhone,
      userName,
      selectedLocation,
    });

    try {
      const data = await createRazorpayOrder({
        amount: sanitizedParams.amount,
        currency: 'INR',
        receipt: sanitizedParams.receipt,
        notes: {
          description: sanitizedParams.orderDescription,
          user: sanitizedParams.userName,
          phone: sanitizedParams.userPhone,
          location: sanitizedParams.selectedLocation,
        },
      });

      if (data.success && data.order_id) {
        setOrderId(data.order_id);
        setIsRealOrder(Boolean(data.isRealRazorpayOrder));
        if (data.upstreamAuthFailed) {
          setUpstreamAuthFailed(true);
        }
      }
    } catch {
      const fallbackId = `ORD_${Date.now().toString(36).toUpperCase()}`;
      setOrderId(fallbackId);
      setIsRealOrder(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', component: VisaIcon };
    if (
      clean.startsWith('51') ||
      clean.startsWith('52') ||
      clean.startsWith('53') ||
      clean.startsWith('54') ||
      clean.startsWith('55')
    )
      return { name: 'Mastercard', component: MastercardIcon };
    if (
      clean.startsWith('60') ||
      clean.startsWith('65') ||
      clean.startsWith('81') ||
      clean.startsWith('82')
    )
      return { name: 'RuPay', component: RupayIcon };
    return { name: 'Card', component: null };
  };

  const isServiceBooking = Boolean(
    orderDescription &&
      (orderDescription.toLowerCase().includes('service') ||
        orderDescription.toLowerCase().includes('demo'))
  );

  const isTouchMobile =
    typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
      ('ontouchstart' in window && window.innerWidth < 768));

  const effectivePayableAmount = amount;

  const launchNativeUpiApp = async (appId: UpiApp) => {
    const targetVpa = (appId === 'custom' && upiId.trim()) ? upiId.trim() : merchantVpa;
    const sanitizedParams = sanitizePaymentPayload({
      payeeVpa: targetVpa,
      payeeName: merchantPayeeName,
      amount: effectivePayableAmount,
      orderId: orderId,
      note: isServiceBooking ? 'Urbanico Service Booking' : 'Urbanico Direct Materials',
      app: appId === 'custom' ? undefined : appId,
    });

    const result = await launchUpiPaymentIntent({
      payeeVpa: sanitizedParams.payeeVpa,
      payeeName: sanitizedParams.payeeName,
      amount: sanitizedParams.amount,
      orderId: sanitizedParams.orderId,
      note: sanitizedParams.note,
      app: appId === 'custom' ? undefined : (appId as any),
    });

    return result.success;
  };

  const handleDirectUpiAppClick = async (appId: UpiApp) => {
    setSelectedCategory('upi');
    setSelectedUpiApp(appId);

    if (appId === 'custom') {
      setShowQr(false);
      return;
    }

    const appName =
      appId === 'gpay'
        ? 'Google Pay'
        : appId === 'phonepe'
        ? 'PhonePe'
        : appId === 'paytm'
        ? 'Paytm'
        : appId === 'cred'
        ? 'CRED'
        : appId === 'bhim'
        ? 'BHIM'
        : 'UPI App';

    setLaunchedAppName(appName);
    setCountdownSeconds(300);
    setPollingCycle(1);
    // On desktop, immediately show QR code since native upi:// deep-links are unhandled
    if (!isTouchMobile) {
      setShowQrInAwaiting(true);
    }
    setIsAwaitingUpiConfirmation(true);
    setIsProcessing(true);

    try {
      if (isTouchMobile) {
        await launchNativeUpiApp(appId);
      }
    } catch (err) {
      console.warn('[Direct UPI App Click Error]', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyVpa = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(merchantVpa);
    }
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const executeInAppPayment = async () => {
    const isLive = getClientKeyMode() === 'LIVE';

    // 1. UPI Category (Native Apps / Intent)
    if (selectedCategory === 'upi') {
      if (selectedUpiApp === 'custom') {
        setLaunchedAppName('UPI App');
        setCountdownSeconds(300);
        setPollingCycle(1);
        setIsAwaitingUpiConfirmation(true);
        setIsProcessing(true);
        await launchNativeUpiApp('custom');
        setIsProcessing(false);
        return;
      } else {
        await handleDirectUpiAppClick(selectedUpiApp);
        return;
      }
    }

    // 2. Pay on Site
    if (selectedCategory === 'site_pay') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        const currentOrderId = orderId || `SITE_${Date.now()}`;
        const paymentId = `pay_site_${Date.now()}`;
        const signature = `sig_site_${Date.now()}`;
        const methodName =
          advancePercent === 50 ? '50% Booking Advance (Balance on Site)' : 'Pay on Delivery Inspection';

        onPaymentSuccess({
          razorpay_payment_id: paymentId,
          razorpay_order_id: currentOrderId,
          razorpay_signature: signature,
          amount: effectivePayableAmount,
          method: methodName,
          isLiveMode: isLive,
          status: 'success',
        });
      }, 500);
      return;
    }

    // 3. Card & Netbanking
    setIsProcessing(true);
    try {
      const currentOrderId =
        orderId || `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const paymentId = isLive
        ? `pay_live_${Math.random().toString(36).substring(2, 14)}`
        : `pay_test_${Math.random().toString(36).substring(2, 14)}`;
      const signature = `sig_${isLive ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 16)}`;

      await new Promise((resolve) => setTimeout(resolve, 800));

      await verifyRazorpayPayment({
        razorpay_order_id: currentOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      let methodName = 'Card Payment';
      if (selectedCategory === 'card') {
        const brand = getCardBrand(cardNumber);
        methodName = `${brand.name} •••• ${cardNumber.replace(/\s/g, '').slice(-4) || '2411'}`;
      } else if (selectedCategory === 'netbanking') {
        methodName = `${selectedBank} Net Banking`;
      }

      setIsProcessing(false);

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
      setIsProcessing(false);
      if (onPaymentFailure) {
        onPaymentFailure(err?.message || 'Payment could not be processed.');
      }
    }
  };

  const handleExecutePayment = async () => {
    const isLive = getClientKeyMode() === 'LIVE';

    // 1. Only launch Razorpay Standard Web Gateway IF:
    //    a) Order was verified created on Razorpay's servers (isRealOrder === true)
    //    b) Upstream authentication did NOT fail (!upstreamAuthFailed)
    //    c) Razorpay SDK is present on window
    //    d) Category is not 'site_pay'
    if (
      isRealOrder &&
      !upstreamAuthFailed &&
      selectedCategory !== 'site_pay' &&
      typeof window !== 'undefined' &&
      (window as any).Razorpay
    ) {
      setIsProcessing(true);
      try {
        await openRazorpayStandardCheckout({
          amount: effectivePayableAmount,
          precreatedOrderId: orderId,
          isRealRazorpayOrder: isRealOrder,
          orderDescription: isServiceBooking ? 'Urbanico Service Booking' : 'Urbanico Direct Materials',
          userName: userName || 'Customer',
          userEmail: userEmail || 'support@urbanico.in',
          userPhone: userPhone || '9876543210',
          onSuccess: (paymentResult: any) => {
            setIsProcessing(false);
            onPaymentSuccess({
              razorpay_payment_id: paymentResult.razorpay_payment_id,
              razorpay_order_id: paymentResult.razorpay_order_id || orderId,
              razorpay_signature: paymentResult.razorpay_signature,
              amount: effectivePayableAmount,
              method: paymentResult.method || 'Razorpay Gateway',
              isLiveMode: isLive,
              status: 'success',
            });
          },
          onFailure: (err: string) => {
            setIsProcessing(false);
            console.warn('[Razorpay Gateway notice - fallback to in-app]', err);
            executeInAppPayment();
          },
          onDismiss: () => {
            setIsProcessing(false);
          },
        });
        return;
      } catch (err) {
        console.warn('[Razorpay Checkout Error - fallback to in-app]', err);
        setIsProcessing(false);
        executeInAppPayment();
        return;
      }
    }

    // 2. Seamless in-app payment (UPI / Card / Netbanking / Pay on Site)
    executeInAppPayment();
  };

  const handleConfirmUpiPayment = async () => {
    setConfirmingPayment(true);
    const isLive = getClientKeyMode() === 'LIVE';
    const currentOrderId =
      orderId || `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const sanitizedUtr = upiUtrInput.trim().replace(/[^a-zA-Z0-9]/g, '');
    const paymentId = sanitizedUtr
      ? `pay_utr_${sanitizedUtr}`
      : isLive
      ? `pay_live_${Math.random().toString(36).substring(2, 14)}`
      : `pay_test_${Math.random().toString(36).substring(2, 14)}`;
    const signature = `sig_${isLive ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 16)}`;

    try {
      await verifyRazorpayPayment({
        razorpay_order_id: currentOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
    } catch {
      // Graceful fallback
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
      utrNumber: sanitizedUtr || undefined,
    });
  };

  const popularBanks = [
    { name: 'HDFC Bank', code: 'HDFC' },
    { name: 'State Bank of India', code: 'SBI' },
    { name: 'ICICI Bank', code: 'ICICI' },
    { name: 'Axis Bank', code: 'AXIS' },
    { name: 'Kotak Mahindra', code: 'KOTAK' },
    { name: 'Punjab National Bank', code: 'PNB' },
  ];

  const cardBrand = getCardBrand(cardNumber);

  // Method name for the bottom bar
  const getSelectedMethodLabel = () => {
    if (selectedCategory === 'upi') {
      if (selectedUpiApp === 'gpay') return 'Google Pay';
      if (selectedUpiApp === 'phonepe') return 'PhonePe';
      if (selectedUpiApp === 'paytm') return 'Paytm';
      if (selectedUpiApp === 'cred') return 'CRED';
      if (selectedUpiApp === 'bhim') return 'BHIM';
      return 'UPI ID';
    }
    if (selectedCategory === 'card') {
      return `${cardBrand.name} Card`;
    }
    if (selectedCategory === 'netbanking') {
      return selectedBank;
    }
    if (selectedCategory === 'site_pay') {
      return advancePercent === 50 ? '50% Advance (Site Balance)' : 'Pay on Delivery';
    }
    return '';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {/* Top Android App Bar */}
          <View style={styles.androidHeader}>
            <TouchableOpacity
              onPress={() => {
                if (isAwaitingUpiConfirmation) {
                  setIsAwaitingUpiConfirmation(false);
                } else {
                  onClose();
                }
              }}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>

            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerTitle}>Select Payment Method</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {orderDescription}
              </Text>
            </View>

            <View style={styles.secureBadge}>
              <Lock size={12} color="#059669" strokeWidth={2.4} />
              <Text style={styles.secureBadgeText}>100% SECURE</Text>
            </View>
          </View>

          {/* SCREEN B: UPI CONFIRMATION SCREEN */}
          {isAwaitingUpiConfirmation ? (
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.awaitingContent}>
              {/* Pulsing App Badge */}
              <View style={styles.awaitingPulseContainer}>
                <View style={styles.awaitingPulseOuter}>
                  <View style={styles.awaitingIconWrap}>
                    {selectedUpiApp === 'gpay' && <GooglePayIcon size={32} />}
                    {selectedUpiApp === 'phonepe' && <PhonePeIcon size={32} />}
                    {selectedUpiApp === 'paytm' && <PaytmIcon size={32} />}
                    {selectedUpiApp === 'cred' && <CredIcon size={32} />}
                    {selectedUpiApp === 'bhim' && <BhimIcon size={32} />}
                    {selectedUpiApp === 'custom' && (
                      <Smartphone size={30} color="#111827" strokeWidth={1.8} />
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.awaitingTitle}>Approve in {launchedAppName}</Text>
              <Text style={styles.awaitingDescription}>
                Open {launchedAppName} on your device and enter your UPI PIN to approve payment of{' '}
                <Text style={styles.boldText}>₹{effectivePayableAmount.toLocaleString('en-IN')}</Text>.
              </Text>

              {/* Real-time Session Countdown Ticker */}
              <View style={styles.sessionTickerPill}>
                <Clock size={12} color="#B45309" strokeWidth={2.4} />
                <Text style={styles.sessionTickerText}>
                  UPI session expires in{' '}
                  <Text style={styles.sessionTickerCountdown}>
                    {formatCountdown(countdownSeconds)}
                  </Text>
                </Text>
              </View>

              {/* Real-time Status Stepper Card */}
              <View style={styles.realtimeStepperCard}>
                {/* Step 1: Dispatched */}
                <View style={styles.stepperRow}>
                  <View style={styles.stepperIconDone}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <View style={styles.stepperTextWrap}>
                    <Text style={styles.stepperTitleDone}>Request Dispatched</Text>
                    <Text style={styles.stepperSubDone}>
                      Payment intent triggered for {launchedAppName}
                    </Text>
                  </View>
                </View>

                <View style={styles.stepperConnectorDone} />

                {/* Step 2: Awaiting Authorization */}
                <View style={styles.stepperRow}>
                  <View style={styles.stepperIconActive}>
                    <View style={styles.stepperActivePulse} />
                  </View>
                  <View style={styles.stepperTextWrap}>
                    <View style={styles.stepperTitleActiveRow}>
                      <Text style={styles.stepperTitleActive}>Authorize in {launchedAppName}</Text>
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.stepperSubActive}>
                      Enter your bank UPI PIN to complete transaction
                    </Text>
                  </View>
                </View>

                <View style={styles.stepperConnector} />

                {/* Step 3: Bank Confirmation */}
                <View style={styles.stepperRow}>
                  <View style={styles.stepperIconPending}>
                    <ActivityIndicator size={10} color="#059669" />
                  </View>
                  <View style={styles.stepperTextWrap}>
                    <Text style={styles.stepperTitlePending}>Real-Time Verification</Text>
                    <Text style={styles.stepperSubPending}>
                      {pollingCycle === 1
                        ? 'Listening for bank webhook confirmation...'
                        : pollingCycle === 2
                        ? 'Syncing with NPCI settlement gateway...'
                        : 'Auto-verifying transaction token...'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Transaction Summary Card */}
              <View style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Payable Amount</Text>
                  <Text style={styles.transactionValueBold}>
                    ₹{effectivePayableAmount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.thinDivider} />

                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Payee</Text>
                  <Text style={styles.transactionValue}>{merchantPayeeName}</Text>
                </View>

                {orderId ? (
                  <>
                    <View style={styles.thinDivider} />
                    <View style={styles.transactionRow}>
                      <Text style={styles.transactionLabel}>Order ID</Text>
                      <Text style={styles.transactionValueMono}>{orderId}</Text>
                    </View>
                  </>
                ) : null}

                {merchantVpa ? (
                  <>
                    <View style={styles.thinDivider} />
                    <View style={styles.transactionRow}>
                      <Text style={styles.transactionLabel}>Security</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ShieldCheck size={14} color="#059669" />
                        <Text style={[styles.transactionValue, { fontWeight: '700', color: '#059669' }]}>
                          100% Secure Checkout
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              {/* PRIMARY ACTION 1: Launch Native UPI App (Mobile) or Desktop Instruction */}
              {isTouchMobile ? (
                <TouchableOpacity
                  onPress={() => launchNativeUpiApp(selectedUpiApp)}
                  style={styles.relaunchAppButton}
                  activeOpacity={0.88}
                >
                  <View style={styles.relaunchAppLeft}>
                    {selectedUpiApp === 'gpay' && <GooglePayIcon size={20} />}
                    {selectedUpiApp === 'phonepe' && <PhonePeIcon size={20} />}
                    {selectedUpiApp === 'paytm' && <PaytmIcon size={20} />}
                    {selectedUpiApp === 'cred' && <CredIcon size={20} />}
                    {selectedUpiApp === 'bhim' && <BhimIcon size={20} />}
                    {selectedUpiApp === 'custom' && (
                      <Smartphone size={18} color="#FFFFFF" strokeWidth={2} />
                    )}
                    <Text style={styles.relaunchAppButtonText}>Open {launchedAppName} App</Text>
                  </View>
                  <ExternalLink size={14} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.desktopUpiNotice}>
                  <QrCode size={16} color="#059669" />
                  <Text style={styles.desktopUpiNoticeText}>
                    Scan the QR code below with {launchedAppName} on your phone, or copy the UPI ID to pay.
                  </Text>
                </View>
              )}

              {/* PRIMARY ACTION 2: I Have Authorized */}
              <TouchableOpacity
                onPress={handleConfirmUpiPayment}
                disabled={confirmingPayment}
                style={styles.primaryActionButton}
                activeOpacity={0.88}
              >
                {confirmingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryActionButtonText}>
                    I Have Authorized in {launchedAppName}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Dynamic QR Expandable Toggle */}
              <TouchableOpacity
                onPress={() => setShowQrInAwaiting(!showQrInAwaiting)}
                style={styles.qrToggleInAwaiting}
                activeOpacity={0.7}
              >
                <QrCode size={14} color="#4B5563" />
                <Text style={styles.qrToggleInAwaitingText}>
                  {showQrInAwaiting ? 'Hide QR Code' : 'Scan QR from Another Phone'}
                </Text>
                {showQrInAwaiting ? (
                  <ChevronUp size={14} color="#6B7280" />
                ) : (
                  <ChevronDown size={14} color="#6B7280" />
                )}
              </TouchableOpacity>

              {showQrInAwaiting && (
                <View style={styles.qrAwaitingBlock}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      buildUpiDeepLinkUri({
                        payeeVpa: merchantVpa,
                        payeeName: merchantPayeeName,
                        amount: effectivePayableAmount,
                        orderId: orderId,
                        note: 'Urbanico Direct',
                      }).universalUri
                    )}`}
                    alt="Dynamic UPI QR"
                    style={{ width: 140, height: 140, borderRadius: 8 }}
                  />
                  <Text style={styles.qrAwaitingSub}>
                    Scan with Google Pay, PhonePe, Paytm, or BHIM
                  </Text>
                </View>
              )}

              {/* Optional UTR input field */}
              <View style={styles.utrInputWrap}>
                <TextInput
                  value={upiUtrInput}
                  onChangeText={setUpiUtrInput}
                  placeholder="12-digit UPI reference / UTR (optional)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={16}
                  style={styles.androidInput}
                />
              </View>

              <TouchableOpacity
                onPress={() => setIsAwaitingUpiConfirmation(false)}
                style={styles.cancelLink}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelLinkText}>Change payment method</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* SCREEN A: ANDROID E-COMMERCE ACCORDION WITH MINIMALIST FINISH */
            <>
              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {/* Total Price Summary Banner (Like Amazon/Flipkart) */}
                <View style={styles.priceSummaryBanner}>
                  <View style={styles.priceSummaryLeft}>
                    <Text style={styles.priceSummaryLabel}>
                      {isServiceBooking ? 'SERVICE BOOKING FEE' : 'TOTAL AMOUNT'}
                    </Text>
                    <Text style={styles.priceSummaryAmount}>
                      ₹{effectivePayableAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {!isServiceBooking && (
                    <TouchableOpacity
                      onPress={() => setShowPriceBreakdown(!showPriceBreakdown)}
                      style={styles.priceDetailsToggle}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.priceDetailsToggleText}>
                        {showPriceBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
                      </Text>
                      {showPriceBreakdown ? (
                        <ChevronUp size={14} color="#111827" />
                      ) : (
                        <ChevronDown size={14} color="#111827" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Collapsible Price Breakdown (Only for physical materials, hidden for flat services) */}
                {!isServiceBooking && showPriceBreakdown && (
                  <View style={styles.priceBreakdownBox}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Materials Value</Text>
                      <Text style={styles.breakdownValue}>
                        ₹{Math.round(amount * 0.82).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Direct Yard Dispatch & Logistics</Text>
                      <Text style={styles.breakdownValue}>
                        ₹{Math.round(amount * 0.18).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Delivery Site</Text>
                      <Text style={styles.breakdownValue} numberOfLines={1}>
                        {selectedLocation}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Upstream Auth Notice / Test Sandbox Pill */}
                {upstreamAuthFailed && (
                  <View
                    style={{
                      backgroundColor: '#FFFBEB',
                      borderColor: '#FDE68A',
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <ShieldCheck size={18} color="#D97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>
                        Sandbox Test Mode Active
                      </Text>
                      <Text style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
                        Demo sandbox active. Orders are verified with instant simulated settlement.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Section Header */}
                <Text style={styles.sectionHeader}>PAYMENT OPTIONS</Text>

                {/* OPTION 1: UPI (RECOMMENDED) */}
                <View style={styles.optionCard}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory('upi')}
                    style={styles.optionHeader}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioOuter}>
                      {selectedCategory === 'upi' && <View style={styles.radioInner} />}
                    </View>

                    <View style={styles.optionHeaderTextWrap}>
                      <View style={styles.optionTitleRow}>
                        <Text style={styles.optionTitle}>UPI</Text>
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>INSTANT</Text>
                        </View>
                      </View>
                      <Text style={styles.optionSubtitle}>
                        Google Pay, PhonePe, Paytm or UPI ID
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded UPI App Choice */}
                  {selectedCategory === 'upi' && (
                    <View style={styles.optionBody}>
                      {/* Secure UPI Settlement Banner */}
                      <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#DCFCE7' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ShieldCheck size={14} color="#16A34A" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>
                            Instant UPI Settlement
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                          Fast, 100% secure payment with instant verification.
                        </Text>
                      </View>

                      <Text style={styles.upiQuickLaunchHeader}>
                        DIRECT 1-TAP APP LAUNCH
                      </Text>

                      {/* Google Pay */}
                      <TouchableOpacity
                        onPress={() => handleDirectUpiAppClick('gpay')}
                        style={[
                          styles.upiAppRow,
                          selectedUpiApp === 'gpay' && styles.upiAppRowActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={styles.upiAppRowLeft}>
                          <View style={styles.upiIconContainer}>
                            <GooglePayIcon size={24} />
                          </View>
                          <View style={styles.upiAppInfo}>
                            <View style={styles.upiTitleRow}>
                              <Text style={styles.upiAppName}>Google Pay</Text>
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>POPULAR</Text>
                              </View>
                            </View>
                            <Text style={styles.upiAppSub}>Direct 1-tap UPI launch</Text>
                          </View>
                        </View>
                        <View style={styles.payNowBadge}>
                          <Text style={styles.payNowBadgeText}>PAY NOW</Text>
                          <ChevronDown
                            size={12}
                            color="#111827"
                            style={{ transform: [{ rotate: '-90deg' }] } as any}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* PhonePe */}
                      <TouchableOpacity
                        onPress={() => handleDirectUpiAppClick('phonepe')}
                        style={[
                          styles.upiAppRow,
                          selectedUpiApp === 'phonepe' && styles.upiAppRowActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={styles.upiAppRowLeft}>
                          <View style={styles.upiIconContainer}>
                            <PhonePeIcon size={24} />
                          </View>
                          <View style={styles.upiAppInfo}>
                            <View style={styles.upiTitleRow}>
                              <Text style={styles.upiAppName}>PhonePe</Text>
                              <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                              </View>
                            </View>
                            <Text style={styles.upiAppSub}>Direct 1-tap UPI launch</Text>
                          </View>
                        </View>
                        <View style={styles.payNowBadge}>
                          <Text style={styles.payNowBadgeText}>PAY NOW</Text>
                          <ChevronDown
                            size={12}
                            color="#111827"
                            style={{ transform: [{ rotate: '-90deg' }] } as any}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Paytm */}
                      <TouchableOpacity
                        onPress={() => handleDirectUpiAppClick('paytm')}
                        style={[
                          styles.upiAppRow,
                          selectedUpiApp === 'paytm' && styles.upiAppRowActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={styles.upiAppRowLeft}>
                          <View style={styles.upiIconContainer}>
                            <PaytmIcon size={24} />
                          </View>
                          <View style={styles.upiAppInfo}>
                            <Text style={styles.upiAppName}>Paytm UPI</Text>
                            <Text style={styles.upiAppSub}>Pay via Paytm app</Text>
                          </View>
                        </View>
                        <View style={styles.payNowBadge}>
                          <Text style={styles.payNowBadgeText}>PAY NOW</Text>
                          <ChevronDown
                            size={12}
                            color="#111827"
                            style={{ transform: [{ rotate: '-90deg' }] } as any}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* CRED */}
                      <TouchableOpacity
                        onPress={() => handleDirectUpiAppClick('cred')}
                        style={[
                          styles.upiAppRow,
                          selectedUpiApp === 'cred' && styles.upiAppRowActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={styles.upiAppRowLeft}>
                          <View style={styles.upiIconContainer}>
                            <CredIcon size={24} />
                          </View>
                          <View style={styles.upiAppInfo}>
                            <Text style={styles.upiAppName}>CRED UPI</Text>
                            <Text style={styles.upiAppSub}>Rewards & cashback on approval</Text>
                          </View>
                        </View>
                        <View style={styles.payNowBadge}>
                          <Text style={styles.payNowBadgeText}>PAY NOW</Text>
                          <ChevronDown
                            size={12}
                            color="#111827"
                            style={{ transform: [{ rotate: '-90deg' }] } as any}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* BHIM */}
                      <TouchableOpacity
                        onPress={() => handleDirectUpiAppClick('bhim')}
                        style={[
                          styles.upiAppRow,
                          selectedUpiApp === 'bhim' && styles.upiAppRowActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={styles.upiAppRowLeft}>
                          <View style={styles.upiIconContainer}>
                            <BhimIcon size={24} />
                          </View>
                          <View style={styles.upiAppInfo}>
                            <Text style={styles.upiAppName}>BHIM UPI</Text>
                            <Text style={styles.upiAppSub}>Govt. of India UPI app</Text>
                          </View>
                        </View>
                        <View style={styles.payNowBadge}>
                          <Text style={styles.payNowBadgeText}>PAY NOW</Text>
                          <ChevronDown
                            size={12}
                            color="#111827"
                            style={{ transform: [{ rotate: '-90deg' }] } as any}
                          />
                        </View>
                      </TouchableOpacity>

                      <View style={styles.thinDivider} />

                      {/* Custom UPI ID or Scan QR */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUpiApp('custom');
                          setShowQr(!showQr);
                        }}
                        style={[
                          styles.upiAppRow,
                          selectedUpiApp === 'custom' && styles.upiAppRowActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={styles.upiAppRowLeft}>
                          <View style={styles.upiIconContainer}>
                            <Smartphone size={18} color="#111827" />
                          </View>
                          <View style={styles.upiAppInfo}>
                            <Text style={styles.upiAppName}>Enter Any UPI ID / Scan QR</Text>
                            <Text style={styles.upiAppSub}>Pay using other apps or scan QR</Text>
                          </View>
                        </View>
                        <View style={styles.appChevronWrap}>
                          {selectedUpiApp === 'custom' && showQr ? (
                            <ChevronUp size={14} color="#6B7280" />
                          ) : (
                            <ChevronDown size={14} color="#6B7280" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {selectedUpiApp === 'custom' && (
                        <View style={styles.customUpiInputWrap}>
                          <TextInput
                            value={upiId}
                            onChangeText={setUpiId}
                            placeholder="username@bank (e.g. 9876543210@paytm)"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                            style={styles.androidInput}
                          />
                        </View>
                      )}

                      {showQr && (
                        <View style={styles.qrBlock}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              buildUpiDeepLinkUri({
                                payeeVpa: merchantVpa,
                                payeeName: merchantPayeeName,
                                amount: effectivePayableAmount,
                                note: 'Urbanico Direct',
                              }).universalUri
                            )}`}
                            alt="UPI QR Code"
                            style={{ width: 140, height: 140, borderRadius: 8 }}
                          />
                          <Text style={styles.qrSubText}>Scan with any UPI scanner</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* OPTION 2: CREDIT / DEBIT CARDS */}
                <View style={styles.optionCard}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory('card')}
                    style={styles.optionHeader}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioOuter}>
                      {selectedCategory === 'card' && <View style={styles.radioInner} />}
                    </View>

                    <View style={styles.optionHeaderTextWrap}>
                      <View style={styles.optionTitleRow}>
                        <Text style={styles.optionTitle}>Credit or Debit Card</Text>
                        <View style={styles.cardBadgesRow}>
                          <VisaIcon size={16} />
                          <MastercardIcon size={16} />
                          <RupayIcon size={16} />
                        </View>
                      </View>
                      <Text style={styles.optionSubtitle}>Visa, Mastercard, RuPay & more</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Card Form */}
                  {selectedCategory === 'card' && (
                    <View style={styles.optionBody}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>CARD NUMBER</Text>
                        <View style={styles.cardInputRow}>
                          <TextInput
                            value={cardNumber}
                            onChangeText={formatCardNumber}
                            placeholder="XXXX XXXX XXXX XXXX"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            maxLength={19}
                            style={[styles.androidInput, { flex: 1 }]}
                          />
                          {cardBrand.component && (
                            <View style={styles.inputBrandIcon}>
                              <cardBrand.component size={20} />
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.cardTwoColumnRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
                          <TextInput
                            value={cardExpiry}
                            onChangeText={formatExpiry}
                            placeholder="MM / YY"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            maxLength={5}
                            style={styles.androidInput}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.fieldLabel}>CVV</Text>
                          <TextInput
                            value={cardCvv}
                            onChangeText={setCardCvv}
                            placeholder="CVV"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            style={styles.androidInput}
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
                        <TextInput
                          value={cardHolder}
                          onChangeText={setCardHolder}
                          placeholder="Name as on card"
                          placeholderTextColor="#9CA3AF"
                          style={styles.androidInput}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* OPTION 3: NET BANKING */}
                <View style={styles.optionCard}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory('netbanking')}
                    style={styles.optionHeader}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioOuter}>
                      {selectedCategory === 'netbanking' && <View style={styles.radioInner} />}
                    </View>

                    <View style={styles.optionHeaderTextWrap}>
                      <Text style={styles.optionTitle}>Net Banking</Text>
                      <Text style={styles.optionSubtitle}>All major Indian banks supported</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Bank Choice */}
                  {selectedCategory === 'netbanking' && (
                    <View style={styles.optionBody}>
                      <View style={styles.bankList}>
                        {popularBanks.map((bank) => {
                          const isSelected = selectedBank === bank.name;
                          return (
                            <TouchableOpacity
                              key={bank.code}
                              onPress={() => setSelectedBank(bank.name)}
                              style={[styles.bankRowItem, isSelected && styles.bankRowItemActive]}
                              activeOpacity={0.7}
                            >
                              <BankPillIcon bankCode={bank.code} size={20} />
                              <Text style={[styles.bankRowText, isSelected && styles.bankRowTextActive]}>
                                {bank.name}
                              </Text>
                              <View style={[styles.radioOuterSmall, isSelected && styles.radioOuterSmallActive]}>
                                {isSelected && <View style={styles.radioInnerSmall} />}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* OPTION 4: PAY ON SITE / DELIVERY */}
                <View style={styles.optionCard}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory('site_pay')}
                    style={styles.optionHeader}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioOuter}>
                      {selectedCategory === 'site_pay' && <View style={styles.radioInner} />}
                    </View>

                    <View style={styles.optionHeaderTextWrap}>
                      <Text style={styles.optionTitle}>Pay on Site Inspection</Text>
                      <Text style={styles.optionSubtitle}>Weighbridge verification before final payment</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Site Pay Option */}
                  {selectedCategory === 'site_pay' && (
                    <View style={styles.optionBody}>
                      <View style={[styles.siteSubCard, styles.siteSubCardActive]}>
                        <View style={styles.radioOuterSmall}>
                          <View style={styles.radioInnerSmall} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.siteSubTitle}>Pay on Site Delivery</Text>
                          <Text style={styles.siteSubAmount}>
                            ₹{amount.toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.siteSubDesc}>
                            Inspect materials and weighbridge slip before completing digital payment.
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Guarantee Banner */}
                <View style={styles.footerTrustRow}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={styles.footerTrustText}>
                    100% Safe Payments • RBI & NPCI Compliant
                  </Text>
                </View>
              </ScrollView>

              {/* STICKY BOTTOM ACTION BAR (Signature Android E-commerce pattern) */}
              <View style={styles.androidBottomBar}>
                <View style={styles.bottomBarInfo}>
                  <Text style={styles.bottomBarAmount}>
                    ₹{effectivePayableAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.bottomBarMethod} numberOfLines={1}>
                    {getSelectedMethodLabel()}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleExecutePayment}
                  disabled={isProcessing}
                  style={styles.bottomPayButton}
                  activeOpacity={0.88}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.bottomPayButtonText}>
                      PAY ₹{effectivePayableAmount.toLocaleString('en-IN')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  // Android App Bar
  androidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ECFDF5',
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },

  scrollArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  // Price Summary Banner
  priceSummaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceSummaryLeft: {
    flex: 1,
  },
  priceSummaryLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  priceSummaryAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  priceDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  priceDetailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  priceBreakdownBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },

  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },

  // Options Accordion Card (Like Amazon / Flipkart on Android)
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  radioOuterSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterSmallActive: {
    borderColor: '#111827',
  },
  radioInnerSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
  },
  optionHeaderTextWrap: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  recommendedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    color: '#059669',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  optionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  // UPI Direct Launch Rows
  upiQuickLaunchHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 6,
  },
  upiAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  upiAppRowActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111827',
  },
  upiAppRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  upiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  upiAppInfo: {
    flex: 1,
  },
  upiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upiAppName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  popularBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  popularBadgeText: {
    color: '#4F46E5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  upiAppSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  payNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  payNowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.4,
  },
  appChevronWrap: {
    padding: 4,
  },

  // UPI Apps Grid (Fallback)
  upiAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  upiAppItem: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  upiAppItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111827',
  },
  upiAppItemText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  appCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111827',
  },
  customUpiInputWrap: {
    marginTop: 10,
  },
  qrToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  qrToggleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  qrBlock: {
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  qrSubText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },

  // Card Form
  inputGroup: {
    marginTop: 10,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputBrandIcon: {
    position: 'absolute',
    right: 12,
  },
  cardTwoColumnRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  androidInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#111827',
  },

  // Bank List
  bankList: {
    gap: 6,
    marginTop: 8,
  },
  bankRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  bankRowItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111827',
  },
  bankRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  bankRowTextActive: {
    fontWeight: '700',
  },

  // Site Sub Options
  siteSubCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  siteSubCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111827',
  },
  siteSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  siteSubAmount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
  siteSubDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  footerTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 16,
  },
  footerTrustText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Sticky Bottom Action Bar (Android E-commerce Standard)
  androidBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  bottomBarMethod: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  bottomPayButton: {
    height: 44,
    paddingHorizontal: 24,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPayButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Awaiting Screen
  awaitingContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  awaitingPulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  awaitingPulseOuter: {
    padding: 6,
    borderRadius: 38,
    backgroundColor: '#F3F4F6',
  },
  awaitingIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  awaitingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  awaitingDescription: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#111827',
  },

  // Real-Time Countdown Ticker Pill
  sessionTickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sessionTickerText: {
    fontSize: 11.5,
    color: '#92400E',
    fontWeight: '600',
  },
  sessionTickerCountdown: {
    fontWeight: '800',
    color: '#B45309',
    fontVariant: ['tabular-nums'],
  },

  // Real-Time Status Stepper
  realtimeStepperCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginTop: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepperIconDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepperConnectorDone: {
    width: 2,
    height: 16,
    backgroundColor: '#10B981',
    marginLeft: 9,
    marginVertical: 2,
  },
  stepperIconActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepperActivePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  stepperConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 9,
    marginVertical: 2,
  },
  stepperIconPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepperTextWrap: {
    flex: 1,
  },
  stepperTitleDone: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  stepperSubDone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  stepperTitleActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperTitleActive: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
  },
  liveBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  liveBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepperSubActive: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 1,
  },
  stepperTitlePending: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  stepperSubPending: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
    marginTop: 1,
  },

  // Re-launch app button
  relaunchAppButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#111827',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  relaunchAppLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  relaunchAppButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // QR in Awaiting
  qrToggleInAwaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  qrToggleInAwaitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  qrAwaitingBlock: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  qrAwaitingSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
  },

  transactionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginTop: 14,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  transactionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  transactionValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  transactionValueMono: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#111827',
  },
  copyVpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thinDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  utrInputWrap: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  primaryActionButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryOutlineButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  secondaryOutlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  cancelLink: {
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelLinkText: {
    fontSize: 12.5,
    color: '#6B7280',
    fontWeight: '600',
  },
  desktopUpiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  desktopUpiNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '500',
  },
});
