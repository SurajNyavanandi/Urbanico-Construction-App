import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { soundService } from '../utils/soundHelper';

export interface UsePhoneAuthOptions {
  onSuccess?: (phone: string, isExistingUser?: boolean) => void;
  defaultPhone?: string;
  initialCountdown?: number;
}

/**
 * Reusable hook for phone number validation, OTP sending, countdown timer, and verification logic.
 * Eliminates duplicate OTP state and timer effects in AuthScreen, UserProfileScreen, and checkout verification.
 */
export function usePhoneAuth(options?: UsePhoneAuthOptions) {
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(options?.defaultPhone || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [generatedTestOtp, setGeneratedTestOtp] = useState('1234');

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone);
  const isOtpValid = otp.length === 4 || otp.length === 6;

  const handlePhoneChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
  }, []);

  const handleOtpChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
  }, []);

  const sendOtp = useCallback(async () => {
    if (!isPhoneValid) {
      showToast('Please enter a valid 10-digit Indian mobile number', 'error');
      return false;
    }

    setIsLoading(true);
    soundService.playTap();

    try {
      // Generate randomized 4-digit code for instant preview testing
      const testCode = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedTestOtp(testCode);

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 600));

      setStep('otp');
      setCountdown(options?.initialCountdown || 30);
      showToast(`OTP sent to +91 ${cleanPhone} (Test code: ${testCode})`, 'success');
      return true;
    } catch {
      showToast('Failed to send OTP. Please try again.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isPhoneValid, cleanPhone, showToast, options?.initialCountdown]);

  const verifyOtp = useCallback(async () => {
    if (!otp.trim()) {
      showToast('Please enter the verification OTP', 'error');
      return false;
    }

    setIsLoading(true);
    soundService.playTap();

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Accept test code or standard '1234' / '123456'
      if (otp === generatedTestOtp || otp === '1234' || otp === '123456') {
        soundService.playTap();
        showToast('Mobile number verified successfully!', 'success');
        if (options?.onSuccess) {
          options.onSuccess(cleanPhone);
        }
        return true;
      } else {
        showToast('Invalid OTP entered. Please check test code.', 'error');
        return false;
      }
    } catch {
      showToast('Verification failed. Please try again.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [otp, generatedTestOtp, cleanPhone, showToast, options]);

  const reset = useCallback(() => {
    setPhoneNumber('');
    setOtp('');
    setStep('phone');
    setCountdown(0);
    setIsLoading(false);
  }, []);

  return {
    phoneNumber,
    setPhoneNumber,
    cleanPhone,
    isPhoneValid,
    otp,
    setOtp,
    isOtpValid,
    step,
    setStep,
    isLoading,
    countdown,
    generatedTestOtp,
    handlePhoneChange,
    handleOtpChange,
    sendOtp,
    verifyOtp,
    reset,
  };
}
