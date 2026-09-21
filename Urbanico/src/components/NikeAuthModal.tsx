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
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { X, ChevronLeft, ShieldCheck, CheckCircle2, Sparkles, Phone, Lock, ArrowRight } from 'lucide-react-native';
import { BRAND_LOGO_URL } from '../constants';
import { ShimmerImage } from './common/ShimmerImage';
import { apiService } from '../services/apiService';

const DEFAULT_DEV_MOBILE = '';
const DEFAULT_DEV_OTP = '261125';
const CLOUDINARY_PROFILE_PIC =
  'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg';

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
  const { height: windowHeight } = useWindowDimensions();
  // Ensure the sheet occupies at least 75% of the screen height
  const modalSheetHeight = Math.max(Math.round(windowHeight * 0.76), 540);

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
      // Backend handles fallback
    } finally {
      setIsSending(false);
      setStep('otp');
      timerTargetRef.current = Date.now() + 30000;
      setTimer(30);
      // Fixed verification OTP: 261125
      const demoOtpArr = DEFAULT_DEV_OTP.split('');
      setOtpDigits(demoOtpArr);
      setTimeout(() => {
        inputRefs[5]?.current?.focus();
      }, 250);
    }
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

  const verifyOtpCode = async (code: string) => {
    const entered = (code || '').trim();
    if (entered !== DEFAULT_DEV_OTP) {
      setErrorMessage(`Invalid OTP. Please enter ${DEFAULT_DEV_OTP}.`);
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await apiService.verifyAuthOtp(cleanPhone || DEFAULT_DEV_MOBILE, entered);
      setIsVerifying(false);
      if (res && res.success) {
        onSuccessAuth(cleanPhone || DEFAULT_DEV_MOBILE);
        onClose();
      } else {
        setErrorMessage(res?.message || `Invalid OTP. Please enter ${DEFAULT_DEV_OTP}.`);
      }
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMessage(err?.message || `Authentication error. Please enter ${DEFAULT_DEV_OTP}.`);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    timerTargetRef.current = Date.now() + 30000;
    setTimer(30);
    setOtpDigits(DEFAULT_DEV_OTP.split(''));
    setErrorMessage(null);
    try {
      await apiService.sendAuthOtp(cleanPhone);
    } catch {}
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

        <View style={[styles.sheetContainer, { height: modalSheetHeight }]}>
          {/* Subtle drag handle */}
          <View style={styles.dragHandleBar}>
            <View style={styles.dragHandle} />
          </View>

          {/* Top Header Row */}
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

          {/* Scrollable Body Content filling >=75% viewport */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {step === 'mobile' ? (
              /* STEP 1: MOBILE NUMBER ENTRY */
              <View style={styles.contentBody}>
                {/* Contractor Profile / Account Header Card */}
                <View style={styles.contractorCard}>
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={{ uri: CLOUDINARY_PROFILE_PIC }}
                      style={styles.contractorAvatar}
                    />
                    <View style={styles.avatarOnlineDot} />
                  </View>
                  <View style={styles.contractorMeta}>
                    <View style={styles.badgeRow}>
                      <View style={styles.verifiedPill}>
                        <ShieldCheck size={11} color="#059669" />
                        <Text style={styles.verifiedPillText}>AUTHENTICATED ACCESS</Text>
                      </View>
                      <View style={styles.otpHintPill}>
                        <Text style={styles.otpHintPillText}>OTP: 261125</Text>
                      </View>
                    </View>
                    <Text style={styles.contractorTitle}>Urbanico Contractor & Site Access</Text>
                    <Text style={styles.contractorSubtitle}>
                      Manage site dispatches, bulk supply & GST billing
                    </Text>
                  </View>
                </View>

                <View style={styles.titleSection}>
                  <Text style={styles.headingTitle}>Log in or Sign up</Text>
                  <Text style={styles.subHeading}>
                    Enter your 10-digit mobile number to verify your account
                  </Text>
                </View>

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
                    isPhoneValid ? styles.actionButtonActive : styles.actionButtonDisabled,
                  ]}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonInnerRow}>
                      <Text
                        style={[
                          styles.actionButtonText,
                          isPhoneValid ? styles.actionButtonTextActive : styles.actionButtonTextDisabled,
                        ]}
                      >
                        Get OTP
                      </Text>
                      <ArrowRight size={16} color={isPhoneValid ? '#FFFFFF' : '#8E8E93'} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Value Propositions / Security Badges */}
                <View style={styles.perksGrid}>
                  <View style={styles.perkItem}>
                    <CheckCircle2 size={13} color="#059669" />
                    <Text style={styles.perkText}>Direct Yard Pricing</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <CheckCircle2 size={13} color="#059669" />
                    <Text style={styles.perkText}>Live GPS Site Dispatch</Text>
                  </View>
                  <View style={styles.perkItem}>
                    <CheckCircle2 size={13} color="#059669" />
                    <Text style={styles.perkText}>E-Way Bill & GST Invoice</Text>
                  </View>
                </View>

                {/* Legal Disclaimer */}
                <View style={styles.disclaimerContainer}>
                  <Text style={styles.disclaimerText}>
                    By continuing, you agree to Urbanico's{' '}
                    <Text
                      style={styles.disclaimerLink}
                      onPress={() => Linking.openURL('https://urbanico.in/terms')}
                    >
                      Terms of Service
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
              /* STEP 2: OTP VERIFICATION */
              <View style={styles.contentBodyCenter}>
                {/* Profile Header */}
                <View style={styles.otpAvatarHeader}>
                  <Image
                    source={{ uri: CLOUDINARY_PROFILE_PIC }}
                    style={styles.otpAvatar}
                  />
                  <View style={styles.otpAvatarBadge}>
                    <CheckCircle2 size={14} color="#059669" />
                  </View>
                </View>

                <Text style={styles.otpHeadingTitle}>Enter Verification Code</Text>
                <Text style={styles.otpSubHeading}>
                  Sent to <Text style={{ fontWeight: '700', color: '#111111' }}>+91 {phoneNumber || DEFAULT_DEV_MOBILE}</Text>
                </Text>

                {/* Quick OTP Helper Pill */}
                <TouchableOpacity
                  style={styles.otpHelperPill}
                  activeOpacity={0.7}
                  onPress={() => {
                    const demoOtpArr = DEFAULT_DEV_OTP.split('');
                    setOtpDigits(demoOtpArr);
                    setErrorMessage(null);
                  }}
                >
                  <Sparkles size={13} color="#059669" />
                  <Text style={styles.otpHelperPillText}>
                    Verification Code: <Text style={{ fontWeight: '800' }}>261125</Text> (Tap to Auto-fill)
                  </Text>
                </TouchableOpacity>

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

                {/* Resend timer */}
                <View style={styles.resendContainer}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>
                      Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                      <Text style={styles.resendActionLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {Boolean(errorMessage) && (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                )}

                {/* Verify OTP Button */}
                <TouchableOpacity
                  onPress={() => verifyOtpCode(otpDigits.join(''))}
                  disabled={!isOtpComplete || isVerifying}
                  activeOpacity={0.85}
                  style={[
                    styles.actionButton,
                    isOtpComplete ? styles.actionButtonActive : styles.actionButtonDisabled,
                    { marginTop: 18 },
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
                      Verify & Sign In
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep('mobile');
                    setErrorMessage(null);
                  }}
                  style={styles.changeNumberBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeNumberBtnText}>Change Mobile Number</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 28,
    minHeight: '75%', // At least 75% on the screen
    maxHeight: '94%',
    display: 'flex',
    flexDirection: 'column',
  },
  dragHandleBar: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  contentBody: {
    paddingHorizontal: 0,
  },
  contentBodyCenter: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  contractorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  contractorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contractorMeta: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.3,
  },
  otpHintPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  otpHintPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  contractorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  contractorSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  titleSection: {
    marginBottom: 20,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'left',
  },
  subHeading: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
    textAlign: 'left',
    lineHeight: 20,
  },
  otpAvatarHeader: {
    position: 'relative',
    marginBottom: 14,
  },
  otpAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
  },
  otpAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  otpHeadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  otpSubHeading: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  otpHelperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
    marginBottom: 24,
  },
  otpHelperPillText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  inputFieldContainer: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  inputFieldFocused: {
    borderColor: '#0F172A',
  },
  floatingLabelWrapper: {
    position: 'absolute',
    top: -10,
    left: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
  },
  fieldFloatingLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionButtonActive: {
    backgroundColor: '#0F172A',
  },
  actionButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: '#94A3B8',
  },
  perksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  disclaimerContainer: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    color: '#0F172A',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  otpBox: {
    width: 44,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: '#0F172A',
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  otpInputText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  resendContainer: {
    marginVertical: 4,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  resendActionLink: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  changeNumberBtn: {
    marginTop: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  changeNumberBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});


