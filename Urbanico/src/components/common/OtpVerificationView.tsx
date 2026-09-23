import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface OtpVerificationViewProps {
  digits: string[];
  onDigitChange: (index: number, val: string) => void;
  onVerify: (code: string) => void;
  onResend?: () => void;
  countdown?: number;
  isVerifying?: boolean;
  error?: string | null;
  defaultOtpCode?: string;
  helperText?: string;
  submitLabel?: string;
  recipientLabel?: string;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  digits,
  onDigitChange,
  onVerify,
  onResend,
  countdown = 0,
  isVerifying = false,
  error = null,
  defaultOtpCode,
  helperText,
  submitLabel = 'Verify Code',
  recipientLabel,
}) => {
  const { theme } = useTheme();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const isComplete = digits.every((d) => d !== '');

  const handleInputChange = (idx: number, text: string) => {
    onDigitChange(idx, text);
    const clean = text.replace(/\D/g, '');
    if (clean && idx < digits.length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (idx: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        onDigitChange(idx - 1, '');
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Boolean(recipientLabel) && (
        <Text style={[styles.recipientText, { color: theme.textSecondary }]}>
          Sent to <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{recipientLabel}</Text>
        </Text>
      )}

      {/* Helper Pill if default code available */}
      {Boolean(defaultOtpCode) && (
        <TouchableOpacity
          style={[styles.helperPill, { backgroundColor: theme.mode === 'dark' ? '#064E3B20' : '#ECFDF5', borderColor: '#10B981' }]}
          activeOpacity={0.7}
          onPress={() => {
            const chars = defaultOtpCode!.split('');
            chars.forEach((c, i) => onDigitChange(i, c));
          }}
        >
          <Sparkles size={13} color="#059669" />
          <Text style={styles.helperPillText}>
            {helperText || `Verification Code: `}
            <Text style={{ fontWeight: '800' }}>{defaultOtpCode}</Text> (Tap to fill)
          </Text>
        </TouchableOpacity>
      )}

      {/* Digit Input Boxes */}
      <View style={styles.boxesRow}>
        {digits.map((digit, idx) => {
          const isFilled = !!digit;
          return (
            <TextInput
              key={idx}
              ref={(ref) => (inputRefs.current[idx] = ref)}
              value={digit}
              onChangeText={(val) => handleInputChange(idx, val)}
              onKeyPress={(e) => handleKeyPress(idx, e)}
              keyboardType="number-pad"
              maxLength={digits.length > 1 ? 1 : 4}
              style={[
                styles.digitBox,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: isFilled ? theme.primary : theme.border,
                  color: theme.textPrimary,
                },
                isFilled && styles.digitBoxFilled,
              ]}
              textAlign="center"
              selectTextOnFocus
            />
          );
        })}
      </View>

      {/* Error display */}
      {Boolean(error) && <Text style={styles.errorText}>⚠️ {error}</Text>}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={() => onVerify(digits.join(''))}
        disabled={!isComplete || isVerifying}
        activeOpacity={0.85}
        style={[
          styles.submitBtn,
          {
            backgroundColor: theme.primary,
            opacity: !isComplete || isVerifying ? 0.6 : 1,
          },
        ]}
      >
        {isVerifying ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.submitBtnInner}>
            <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.submitBtnText}>{submitLabel}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Resend link */}
      {Boolean(onResend) && (
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={[styles.resendTimerText, { color: theme.textMuted }]}>
              Resend code in <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={onResend} activeOpacity={0.7}>
              <Text style={[styles.resendLink, { color: theme.primary }]}>Resend Verification Code</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  recipientText: {
    fontSize: 13,
    marginBottom: 4,
  },
  helperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  helperPillText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 6,
  },
  digitBox: {
    width: 44,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '700',
  },
  digitBoxFilled: {
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resendRow: {
    marginTop: 4,
  },
  resendTimerText: {
    fontSize: 12,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
