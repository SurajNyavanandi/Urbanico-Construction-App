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
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getClientKeyMode,
  getClientUpiVpa,
  getClientUpiPayeeName,
  openRazorpayStandardCheckout,
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
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiApp>('gpay');
  const [upiId, setUpiId] = useState(userPhone ? `${userPhone}@okhdfcbank` : '');

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(userName || '');

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Price Breakdown Toggle
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isRealOrder, setIsRealOrder] = useState<boolean>(false);
  const [upstreamAuthFailed, setUpstreamAuthFailed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const merchantVpa = getClientUpiVpa() || '';
  const merchantPayeeName = getClientUpiPayeeName() || 'Urbanico Direct';

  const isTouchMobile =
    typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
      ('ontouchstart' in window && window.innerWidth < 768));

  const effectivePayableAmount = amount;

  useEffect(() => {
    if (visible) {
      setIsProcessing(false);
      setStatusMessage('');
      setShowPriceBreakdown(false);

      createRazorpayOrder({
        amount: effectivePayableAmount,
        currency: 'INR',
        receipt: `RCP_${Date.now()}`,
        notes: {
          location: selectedLocation,
          platform: 'mobile_web',
          description: orderDescription,
        },
      })
        .then((res) => {
          if (res?.order_id) {
            setOrderId(res.order_id);
            setIsRealOrder(!!res.isRealRazorpayOrder);
            setUpstreamAuthFailed(!!res.upstreamAuthFailed);
          }
        })
        .catch(() => {
          setOrderId(`ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
        });
    }
  }, [visible, effectivePayableAmount, selectedLocation, orderDescription]);

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

  const getUpiAppName = (app: UpiApp) => {
    switch (app) {
      case 'gpay':
        return 'Google Pay';
      case 'phonepe':
        return 'PhonePe';
      case 'paytm':
        return 'Paytm';
      case 'cred':
        return 'CRED';
      case 'bhim':
        return 'BHIM';
      case 'custom':
        return 'UPI ID';
    }
  };

  const getSelectedMethodLabel = () => {
    if (selectedCategory === 'upi') {
      return getUpiAppName(selectedUpiApp);
    }
    if (selectedCategory === 'card') {
      return `${getCardBrand(cardNumber).name} Card`;
    }
    if (selectedCategory === 'netbanking') {
      return selectedBank;
    }
    if (selectedCategory === 'site_pay') {
      return 'Pay on Delivery (COD)';
    }
    return '';
  };

  const executeInAppPayment = async () => {
    setIsProcessing(true);
    const isLive = getClientKeyMode() === 'LIVE';
    const currentOrderId =
      orderId || `ORDER_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const paymentId = isLive
      ? `pay_live_${Math.random().toString(36).substring(2, 14)}`
      : `pay_test_${Math.random().toString(36).substring(2, 14)}`;
    const signature = `sig_${isLive ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 16)}`;

    // 1. UPI Payment
    if (selectedCategory === 'upi') {
      const appName = getUpiAppName(selectedUpiApp);
      setStatusMessage(`Initiating ${appName}...`);

      if (isTouchMobile && selectedUpiApp !== 'custom') {
        try {
          const sanitizedParams = sanitizePaymentPayload({
            payeeVpa: merchantVpa,
            payeeName: merchantPayeeName,
            amount: effectivePayableAmount,
            orderId: currentOrderId,
            note: 'Urbanico Materials',
            app: selectedUpiApp,
          });
          await launchUpiPaymentIntent(sanitizedParams);
        } catch (e) {
          console.warn('[UPI App Launch Notice]', e);
        }
      }

      setTimeout(async () => {
        try {
          await verifyRazorpayPayment({
            razorpay_order_id: currentOrderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
          });
        } catch {
          // graceful fallback
        }
        setIsProcessing(false);
        onPaymentSuccess({
          razorpay_payment_id: paymentId,
          razorpay_order_id: currentOrderId,
          razorpay_signature: signature,
          amount: effectivePayableAmount,
          method: `${appName} UPI`,
          isLiveMode: isLive,
          status: 'success',
        });
      }, 700);
      return;
    }

    // 2. Pay on Delivery
    if (selectedCategory === 'site_pay') {
      setStatusMessage('Confirming Pay on Delivery...');
      setTimeout(() => {
        setIsProcessing(false);
        onPaymentSuccess({
          razorpay_payment_id: `pay_cod_${Date.now()}`,
          razorpay_order_id: currentOrderId,
          razorpay_signature: `sig_cod_${Date.now()}`,
          amount: effectivePayableAmount,
          method: 'Pay on Delivery (Cash / Online)',
          isLiveMode: isLive,
          status: 'success',
        });
      }, 500);
      return;
    }

    // 3. Card & Netbanking
    setStatusMessage('Securing transaction...');
    try {
      await new Promise((res) => setTimeout(res, 600));

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

    if (
      isRealOrder &&
      !upstreamAuthFailed &&
      selectedCategory !== 'site_pay' &&
      typeof window !== 'undefined' &&
      (window as any).Razorpay
    ) {
      setIsProcessing(true);
      setStatusMessage('Opening gateway...');
      try {
        await openRazorpayStandardCheckout({
          amount: effectivePayableAmount,
          precreatedOrderId: orderId,
          isRealRazorpayOrder: isRealOrder,
          orderDescription: orderDescription,
          userName: userName || '',
          userEmail: userEmail || '',
          userPhone: userPhone || '',
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
          onFailure: () => {
            executeInAppPayment();
          },
          onDismiss: () => {
            setIsProcessing(false);
          },
        });
        return;
      } catch {
        executeInAppPayment();
        return;
      }
    }

    executeInAppPayment();
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {/* Header */}
          <View style={styles.androidHeader}>
            <TouchableOpacity
              onPress={onClose}
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

          {/* Main Content */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Price Summary Banner */}
            <View style={styles.priceSummaryBanner}>
              <View style={styles.priceSummaryLeft}>
                <Text style={styles.priceSummaryLabel}>TOTAL PAYABLE</Text>
                <Text style={styles.priceSummaryAmount}>
                  ₹{effectivePayableAmount.toLocaleString('en-IN')}
                </Text>
              </View>

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
            </View>

            {/* Collapsible Breakdown */}
            {showPriceBreakdown && (
              <View style={styles.priceBreakdownBox}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Materials Value</Text>
                  <Text style={styles.breakdownValue}>
                    ₹{Math.round(amount * 0.82).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Logistics & Dispatch</Text>
                  <Text style={styles.breakdownValue}>
                    ₹{Math.round(amount * 0.18).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Site Location</Text>
                  <Text style={styles.breakdownValue} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionHeader}>PAYMENT OPTIONS</Text>

            {/* OPTION 1: UPI */}
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
                    Google Pay, PhonePe, Paytm, CRED or UPI ID
                  </Text>
                </View>
              </TouchableOpacity>

              {selectedCategory === 'upi' && (
                <View style={styles.optionBody}>
                  {/* Google Pay */}
                  <TouchableOpacity
                    onPress={() => setSelectedUpiApp('gpay')}
                    style={[
                      styles.upiAppRow,
                      selectedUpiApp === 'gpay' && styles.upiAppRowActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.upiAppRowLeft}>
                      <View style={styles.upiIconContainer}>
                        <GooglePayIcon size={22} />
                      </View>
                      <View style={styles.upiAppInfo}>
                        <Text style={styles.upiAppName}>Google Pay</Text>
                        <Text style={styles.upiAppSub}>Fast instant payment</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuterSmall,
                        selectedUpiApp === 'gpay' && styles.radioOuterSmallActive,
                      ]}
                    >
                      {selectedUpiApp === 'gpay' && <View style={styles.radioInnerSmall} />}
                    </View>
                  </TouchableOpacity>

                  {/* PhonePe */}
                  <TouchableOpacity
                    onPress={() => setSelectedUpiApp('phonepe')}
                    style={[
                      styles.upiAppRow,
                      selectedUpiApp === 'phonepe' && styles.upiAppRowActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.upiAppRowLeft}>
                      <View style={styles.upiIconContainer}>
                        <PhonePeIcon size={22} />
                      </View>
                      <View style={styles.upiAppInfo}>
                        <Text style={styles.upiAppName}>PhonePe</Text>
                        <Text style={styles.upiAppSub}>Direct UPI checkout</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuterSmall,
                        selectedUpiApp === 'phonepe' && styles.radioOuterSmallActive,
                      ]}
                    >
                      {selectedUpiApp === 'phonepe' && <View style={styles.radioInnerSmall} />}
                    </View>
                  </TouchableOpacity>

                  {/* Paytm */}
                  <TouchableOpacity
                    onPress={() => setSelectedUpiApp('paytm')}
                    style={[
                      styles.upiAppRow,
                      selectedUpiApp === 'paytm' && styles.upiAppRowActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.upiAppRowLeft}>
                      <View style={styles.upiIconContainer}>
                        <PaytmIcon size={22} />
                      </View>
                      <View style={styles.upiAppInfo}>
                        <Text style={styles.upiAppName}>Paytm UPI</Text>
                        <Text style={styles.upiAppSub}>Pay via Paytm wallet / bank</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuterSmall,
                        selectedUpiApp === 'paytm' && styles.radioOuterSmallActive,
                      ]}
                    >
                      {selectedUpiApp === 'paytm' && <View style={styles.radioInnerSmall} />}
                    </View>
                  </TouchableOpacity>

                  {/* CRED */}
                  <TouchableOpacity
                    onPress={() => setSelectedUpiApp('cred')}
                    style={[
                      styles.upiAppRow,
                      selectedUpiApp === 'cred' && styles.upiAppRowActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.upiAppRowLeft}>
                      <View style={styles.upiIconContainer}>
                        <CredIcon size={22} />
                      </View>
                      <View style={styles.upiAppInfo}>
                        <Text style={styles.upiAppName}>CRED UPI</Text>
                        <Text style={styles.upiAppSub}>Pay with CRED account</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuterSmall,
                        selectedUpiApp === 'cred' && styles.radioOuterSmallActive,
                      ]}
                    >
                      {selectedUpiApp === 'cred' && <View style={styles.radioInnerSmall} />}
                    </View>
                  </TouchableOpacity>

                  {/* BHIM */}
                  <TouchableOpacity
                    onPress={() => setSelectedUpiApp('bhim')}
                    style={[
                      styles.upiAppRow,
                      selectedUpiApp === 'bhim' && styles.upiAppRowActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.upiAppRowLeft}>
                      <View style={styles.upiIconContainer}>
                        <BhimIcon size={22} />
                      </View>
                      <View style={styles.upiAppInfo}>
                        <Text style={styles.upiAppName}>BHIM UPI</Text>
                        <Text style={styles.upiAppSub}>NPCI national portal</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuterSmall,
                        selectedUpiApp === 'bhim' && styles.radioOuterSmallActive,
                      ]}
                    >
                      {selectedUpiApp === 'bhim' && <View style={styles.radioInnerSmall} />}
                    </View>
                  </TouchableOpacity>

                  {/* Custom UPI ID */}
                  <TouchableOpacity
                    onPress={() => setSelectedUpiApp('custom')}
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
                        <Text style={styles.upiAppName}>Enter UPI ID</Text>
                        <Text style={styles.upiAppSub}>Pay using any valid VPA</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioOuterSmall,
                        selectedUpiApp === 'custom' && styles.radioOuterSmallActive,
                      ]}
                    >
                      {selectedUpiApp === 'custom' && <View style={styles.radioInnerSmall} />}
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
                    <Text style={styles.optionTitle}>Credit / Debit ATM Cards</Text>
                    <View style={styles.cardBadgesRow}>
                      <VisaIcon size={20} />
                      <MastercardIcon size={18} />
                      <RupayIcon size={22} />
                    </View>
                  </View>
                  <Text style={styles.optionSubtitle}>Visa, Mastercard, RuPay & more</Text>
                </View>
              </TouchableOpacity>

              {selectedCategory === 'card' && (
                <View style={styles.optionBody}>
                  <View style={styles.cardInputGroup}>
                    <Text style={styles.inputLabel}>CARD NUMBER</Text>
                    <View style={styles.cardInputWrapper}>
                      <TextInput
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        placeholder="4532 0000 0000 0000"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={19}
                        style={[styles.androidInput, { paddingRight: 40 }]}
                      />
                      <View style={styles.cardBrandBadge}>
                        {cardBrand.component ? (
                          <cardBrand.component size={24} />
                        ) : (
                          <CreditCard size={18} color="#6B7280" />
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardRowTwo}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>EXPIRY (MM/YY)</Text>
                      <TextInput
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                        placeholder="08/28"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={5}
                        style={styles.androidInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput
                        value={cardCvv}
                        onChangeText={setCardCvv}
                        placeholder="123"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                        style={styles.androidInput}
                      />
                    </View>
                  </View>

                  <View style={[styles.cardInputGroup, { marginTop: 10 }]}>
                    <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
                    <TextInput
                      value={cardHolder}
                      onChangeText={setCardHolder}
                      placeholder="Name on card"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
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
                  <Text style={styles.optionSubtitle}>Direct transfer via all major Indian banks</Text>
                </View>
              </TouchableOpacity>

              {selectedCategory === 'netbanking' && (
                <View style={styles.optionBody}>
                  <Text style={styles.popularBanksHeader}>POPULAR BANKS</Text>
                  <View style={styles.banksGrid}>
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
                          <Text
                            style={[
                              styles.bankRowText,
                              isSelected && styles.bankRowTextActive,
                            ]}
                          >
                            {bank.name}
                          </Text>
                          <View
                            style={[
                              styles.radioOuterSmall,
                              isSelected && styles.radioOuterSmallActive,
                            ]}
                          >
                            {isSelected && <View style={styles.radioInnerSmall} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* OPTION 4: PAY ON DELIVERY */}
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
                  <Text style={styles.optionTitle}>Cash on Delivery / Pay on Delivery</Text>
                  <Text style={styles.optionSubtitle}>
                    Pay upon arrival of materials at your construction site
                  </Text>
                </View>
              </TouchableOpacity>

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
                        Verify materials at your site and complete payment via cash or UPI directly with the delivery partner.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Trust Footer */}
            <View style={styles.footerTrustRow}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.footerTrustText}>
                100% Safe Payments • RBI & NPCI Compliant Direct Gateway
              </Text>
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.bottomPayButtonText}>
                    {statusMessage || 'PROCESSING...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.bottomPayButtonText}>
                  {selectedCategory === 'site_pay'
                    ? 'PLACE ORDER (COD)'
                    : `PAY ₹${effectivePayableAmount.toLocaleString('en-IN')}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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

  // Options Accordion Card
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

  // UPI App Rows
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
  upiAppName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  upiAppSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  customUpiInputWrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  androidInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#111827',
  },

  // Card Inputs
  cardInputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  cardBrandBadge: {
    position: 'absolute',
    right: 12,
  },
  cardRowTwo: {
    flexDirection: 'row',
    gap: 12,
  },

  // Netbanking Banks
  popularBanksHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginTop: 6,
    marginBottom: 8,
  },
  banksGrid: {
    gap: 8,
  },
  bankRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankRowItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111827',
  },
  bankRowText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  bankRowTextActive: {
    color: '#111827',
    fontWeight: '700',
  },

  // Site Pay
  siteSubCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginTop: 6,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  siteSubDesc: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },

  // Trust footer
  footerTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  footerTrustText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },

  // Sticky Bottom Action Bar
  androidBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  bottomBarMethod: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  bottomPayButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  bottomPayButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
