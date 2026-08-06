import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Truck,
  MapPin,
  Clock,
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ActivityDashboardScreenProps {
  deliveries: ActivityDelivery[];
  onBack: () => void;
}

export const ActivityDashboardScreen: React.FC<ActivityDashboardScreenProps> = ({
  deliveries,
}) => {
  const { theme, typography } = useTheme();

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route') || deliveries[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Live Shipments Section */}
      {activeEnRoute && (
        <View style={[styles.liveTrackingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.liveHeader, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.liveTagGroup}>
              <View style={styles.pingDot} />
              <Text style={[styles.liveTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                LIVE SHIPMENT #{activeEnRoute.orderNumber}
              </Text>
            </View>
            <View style={[styles.etaBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.etaText, { color: theme.primaryDark }]}>{activeEnRoute.estimatedArrival}</Text>
            </View>
          </View>

          <View style={styles.shipmentDetailsRow}>
            <View style={[styles.truckIconBox, { backgroundColor: theme.primaryLight }]}>
              <Truck size={20} color={theme.primaryDark} />
            </View>
            <View style={styles.shipmentTextGroup}>
              <Text style={[styles.materialName, { color: theme.textPrimary }]}>{activeEnRoute.materialName}</Text>
              <Text style={[styles.driverText, { color: theme.textSecondary }]}>
                Driver: <Text style={[styles.boldDriver, { color: theme.textPrimary }]}>{activeEnRoute.driverName}</Text>
              </Text>
              <View style={styles.addressRow}>
                <MapPin size={12} color="#EF4444" />
                <Text style={[styles.addressText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {activeEnRoute.siteAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Stepper Bar */}
          <View style={styles.stepperContainer}>
            {['Placed', 'Dispatched', 'En Route', 'Delivered'].map((step, idx) => {
              const isDone = idx <= 2;
              const isCurrent = idx === 2;
              return (
                <View key={step} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isDone
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepNumText,
                        { color: isDone ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      {isDone ? '✓' : idx + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      { color: isCurrent ? theme.primary : isDone ? theme.textPrimary : theme.textMuted },
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. Recent Delivery Logs Section */}
      <View style={[styles.logsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.logsHeader, { borderBottomColor: theme.borderLight }]}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
            Recent Delivery Logs
          </Text>
          <Text style={[styles.logCountText, { color: theme.textSecondary }]}>
            {deliveries.length} Shipments
          </Text>
        </View>

        <View style={styles.logsList}>
          {deliveries.map((del) => (
            <View key={del.id} style={[styles.logItem, { borderBottomColor: theme.borderLight }]}>
              <View style={styles.logLeft}>
                <Text style={[styles.logMaterialName, { color: theme.textPrimary }]}>{del.materialName}</Text>
                <View style={styles.logTimeRow}>
                  <Clock size={11} color={theme.textMuted} />
                  <Text style={[styles.logTimeText, { color: theme.textSecondary }]}>{del.timestamp}</Text>
                </View>
                <Text style={[styles.logVehicleText, { color: theme.textMuted }]}>
                  Vehicle: {del.vehicleNumber} ({del.driverName.split(' ')[0]})
                </Text>
              </View>

              <View style={styles.logRight}>
                <Text style={[styles.logAmountText, { color: theme.textPrimary }]}>
                  ₹{del.totalAmount.toLocaleString('en-IN')}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    del.status === 'Delivered'
                      ? styles.statusDelivered
                      : del.status === 'En Route'
                      ? styles.statusEnRoute
                      : styles.statusPlaced,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      del.status === 'Delivered'
                        ? styles.statusDeliveredText
                        : del.status === 'En Route'
                        ? styles.statusEnRouteText
                        : styles.statusPlacedText,
                    ]}
                  >
                    {del.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 96,
    gap: 16,
  },
  liveTrackingCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  liveTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  etaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  shipmentDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  truckIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipmentTextGroup: {
    flex: 1,
    gap: 2,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '800',
  },
  driverText: {
    fontSize: 12,
  },
  boldDriver: {
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '900',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  logsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  logCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logsList: {
    gap: 0,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logLeft: {
    gap: 3,
  },
  logMaterialName: {
    fontSize: 14,
    fontWeight: '700',
  },
  logTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logTimeText: {
    fontSize: 11,
  },
  logVehicleText: {
    fontSize: 11,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logAmountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDelivered: {
    backgroundColor: '#DCFCE7',
  },
  statusEnRoute: {
    backgroundColor: '#FEF3C7',
  },
  statusPlaced: {
    backgroundColor: '#E0E7FF',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusDeliveredText: {
    color: '#15803D',
  },
  statusEnRouteText: {
    color: '#B45309',
  },
  statusPlacedText: {
    color: '#4338CA',
  },
});
