import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Tag, Check, X } from 'lucide-react-native';
import { AppText } from '../../common/AppText';
import { useTheme } from '../../../context/ThemeContext';
import { formatINR } from '../../../utils/priceHelper';

export interface CouponSectionProps {
  couponInput: string;
  onCouponInputChange: (val: string) => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
}

export const CouponSection: React.FC<CouponSectionProps> = ({
  couponInput,
  onCouponInputChange,
  appliedCoupon,
  couponDiscount,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Tag size={16} color={theme.primaryDark || '#B45309'} />
          <AppText style={[styles.title, { color: theme.textPrimary }]} weight="bold">
            Promo Code / Site Discount
          </AppText>
        </View>
      </View>

      {appliedCoupon ? (
        <View style={[styles.appliedRow, { backgroundColor: theme.primaryLight || '#FFF8EB' }]}>
          <View style={styles.appliedDetails}>
            <View style={styles.appliedCodeBadge}>
              <Check size={12} color="#15803D" />
              <AppText style={styles.appliedCodeText} weight="bold">
                {appliedCoupon}
              </AppText>
            </View>
            <AppText style={[styles.discountSavings, { color: theme.primaryDark || '#B45309' }]} weight="bold">
              Saved {formatINR(couponDiscount)}
            </AppText>
          </View>

          <TouchableOpacity
            onPress={onRemoveCoupon}
            activeOpacity={0.7}
            style={styles.removeBtn}
          >
            <X size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            value={couponInput}
            onChangeText={(t) => onCouponInputChange(t.toUpperCase())}
            placeholder="e.g. URBANICO10, BUILD500"
            placeholderTextColor={theme.textMuted || '#A1A1AA'}
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceSecondary || '#F4F4F5',
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            onPress={onApplyCoupon}
            disabled={!couponInput.trim()}
            activeOpacity={0.8}
            style={[
              styles.applyBtn,
              {
                backgroundColor: couponInput.trim() ? theme.primary : '#E4E4E7',
                opacity: couponInput.trim() ? 1 : 0.6,
              },
            ]}
          >
            <AppText style={styles.applyBtnText} weight="bold">
              Apply
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    marginBottom: 10,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
  },
  appliedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appliedCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  appliedCodeText: {
    fontSize: 11,
    color: '#15803D',
  },
  discountSavings: {
    fontSize: 12,
  },
  removeBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 12,
    color: '#18181B',
  },
});
