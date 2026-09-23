import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, ShieldCheck, CreditCard, Smartphone, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { POPULAR_UPI_HANDLES } from '../../utils/paymentMethodsHelper';
import { SavedPaymentMethod } from '../../types';

export interface AddPaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveUpi: (vpa: string) => Promise<{ success: boolean; method?: SavedPaymentMethod; error?: string }>;
  onSaveCard: (card: {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
  }) => Promise<{ success: boolean; error?: string }>;
  isVerifyingUpi?: boolean;
  isVerifyingCard?: boolean;
}

export const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  visible,
  onClose,
  onSaveUpi,
  onSaveCard,
  isVerifyingUpi = false,
  isVerifyingCard = false,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'upi' | 'card'>('upi');

  // UPI Form State
  const [upiVpa, setUpiVpa] = useState('');
  const [upiError, setUpiError] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);

  // Card Number formatting (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
    setCardError(null);
  };

  // Card Expiry formatting (MM/YY)
  const handleCardExpiryChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
    setCardError(null);
  };

  const handleUpiSubmit = async () => {
    if (!upiVpa.trim()) {
      setUpiError('Please enter your UPI ID');
      return;
    }
    setUpiError(null);
    const res = await onSaveUpi(upiVpa.trim());
    if (res.success) {
      setUpiVpa('');
      onClose();
    } else {
      setUpiError(res.error || 'Verification failed');
    }
  };

  const handleCardSubmit = async () => {
    setCardError(null);
    const res = await onSaveCard({
      cardNumber,
      cardHolder,
      expiry: cardExpiry,
      cvv: cardCvv,
    });
    if (res.success) {
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvv('');
      onClose();
    } else {
      setCardError(res.error || 'Verification failed');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Add & Verify Payment Method
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16, gap: 14 }}>
            {/* Tab Switcher */}
            <View style={[styles.tabBar, { backgroundColor: theme.surfaceSecondary }]}>
              <TouchableOpacity
                onPress={() => setActiveTab('upi')}
                style={[
                  styles.tabItem,
                  activeTab === 'upi' && [styles.tabItemActive, { backgroundColor: theme.surface }],
                ]}
                activeOpacity={0.8}
              >
                <Smartphone size={14} color={activeTab === 'upi' ? theme.primary : theme.textSecondary} />
                <Text
                  style={[
                    styles.tabItemText,
                    { color: activeTab === 'upi' ? theme.textPrimary : theme.textSecondary },
                    activeTab === 'upi' && { fontWeight: '700' },
                  ]}
                >
                  UPI ID (VPA)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('card')}
                style={[
                  styles.tabItem,
                  activeTab === 'card' && [styles.tabItemActive, { backgroundColor: theme.surface }],
                ]}
                activeOpacity={0.8}
              >
                <CreditCard size={14} color={activeTab === 'card' ? theme.primary : theme.textSecondary} />
                <Text
                  style={[
                    styles.tabItemText,
                    { color: activeTab === 'card' ? theme.textPrimary : theme.textSecondary },
                    activeTab === 'card' && { fontWeight: '700' },
                  ]}
                >
                  Credit / Debit Card
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: UPI Form */}
            {activeTab === 'upi' && (
              <View style={{ gap: 10 }}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Enter UPI ID / VPA</Text>
                <TextInput
                  value={upiVpa}
                  onChangeText={(t) => {
                    setUpiVpa(t);
                    setUpiError(null);
                  }}
                  placeholder="e.g. 9848012345@okhdfcbank"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: upiError ? '#EF4444' : theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
                {Boolean(upiError) && <Text style={styles.errorText}>⚠️ {upiError}</Text>}

                {/* Popular Handles */}
                <View>
                  <Text style={[styles.microLabel, { color: theme.textMuted }]}>
                    Supported Bank Handles:
                  </Text>
                  <View style={styles.handlesGrid}>
                    {POPULAR_UPI_HANDLES.map((handle) => (
                      <TouchableOpacity
                        key={handle}
                        onPress={() => {
                          const prefix = upiVpa.includes('@') ? upiVpa.split('@')[0] : upiVpa;
                          setUpiVpa(`${prefix || '9848012345'}${handle}`);
                          setUpiError(null);
                        }}
                        style={[styles.handleChip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.handleChipText, { color: theme.primary }]}>{handle}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleUpiSubmit}
                  disabled={isVerifyingUpi || !upiVpa.trim()}
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: isVerifyingUpi || !upiVpa.trim() ? 0.6 : 1,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  {isVerifyingUpi ? (
                    <View style={styles.btnInner}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Verifying with NPCI...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <ShieldCheck size={16} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Verify & Save UPI</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Tab 2: Card Form */}
            {activeTab === 'card' && (
              <View style={{ gap: 10 }}>
                {/* Info Box */}
                <View style={[styles.infoBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <ShieldCheck size={14} color="#2563EB" />
                  <Text style={{ fontSize: 11, color: '#1E40AF', flex: 1, lineHeight: 15 }}>
                    ₹1 refundable authorization charge is processed via Razorpay to verify card ownership under RBI tokenization rules.
                  </Text>
                </View>

                {/* Card Number */}
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Card Number</Text>
                  <TextInput
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    placeholder="4111 2222 3333 4444"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    maxLength={19}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: cardError ? '#EF4444' : theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                {/* Card Holder */}
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Cardholder Name</Text>
                  <TextInput
                    value={cardHolder}
                    onChangeText={(t) => {
                      setCardHolder(t);
                      setCardError(null);
                    }}
                    placeholder="NAME AS ON CARD"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="characters"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                {/* Expiry & CVV */}
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Expiry (MM/YY)</Text>
                    <TextInput
                      value={cardExpiry}
                      onChangeText={handleCardExpiryChange}
                      placeholder="12/28"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      maxLength={5}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CVV</Text>
                    <TextInput
                      value={cardCvv}
                      onChangeText={(t) => {
                        setCardCvv(t.replace(/\D/g, '').slice(0, 4));
                        setCardError(null);
                      }}
                      placeholder="•••"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={4}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceSecondary,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                        },
                      ]}
                    />
                  </View>
                </View>

                {Boolean(cardError) && <Text style={styles.errorText}>⚠️ {cardError}</Text>}

                <TouchableOpacity
                  onPress={handleCardSubmit}
                  disabled={isVerifyingCard || !cardNumber || !cardHolder || !cardExpiry || !cardCvv}
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity:
                        isVerifyingCard || !cardNumber || !cardHolder || !cardExpiry || !cardCvv
                          ? 0.6
                          : 1,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  {isVerifyingCard ? (
                    <View style={styles.btnInner}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Authorizing ₹1 Charge...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <Sparkles size={15} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Verify & Save Card (₹1 Refundable)</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabItemText: {
    fontSize: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  microLabel: {
    fontSize: 10.5,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  handlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  handleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  handleChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
