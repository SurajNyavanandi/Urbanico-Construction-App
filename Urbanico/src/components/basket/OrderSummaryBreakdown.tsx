import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { formatINR } from '../../utils/priceHelper';

export interface OrderSummaryBreakdownProps {
  totalUnitQuantity: number;
  subtotal: number;
  isServicesOnly?: boolean;
  materialItemsCount: number;
  deliveryFeeDetails: {
    distanceKm: number;
    deliveryCharge: number;
    isFree: boolean;
  };
  unloadingEvaluation: {
    isMandatory: boolean;
    helperLabel: string;
  };
  effectiveUnloadingFee: number;
  couponDiscount: number;
  appliedCoupon?: string | null;
  gstinValidation?: {
    isValid: boolean;
    stateCode: string;
    stateName: string;
  } | null;
  grandTotal: number;
  smartRecommendation?: {
    badge: string;
    vehicle: {
      name: string;
      unloadingMechanism: string;
    };
  } | null;
  totalWeightTons?: string;
}

export const OrderSummaryBreakdown: React.FC<OrderSummaryBreakdownProps> = ({
  totalUnitQuantity,
  subtotal,
  isServicesOnly = false,
  materialItemsCount,
  deliveryFeeDetails,
  unloadingEvaluation,
  effectiveUnloadingFee,
  couponDiscount,
  appliedCoupon,
  gstinValidation,
  grandTotal,
  smartRecommendation,
  totalWeightTons,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Smart Vehicle Recommendation Strip */}
      {smartRecommendation && (
        <View style={[styles.recommendationBox, { backgroundColor: theme.mode === 'dark' ? '#0C4A6E' : '#F0F9FF', borderColor: theme.mode === 'dark' ? '#0369A1' : '#BAE6FD' }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.recHeaderRow}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#0284C7', textTransform: 'uppercase' }}>
                RECOMMENDED DISPATCH FLEET
              </Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{smartRecommendation.badge}</Text>
              </View>
            </View>
            <Text style={[styles.vehicleName, { color: theme.textPrimary }]}>
              {smartRecommendation.vehicle.name}
            </Text>
            <Text style={[styles.vehicleSub, { color: theme.textSecondary }]}>
              Allocated for {totalWeightTons} MT order tonnage ({smartRecommendation.vehicle.unloadingMechanism})
            </Text>
          </View>
        </View>
      )}

      {/* 1. Items Total */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
          Items Total ({totalUnitQuantity} {totalUnitQuantity === 1 ? 'item' : 'items'})
        </Text>
        <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
          {formatINR(subtotal)}
        </Text>
      </View>

      {isServicesOnly && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Technician Field Visit
          </Text>
          <Text style={[styles.summaryValue, { color: '#16A34A', fontWeight: '700' }]}>
            FREE (Included in ₹99)
          </Text>
        </View>
      )}

      {/* 2. Delivery Charges */}
      {materialItemsCount > 0 && (
        <View style={{ marginVertical: 3 }}>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Delivery Charges ({deliveryFeeDetails.distanceKm} km)
              </Text>
              <Text style={{ fontSize: 10.5, color: deliveryFeeDetails.isFree ? '#16A34A' : theme.textMuted }}>
                {deliveryFeeDetails.isFree
                  ? 'FREE delivery (within 5 km radius)'
                  : 'FREE up to 5 km (+ ₹7/km after 5 km)'}
              </Text>
            </View>
            <Text
              style={[
                styles.summaryValue,
                { color: deliveryFeeDetails.isFree ? '#16A34A' : theme.textPrimary, fontWeight: '700' },
              ]}
            >
              {deliveryFeeDetails.isFree ? 'FREE (₹0)' : formatINR(deliveryFeeDetails.deliveryCharge)}
            </Text>
          </View>
        </View>
      )}

      {/* 3. Site Unloading Labour */}
      {materialItemsCount > 0 && (
        <View style={{ marginVertical: 3 }}>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.summaryLabel, { color: theme.textPrimary, fontWeight: '600' }]}>
                  Site Unloading Labour
                </Text>
                <View
                  style={{
                    backgroundColor: unloadingEvaluation.isMandatory ? '#FEF3C7' : '#DCFCE7',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontWeight: '700',
                      color: unloadingEvaluation.isMandatory ? '#92400E' : '#15803D',
                    }}
                  >
                    {unloadingEvaluation.isMandatory ? 'Mandatory' : 'Self-Unload (₹0)'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 1 }}>
                {unloadingEvaluation.isMandatory
                  ? `${unloadingEvaluation.helperLabel} dispatched with vehicle`
                  : effectiveUnloadingFee > 0
                  ? '1 Delivery helper added'
                  : 'Small order (1–4 bags / <250 kg): Customer self-unload'}
              </Text>
            </View>
            <Text
              style={[
                styles.summaryValue,
                { color: effectiveUnloadingFee > 0 ? theme.textPrimary : '#16A34A', fontWeight: '700' },
              ]}
            >
              {effectiveUnloadingFee > 0 ? formatINR(effectiveUnloadingFee) : 'FREE (₹0)'}
            </Text>
          </View>
        </View>
      )}

      {/* 4. Platform Fee */}
      <View style={styles.summaryRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Platform Fee</Text>
        </View>
        <Text style={[styles.summaryValue, { color: '#16A34A', fontWeight: '700' }]}>
          ₹0 (FREE)
        </Text>
      </View>

      {/* Contractor Discount */}
      {couponDiscount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: '#16A34A' }]}>
            Contractor Discount ({appliedCoupon})
          </Text>
          <Text style={[styles.summaryValue, { color: '#16A34A', fontWeight: '700' }]}>
            -{formatINR(couponDiscount)}
          </Text>
        </View>
      )}

      {/* Inter-State Tax Notice */}
      {Boolean(gstinValidation?.isValid && gstinValidation.stateCode !== '36') && (
        <View
          style={[
            styles.interStateNotice,
            {
              backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#FEF3C7',
              borderColor: theme.mode === 'dark' ? '#334155' : '#FDE68A',
            },
          ]}
        >
          <Text style={{ fontSize: 11, color: theme.mode === 'dark' ? '#FDE047' : '#92400E', lineHeight: 15, fontWeight: '500' }}>
            ⚠️ <Text style={{ fontWeight: '700' }}>Inter-State Supply Notice:</Text> Registered GSTIN is in {gstinValidation?.stateName} (State {gstinValidation?.stateCode}). IGST @ 18% will be applied to this invoice instead of CGST+SGST.
          </Text>
        </View>
      )}

      {/* 5. Total Payable */}
      <View style={[styles.summaryRow, styles.grandTotalRow, { borderTopColor: theme.borderLight, marginTop: 8, paddingTop: 12 }]}>
        <View>
          <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>Total Payable</Text>
          <Text style={{ fontSize: 10.5, color: theme.textSecondary }}>
            Inclusive of all taxes & delivery fees
          </Text>
        </View>
        <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>
          {formatINR(grandTotal)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  recommendationBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  vehicleSub: {
    fontSize: 11,
    marginTop: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  interStateNotice: {
    marginVertical: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  grandTotalRow: {
    borderTopWidth: 1,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
});

export default OrderSummaryBreakdown;
