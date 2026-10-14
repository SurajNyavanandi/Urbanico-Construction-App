import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { AppText } from '../../common/AppText';
import { PriceTag } from '../../common/PriceTag';
import { CartTotals } from '../../../utils/cartCalculations';
import { useTheme } from '../../../context/ThemeContext';
import { formatINR } from '../../../utils/priceHelper';

export interface OrderSummaryCardProps {
  totals: CartTotals;
  couponDiscount: number;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  totals,
  couponDiscount,
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
      <AppText style={[styles.title, { color: theme.textPrimary }]} weight="bold">
        Bill Summary & Tax Details
      </AppText>

      <View style={styles.row}>
        <AppText style={[styles.rowLabel, { color: theme.textSecondary }]}>
          Materials Item Total
        </AppText>
        <AppText style={[styles.rowValue, { color: theme.textPrimary }]} weight="bold">
          {formatINR(totals.subtotal)}
        </AppText>
      </View>

      {couponDiscount > 0 && (
        <View style={styles.row}>
          <AppText style={[styles.rowLabel, { color: '#15803D' }]}>
            Promo Discount
          </AppText>
          <AppText style={[styles.rowValue, { color: '#15803D' }]} weight="bold">
            - {formatINR(couponDiscount)}
          </AppText>
        </View>
      )}

      <View style={styles.row}>
        <AppText style={[styles.rowLabel, { color: theme.textSecondary }]}>
          Estimated GST (18%)
        </AppText>
        <AppText style={[styles.rowValue, { color: theme.textPrimary }]} weight="medium">
          {formatINR(totals.gstTax)}
        </AppText>
      </View>

      <View style={styles.row}>
        <AppText style={[styles.rowLabel, { color: theme.textSecondary }]}>
          Freight & Logistics
        </AppText>
        <AppText style={[styles.rowValue, { color: totals.deliveryCharge === 0 ? '#15803D' : theme.textPrimary }]} weight="medium">
          {totals.deliveryCharge === 0 ? 'FREE' : formatINR(totals.deliveryCharge)}
        </AppText>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

      <View style={styles.totalRow}>
        <View>
          <AppText style={[styles.totalLabel, { color: theme.textPrimary }]} weight="bold">
            To Pay
          </AppText>
          <AppText style={[styles.taxInclusiveText, { color: theme.textSecondary }]}>
            Inclusive of all taxes
          </AppText>
        </View>

        <PriceTag price={totals.grandTotal} size="xl" />
      </View>

      <View style={[styles.trustBanner, { backgroundColor: theme.primaryLight || '#FFF8EB' }]}>
        <ShieldCheck size={16} color={theme.primaryDark || '#B45309'} />
        <AppText style={[styles.trustText, { color: theme.primaryDark || '#B45309' }]} weight="medium">
          GST Compliant Tax Invoice generated upon order confirmation.
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 12,
  },
  rowValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
  },
  taxInclusiveText: {
    fontSize: 10,
    marginTop: 1,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  trustText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
});
