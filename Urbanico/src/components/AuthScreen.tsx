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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import { BRAND_LOGO_URL } from '../constants';
import { ShimmerImage } from './common/ShimmerImage';
import { apiService } from '../services/apiService';
import { useTheme, useTypography } from '../theme';

const DEFAULT_DEV_MOBILE = '';
const DEFAULT_DEV_OTP = '261125';

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
  const { theme } = useTheme();
  const typography = useTypography();
  const [step, setStep] = useState<'mobile' | 'otp'>(initialStep);
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_DEV_MOBILE);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(30);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState<boolean>(false);
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);

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
        setTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 10;

  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMessage(null);
    setIsSending(true);

    try {
      await apiService.sendAuthOtp(cleanPhone);
    } catch {
      // Continue with fixed dev OTP
    }

    setIsSending(false);
    setStep('otp');
    setTimer(30);
    setOtpDigits(DEFAULT_DEV_OTP.split(''));
    setTimeout(() => {
      inputRefs[5]?.current?.focus();
    }, 250);
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      const newDigits = [...otpDigits];
      const chars = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setOtpDigits(newDigits);
      setErrorMessage(null);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs[nextIdx]?.current?.focus();
      setActiveOtpIndex(nextIdx);
      if (chars.length === 6) {
        verifyOtpCode(newDigits.join(''));
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (clean && index < 5) {
      inputRefs[index + 1]?.current?.focus();
      setActiveOtpIndex(index + 1);
    }

    if (newDigits.every((d) => d !== '')) {
      verifyOtpCode(newDigits.join(''));
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs[index - 1]?.current?.focus();
        setActiveOtpIndex(index - 1);
      }
    }
  };

  const verifyOtpCode = async (code: string) => {
    const entered = code.trim();
    if (entered !== DEFAULT_DEV_OTP) {
      setErrorMessage(`Invalid OTP. Please enter ${DEFAULT_DEV_OTP}.`);
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await apiService.verifyAuthOtp(cleanPhone, entered);
      setIsVerifying(false);
      onSuccessAuth(cleanPhone);
    } catch {
      setIsVerifying(false);
      onSuccessAuth(cleanPhone);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(30);
    setOtpDigits(DEFAULT_DEV_OTP.split(''));
    setErrorMessage(null);
    try {
      await apiService.sendAuthOtp(cleanPhone);
    } catch {}
  };

  const isOtpComplete = otpDigits.every((d) => d !== '');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screenContainer, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          {step === 'otp' ? (
            <TouchableOpacity
              onPress={() => {
                setStep('mobile');
                setErrorMessage(null);
              }}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onBack}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          )}

          {/* Centered Brand Logo */}
          <View style={styles.logoWrapper}>
            <ShimmerImage
              source={{ uri: BRAND_LOGO_URL }}
              style={styles.brandLogo}
              resizeMode="contain"
              preset="logo"
              borderRadius={0}
            />
          </View>

          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <X size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {step === 'mobile' ? (
          /* STEP 1: Mobile entry */
          <View style={styles.mainCard}>
            <Text style={[styles.headingTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>Log in or Sign up</Text>
            <Text style={[styles.subHeading, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
              Enter your mobile number to continue
            </Text>

            {/* Outlined Notched Input Box */}
            <View
              style={[
                styles.inputFieldContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: isPhoneFocused ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={[styles.floatingLabelWrapper, { backgroundColor: theme.surface }]}>
                <Text style={[styles.fieldFloatingLabel, { color: isPhoneFocused ? theme.primary : theme.textSecondary, fontFamily: typography.fontFamily }]}>
                  Enter 10-digit mobile no.
                </Text>
              </View>
              <View style={styles.phoneInputRow}>
                <Text style={[styles.countryCode, { color: theme.textPrimary }]}>+91</Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setErrorMessage(null);
                  }}
                  placeholder="96666 35009"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[styles.phoneTextInput, { color: theme.textPrimary }]}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                />
              </View>
            </View>

            {Boolean(errorMessage) && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            {/* Get OTP Button */}
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={!isPhoneValid || isSending}
              activeOpacity={0.85}
              style={[
                styles.actionButton,
                isPhoneValid
                  ? { backgroundColor: theme.buttonBg || theme.primary }
                  : { backgroundColor: theme.surfaceSecondary },
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={theme.buttonText || '#FFFFFF'} />
              ) : (
                <Text
                  style={[
                    styles.actionButtonText,
                    isPhoneValid
                      ? { color: theme.buttonText || '#FFFFFF', fontFamily: typography.fontFamilyHeading }
                      : { color: theme.textMuted, fontFamily: typography.fontFamilyHeading },
                  ]}
                >
                  Get OTP
                </Text>
              )}
            </TouchableOpacity>

            {/* Legal Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Text style={[styles.disclaimerText, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
                By entering this site, you agree to the{'\n'}
                <Text
                  style={[styles.disclaimerLink, { color: theme.primary }]}
                  onPress={() => Linking.openURL('https://urbanico.in/terms')}
                >
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text
                  style={[styles.disclaimerLink, { color: theme.primary }]}
                  onPress={() => Linking.openURL('https://urbanico.in/privacy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        ) : (
          /* STEP 2: OTP Verification */
          <View style={styles.mainCardCenter}>
            <Text style={[styles.otpHeadingTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>Enter OTP</Text>
            <Text style={[styles.otpSubHeading, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
              Sent to +91 {phoneNumber || DEFAULT_DEV_MOBILE}
            </Text>

            <View style={styles.otpDevBadge}>
              <Text style={styles.otpDevBadgeText}>For any mobile number, OTP is {DEFAULT_DEV_OTP}</Text>
            </View>

            {/* 6 OTP boxes */}
            <View style={styles.otpBoxesRow}>
              {otpDigits.map((digit, idx) => {
                const isFocused = activeOtpIndex === idx;
                const isFilled = !!digit;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isFocused ? theme.primary : (isFilled ? theme.primary : theme.border),
                      },
                    ]}
                  >
                    <TextInput
                      ref={inputRefs[idx]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(idx, val)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(idx, nativeEvent.key)
                      }
                      onFocus={() => setActiveOtpIndex(idx)}
                      keyboardType="number-pad"
                      maxLength={6}
                      selectTextOnFocus
                      style={[styles.otpInputText, { color: theme.textPrimary }]}
                    />
                  </View>
                );
              })}
            </View>

            {/* Resend Timer */}
            <View style={styles.resendContainer}>
              {timer > 0 ? (
                <Text style={[styles.timerText, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
                  Resend in 00:{timer < 10 ? `0${timer}` : timer}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={[styles.resendActionLink, { color: theme.primary, fontFamily: typography.fontFamilyHeading }]}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {Boolean(errorMessage) && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              onPress={() => verifyOtpCode(otpDigits.join(''))}
              disabled={!isOtpComplete || isVerifying}
              activeOpacity={0.85}
              style={[
                styles.actionButton,
                isOtpComplete
                  ? { backgroundColor: theme.buttonBg || theme.primary }
                  : { backgroundColor: theme.surfaceSecondary },
                { marginTop: 20 },
              ]}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color={theme.buttonText || '#FFFFFF'} />
              ) : (
                <Text
                  style={[
                    styles.actionButtonText,
                    isOtpComplete
                      ? { color: theme.buttonText || '#FFFFFF', fontFamily: typography.fontFamilyHeading }
                      : { color: theme.textMuted, fontFamily: typography.fontFamilyHeading },
                  ]}
                >
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 52,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 48,
    height: 32,
  },
  mainCard: {
    paddingTop: 10,
  },
  mainCardCenter: {
    paddingTop: 10,
    alignItems: 'center',
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 14,
    color: '#707072',
    marginBottom: 24,
  },
  otpHeadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  otpSubHeading: {
    fontSize: 14,
    color: '#707072',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpDevBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  otpDevBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C2410C',
    textAlign: 'center',
  },
  inputFieldContainer: {
    borderWidth: 1.2,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  inputFieldFocused: {
    borderColor: '#FCB026',
  },
  floatingLabelWrapper: {
    position: 'absolute',
    top: -10,
    left: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  fieldFloatingLabel: {
    fontSize: 11,
    color: '#707072',
    fontWeight: '500',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  actionButtonActive: {
    backgroundColor: '#FCB026',
  },
  actionButtonDisabled: {
    backgroundColor: '#EFEFEF',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionButtonTextActive: {
    color: '#18181B',
  },
  actionButtonTextDisabled: {
    color: '#8E8E93',
  },
  disclaimerContainer: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#707072',
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    color: '#FCB026',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    width: '100%',
  },
  otpBox: {
    width: 44,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: '#FCB026',
  },
  otpBoxFilled: {
    borderColor: '#FCB026',
    backgroundColor: '#FFFDF5',
  },
  otpInputText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  resendContainer: {
    marginVertical: 6,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    color: '#707072',
    fontWeight: '500',
  },
  resendActionLink: {
    fontSize: 13,
    color: '#FCB026',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

