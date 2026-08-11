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
} from 'react-native';
import {
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  FlaskConical,
} from 'lucide-react-native';

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  amount: number;
  method: string;
  status: 'success' | 'failed';
  error?: string;
}

interface RazorpayModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number; // in Rupees
  orderDescription?: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  onPaymentSuccess: (result: RazorpayPaymentResult) => void;
  onPaymentFailure?: (error: string) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  visible,
  onClose,
  amount,
  orderDescription = 'Construction Materials & Services Order',
  userEmail = 'rajesh.m@urbanico.in',
  userPhone = '9876543210',
  userName = 'Rajesh Kumar',
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [simulatedStatus, setSimulatedStatus] = useState<'success' | 'failure'>('success');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState(userName);

  // UPI State
  const [upiId, setUpiId] = useState('success@razorpay');

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Key ID from environment
  const razorpayKeyId =
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID)) ||
    'rzp_test_SeXkFKSXUivyDm';

  // Initialize order on modal open
  useEffect(() => {
    if (visible) {
      createOrder();
    }
  }, [visible, amount]);

  const createOrder = async () => {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      const data = await response.json();
      if (data.success && data.order) {
        setOrderId(data.order.id);
      } else {
        setOrderId(`order_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      }
    } catch {
      setOrderId(`order_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    }
  };

  const handlePayNow = async () => {
    setIsProcessing(true);

    try {
      // Step 1: Request verification from server endpoint
      const currentOrderId = orderId || `order_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 14)}`;
      const mockSignature = `sig_${Math.random().toString(36).substring(2, 16)}`;

      // Simulate network latency for payment gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1400));

      if (simulatedStatus === 'failure') {
        setIsProcessing(false);
        if (onPaymentFailure) {
          onPaymentFailure('Payment declined by issuing bank (Test Mode Simulation)');
        }
        return;
      }

      // Step 2: Call verify API endpoint
      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: currentOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        }),
      });

      const verifyData = await verifyRes.json();

      setIsProcessing(false);
      onPaymentSuccess({
        razorpay_payment_id: mockPaymentId,
        razorpay_order_id: currentOrderId,
        razorpay_signature: mockSignature,
        amount,
        method: selectedMethod.toUpperCase(),
        status: verifyData.success ? 'success' : 'failed',
      });
    } catch (err: any) {
      setIsProcessing(false);
      onPaymentSuccess({
        razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 14)}`,
        razorpay_order_id: orderId || `order_TEST${Date.now()}`,
        razorpay_signature: `sig_TEST`,
        amount,
        method: selectedMethod.toUpperCase(),
        status: 'success',
      });
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Razorpay Brand Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.brandGroup}>
                <View style={styles.razorpayLogoBox}>
                  <Text style={styles.razorpayR}>R</Text>
                </View>
                <View>
                  <Text style={styles.merchantName}>Urbanico Supply</Text>
                  <Text style={styles.orderDesc} numberOfLines={1}>
                    {orderDescription}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            {/* Test Mode Badge & Key ID */}
            <View style={styles.testBadgeRow}>
              <View style={styles.testBadge}>
                <FlaskConical size={12} color="#D97706" />
                <Text style={styles.testBadgeText}>RAZORPAY TEST MODE</Text>
              </View>
              <Text style={styles.keyText}>Key: {razorpayKeyId}</Text>
            </View>

            {/* Total Amount Pill */}
            <View style={styles.amountPill}>
              <Text style={styles.amountLabel}>Total Payable Amount</Text>
              <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Simulation Control Switcher */}
            <View style={styles.simControlCard}>
              <Text style={styles.simTitle}>Gateway Test Simulation</Text>
              <View style={styles.simToggleRow}>
                <TouchableOpacity
                  onPress={() => setSimulatedStatus('success')}
                  style={[
                    styles.simToggleBtn,
                    simulatedStatus === 'success' && styles.simToggleBtnActiveSuccess,
                  ]}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={14} color={simulatedStatus === 'success' ? '#FFFFFF' : '#10B981'} />
                  <Text
                    style={[
                      styles.simToggleText,
                      simulatedStatus === 'success' && styles.simToggleTextActive,
                    ]}
                  >
                    Simulate Success
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSimulatedStatus('failure')}
                  style={[
                    styles.simToggleBtn,
                    simulatedStatus === 'failure' && styles.simToggleBtnActiveFailure,
                  ]}
                  activeOpacity={0.8}
                >
                  <AlertCircle size={14} color={simulatedStatus === 'failure' ? '#FFFFFF' : '#EF4444'} />
                  <Text
                    style={[
                      styles.simToggleText,
                      simulatedStatus === 'failure' && styles.simToggleTextActive,
                    ]}
                  >
                    Simulate Failure
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Method Tabs */}
            <View style={styles.methodsRow}>
              <TouchableOpacity
                onPress={() => setSelectedMethod('upi')}
                style={[styles.methodTab, selectedMethod === 'upi' && styles.methodTabActive]}
              >
                <QrCode size={16} color={selectedMethod === 'upi' ? '#2563EB' : '#64748B'} />
                <Text style={[styles.methodTabText, selectedMethod === 'upi' && styles.methodTabTextActive]}>
                  UPI / QR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedMethod('card')}
                style={[styles.methodTab, selectedMethod === 'card' && styles.methodTabActive]}
              >
                <CreditCard size={16} color={selectedMethod === 'card' ? '#2563EB' : '#64748B'} />
                <Text style={[styles.methodTabText, selectedMethod === 'card' && styles.methodTabTextActive]}>
                  Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedMethod('netbanking')}
                style={[styles.methodTab, selectedMethod === 'netbanking' && styles.methodTabActive]}
              >
                <Building2 size={16} color={selectedMethod === 'netbanking' ? '#2563EB' : '#64748B'} />
                <Text style={[styles.methodTabText, selectedMethod === 'netbanking' && styles.methodTabTextActive]}>
                  NetBanking
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedMethod('wallet')}
                style={[styles.methodTab, selectedMethod === 'wallet' && styles.methodTabActive]}
              >
                <Wallet size={16} color={selectedMethod === 'wallet' ? '#2563EB' : '#64748B'} />
                <Text style={[styles.methodTabText, selectedMethod === 'wallet' && styles.methodTabTextActive]}>
                  Wallet
                </Text>
              </TouchableOpacity>
            </View>

            {/* Method Specific Form */}
            {selectedMethod === 'upi' && (
              <View style={styles.methodFormCard}>
                <Text style={styles.formTitle}>Instant UPI Payment</Text>
                <Text style={styles.formSubtitle}>Pay directly using any UPI App</Text>

                <View style={styles.upiAppsRow}>
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                    <TouchableOpacity key={app} style={styles.upiAppBadge} activeOpacity={0.8}>
                      <Text style={styles.upiAppText}>{app}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Or Enter VPA / UPI ID</Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="username@upi"
                  style={styles.textInput}
                />
              </View>
            )}

            {selectedMethod === 'card' && (
              <View style={styles.methodFormCard}>
                <Text style={styles.formTitle}>Credit / Debit Card</Text>

                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="4111 1111 1111 1111"
                  keyboardType="numeric"
                  style={styles.textInput}
                />

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                    <TextInput
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      placeholder="12/28"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>CVV / CVC</Text>
                    <TextInput
                      value={cardCvv}
                      onChangeText={setCardCvv}
                      placeholder="123"
                      secureTextEntry
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  placeholder="Rajesh Kumar"
                  style={styles.textInput}
                />
              </View>
            )}

            {selectedMethod === 'netbanking' && (
              <View style={styles.methodFormCard}>
                <Text style={styles.formTitle}>Select Your Bank</Text>
                <View style={styles.bankGrid}>
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB'].map(
                    (bank) => (
                      <TouchableOpacity
                        key={bank}
                        onPress={() => setSelectedBank(bank)}
                        style={[
                          styles.bankItem,
                          selectedBank === bank && styles.bankItemActive,
                        ]}
                      >
                        <Building2 size={16} color={selectedBank === bank ? '#2563EB' : '#64748B'} />
                        <Text
                          style={[
                            styles.bankItemText,
                            selectedBank === bank && styles.bankItemTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {bank}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            )}

            {selectedMethod === 'wallet' && (
              <View style={styles.methodFormCard}>
                <Text style={styles.formTitle}>Select Digital Wallet</Text>
                {['MobiKwik', 'Freecharge', 'Airtel Money', 'JioMoney'].map((walletName) => (
                  <TouchableOpacity key={walletName} style={styles.walletRow}>
                    <Wallet size={18} color="#2563EB" />
                    <Text style={styles.walletText}>{walletName}</Text>
                    <ChevronRight size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Payer Info Summary */}
            <View style={styles.payerInfoCard}>
              <Text style={styles.payerInfoText}>
                Billing to: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{userName}</Text> ({userPhone})
              </Text>
            </View>

            {/* Razorpay 256-bit Security Tag */}
            <View style={styles.securityTagRow}>
              <Lock size={12} color="#059669" />
              <ShieldCheck size={12} color="#059669" />
              <Text style={styles.securityTagText}>
                256-bit SSL Encrypted • Razorpay Certified Payment Gateway
              </Text>
            </View>
          </ScrollView>

          {/* Pay Button Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handlePayNow}
              disabled={isProcessing}
              style={[
                styles.payButton,
                simulatedStatus === 'failure' && { backgroundColor: '#DC2626' },
              ]}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <View style={styles.processingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.payButtonText}>Verifying with Razorpay...</Text>
                </View>
              ) : (
                <Text style={styles.payButtonText}>
                  {simulatedStatus === 'failure'
                    ? `Test Fail Payment • ₹${amount.toLocaleString('en-IN')}`
                    : `Pay ₹${amount.toLocaleString('en-IN')} via Razorpay Test`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    maxHeight: '90%',
  },
  header: {
    backgroundColor: '#072654', // Authentic Razorpay Navy
    padding: 18,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  razorpayLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  razorpayR: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    fontStyle: 'italic',
  },
  merchantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  orderDesc: {
    color: '#94A3B8',
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  testBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  keyText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  amountPill: {
    marginTop: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  body: {
    padding: 16,
  },
  simControlCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  simTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  simToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  simToggleBtnActiveSuccess: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  simToggleBtnActiveFailure: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  simToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  simToggleTextActive: {
    color: '#FFFFFF',
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  methodTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  methodTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  methodTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  methodTabTextActive: {
    color: '#2563EB',
  },
  methodFormCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  upiAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  upiAppBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  upiAppText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  bankItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  bankItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  bankItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bankItemTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  walletText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    marginLeft: 10,
  },
  payerInfoCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  payerInfoText: {
    fontSize: 11,
    color: '#475569',
  },
  securityTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  securityTagText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  payButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
