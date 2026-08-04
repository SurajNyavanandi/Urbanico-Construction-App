import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, ShieldCheck, Check, Smartphone, Lock, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface AuthScreenProps {
  initialStep?: 'mobile' | 'otp';
  onSuccessAuth: (phoneNumber: string) => void;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialStep = 'mobile',
  onSuccessAuth,
  onBack,
}) => {
  const { theme, typography } = useTheme();
  const [step, setStep] = useState<'mobile' | 'otp'>(initialStep);
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(30);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = () => {
    if (phoneNumber.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMessage(null);
    setStep('otp');
    setTimer(30);
    setTimeout(() => {
      inputRefs[0].current?.focus();
    }, 150);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    const fullOtp = newDigits.join('');
    if (fullOtp.length === 6) {
      verifyOtpCode(fullOtp);
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verifyOtpCode = (code: string) => {
    if (code === '123456' || code.length === 6) {
      setIsSuccess(true);
      setErrorMessage(null);
      setTimeout(() => {
        onSuccessAuth(`+91 ${phoneNumber}`);
      }, 800);
    } else {
      setErrorMessage('Invalid OTP. Please enter 6-digit OTP code');
      setIsSuccess(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      {/* Top Fixed Header Bar */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'otp') setStep('mobile');
            else onBack();
          }}
          style={[styles.backBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={theme.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[styles.headerNavTitle, { color: theme.textSecondary }]}>
          {step === 'mobile' ? 'Sign In / Register' : 'OTP Verification'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Modern Mobile App Brand Hero Section */}
        <View style={styles.brandHeroCard}>
          <View style={[styles.heroIconCircle, { backgroundColor: theme.primaryLight }]}>
            {step === 'mobile' ? (
              <Smartphone size={32} color={theme.primaryDark} strokeWidth={2} />
            ) : (
              <Lock size={32} color={theme.primaryDark} strokeWidth={2} />
            )}
          </View>

          <Text style={[styles.brandTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
            {step === 'mobile' ? 'Welcome to Urbanico' : 'Verify Mobile OTP'}
          </Text>
          <Text style={[styles.brandSubTitle, { color: theme.textSecondary }]}>
            {step === 'mobile'
              ? 'On-Demand Construction Material & Equipment Supply'
              : `Enter the 6-digit code sent via SMS to +91 ${phoneNumber}`}
          </Text>
        </View>

        {/* Step 1: Mobile Input Screen */}
        {step === 'mobile' ? (
          <View style={styles.stepContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mobile Phone Number</Text>
              <View style={[styles.phoneInputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <View style={[styles.countryCodeBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <Text style={[styles.countryCodeText, { color: theme.textPrimary }]}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(val) => setPhoneNumber(val.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.phoneInput, { color: theme.textPrimary }]}
                  autoFocus
                />
              </View>
            </View>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSendOtp}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get OTP Code</Text>
            </TouchableOpacity>

            <View style={styles.termsRow}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={[styles.termsText, { color: theme.textMuted }]}>
                100% Encrypted • Instant GST Invoicing Enabled
              </Text>
            </View>
          </View>
        ) : (
          /* Step 2: OTP Verification Screen */
          <View style={styles.stepContainer}>
            {/* 6-Digit OTP Box Inputs */}
            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(index, val)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  style={[
                    styles.otpBox,
                    isSuccess
                      ? styles.otpSuccess
                      : digit
                      ? { borderColor: theme.primary, backgroundColor: theme.primaryLight, color: theme.primaryDark }
                      : { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary },
                  ]}
                />
              ))}
            </View>

            {/* Quick Helper for Testing */}
            <TouchableOpacity
              onPress={() => {
                setOtpDigits(['1', '2', '3', '4', '5', '6']);
                verifyOtpCode('123456');
              }}
              activeOpacity={0.7}
              style={[styles.autofillCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
            >
              <Sparkles size={14} color={theme.primary} />
              <Text style={[styles.autofillText, { color: theme.primary }]}>
                Tap here to auto-fill demo OTP (123456)
              </Text>
            </TouchableOpacity>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {isSuccess && (
              <View style={styles.successBox}>
                <Check size={18} color="#047857" strokeWidth={3} />
                <Text style={styles.successText}>OTP Verified! Logging in...</Text>
              </View>
            )}

            {/* Resend Timer */}
            <View style={styles.resendContainer}>
              {timer > 0 ? (
                <Text style={[styles.resendTimerText, { color: theme.textSecondary }]}>
                  Resend code in <Text style={[styles.boldTimerText, { color: theme.textPrimary }]}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setTimer(30);
                    setErrorMessage('New OTP code dispatched to mobile!');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.resendCtaText, { color: theme.primary }]}>Resend OTP Code</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => verifyOtpCode(otpDigits.join(''))}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <ShieldCheck size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Verify & Proceed</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Minimal Footer */}
      <View style={styles.footerContainer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Urbanico Construction Supply • Standard Mobile Auth
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNavTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  brandHeroCard: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  heroIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  brandSubTitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  stepContainer: {
    width: '100%',
    maxWidth: 340,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 6,
    gap: 10,
  },
  countryCodeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 4,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  termsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
  },
  otpSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    color: '#065F46',
  },
  autofillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  autofillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendTimerText: {
    fontSize: 12,
  },
  boldTimerText: {
    fontWeight: '800',
  },
  resendCtaText: {
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  footerContainer: {
    paddingBottom: 16,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
  },
});
