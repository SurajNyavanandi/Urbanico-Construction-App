import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { BRAND_LOGO_URL } from '../constants';
import { ShimmerImage } from './common/ShimmerImage';

const DEFAULT_DEV_MOBILE = '9666635009';
const DEFAULT_DEV_OTP = '261125';

interface NikeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessAuth: (phoneNumber: string) => void;
  initialStep?: 'mobile' | 'otp';
}

export const NikeAuthModal: React.FC<NikeAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessAuth,
  initialStep = 'mobile',
}) => {
  const [step, setStep] = useState<'mobile' | 'otp'>(initialStep);
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_DEV_MOBILE);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(30);
  const timerTargetRef = useRef<number>(0);
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
    if (isOpen) {
      setStep(initialStep);
      setErrorMessage(null);
      if (!phoneNumber) {
        setPhoneNumber(DEFAULT_DEV_MOBILE);
      }
    }
  }, [isOpen, initialStep]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isOpen && step === 'otp' && timerTargetRef.current > Date.now()) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((timerTargetRef.current - Date.now()) / 1000));
        setTimer(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 10;

  const handleSendOtp = () => {
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMessage(null);
    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      setStep('otp');
      timerTargetRef.current = Date.now() + 30000;
      setTimer(30);
      // Pre-fill demo OTP 261125 for seamless dev testing while allowing user to change/type any OTP
      const demoOtpArr = DEFAULT_DEV_OTP.split('');
      setOtpDigits(demoOtpArr);
      setTimeout(() => {
        inputRefs[5]?.current?.focus();
      }, 250);
    }, 400);
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      // Paste handling
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

  const verifyOtpCode = (code: string) => {
    setIsVerifying(true);
    setErrorMessage(null);
    // Dev requirement: Accept any OTP entered by user as successful OTP
    setTimeout(() => {
      setIsVerifying(false);
      onSuccessAuth(phoneNumber || DEFAULT_DEV_MOBILE);
      onClose();
    }, 550);
  };

  const handleResend = () => {
    if (timer > 0) return;
    timerTargetRef.current = Date.now() + 30000;
    setTimer(30);
    setOtpDigits(DEFAULT_DEV_OTP.split(''));
    setErrorMessage(null);
  };

  const isOtpComplete = otpDigits.every((d) => d !== '');

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Top Header Row matching Nike design */}
          <View style={styles.sheetHeader}>
            {step === 'otp' ? (
              <TouchableOpacity
                onPress={() => {
                  setStep('mobile');
                  setErrorMessage(null);
                }}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <ChevronLeft size={22} color="#111111" />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconPlaceholder} />
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
              onPress={onClose}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <X size={20} color="#111111" />
            </TouchableOpacity>
          </View>

          {step === 'mobile' ? (
            /* STEP 1: MOBILE NUMBER ENTRY (Matches n1.jpeg) */
            <View style={styles.contentBody}>
              <Text style={styles.headingTitle}>Log in or Sign up</Text>
              <Text style={styles.subHeading}>
                Get personalised picks & faster checkout
              </Text>

              {/* Outlined Notched Input Box */}
              <View
                style={[
                  styles.inputFieldContainer,
                  isPhoneFocused && styles.inputFieldFocused,
                ]}
              >
                <View style={styles.floatingLabelWrapper}>
                  <Text style={styles.fieldFloatingLabel}>
                    Enter 10-digit mobile no.
                  </Text>
                </View>
                <View style={styles.phoneInputRow}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text);
                      setErrorMessage(null);
                    }}
                    placeholder="96666 35009"
                    placeholderTextColor="#AEAEB2"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.phoneTextInput}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    autoFocus
                  />
                </View>
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              {/* Get OTP Button */}
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={!isPhoneValid || isSending}
                activeOpacity={0.85}
                style={[
                  styles.actionButton,
                  isPhoneValid ? styles.actionButtonActive : styles.actionButtonDisabled,
                ]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.actionButtonText,
                      isPhoneValid ? styles.actionButtonTextActive : styles.actionButtonTextDisabled,
                    ]}
                  >
                    Get OTP
                  </Text>
                )}
              </TouchableOpacity>

              {/* Legal Disclaimer */}
              <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                  By entering this site, you agree to the{'\n'}
                  <Text
                    style={styles.disclaimerLink}
                    onPress={() => Linking.openURL('https://urbanico.in/terms')}
                  >
                    Terms & Conditions
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.disclaimerLink}
                    onPress={() => Linking.openURL('https://urbanico.in/privacy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
          ) : (
            /* STEP 2: OTP VERIFICATION (Matches n2.jpeg) */
            <View style={styles.contentBodyCenter}>
              <Text style={styles.otpHeadingTitle}>Enter OTP</Text>
              <Text style={styles.otpSubHeading}>
                Sent to +91 {phoneNumber || DEFAULT_DEV_MOBILE}
              </Text>

              {/* 6 Square OTP Digit Boxes */}
              <View style={styles.otpBoxesRow}>
                {otpDigits.map((digit, idx) => {
                  const isFocused = activeOtpIndex === idx;
                  const isFilled = !!digit;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        isFocused && styles.otpBoxFocused,
                        isFilled && styles.otpBoxFilled,
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
                        style={styles.otpInputText}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Resend in 00:23 timer */}
              <View style={styles.resendContainer}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend in 00:{timer < 10 ? `0${timer}` : timer}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                    <Text style={styles.resendActionLink}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              {/* Verify OTP Button (Optional explicit trigger or auto-triggers) */}
              <TouchableOpacity
                onPress={() => verifyOtpCode(otpDigits.join(''))}
                disabled={!isOtpComplete || isVerifying}
                activeOpacity={0.85}
                style={[
                  styles.actionButton,
                  isOtpComplete ? styles.actionButtonActive : styles.actionButtonDisabled,
                  { marginTop: 24 },
                ]}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.actionButtonText,
                      isOtpComplete ? styles.actionButtonTextActive : styles.actionButtonTextDisabled,
                    ]}
                  >
                    Verify OTP
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 24,
    minHeight: 390,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 36,
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
  contentBody: {
    paddingHorizontal: 0,
  },
  contentBodyCenter: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'left',
  },
  subHeading: {
    fontSize: 14,
    color: '#707072',
    marginBottom: 24,
    fontWeight: '400',
    textAlign: 'left',
  },
  otpHeadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  otpSubHeading: {
    fontSize: 14,
    color: '#707072',
    textAlign: 'center',
    marginBottom: 28,
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
    borderColor: '#111111',
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
    color: '#111111',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
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
    backgroundColor: '#111111',
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
    color: '#FFFFFF',
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
    color: '#111111',
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
    borderColor: '#111111',
  },
  otpBoxFilled: {
    borderColor: '#111111',
    backgroundColor: '#FAFAFA',
  },
  otpInputText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
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
    color: '#111111',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

