import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  TrendingUp,
  Truck,
  Package,
  MapPin,
  Clock,
  Filter,
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ActivityDashboardScreenProps {
  deliveries: ActivityDelivery[];
  onBack: () => void;
}

const MATERIAL_BREAKDOWN = [
  { name: 'Sand', tons: 52, fill: '#F59E0B', percentage: '35%' },
  { name: 'Bricks', tons: 38, fill: '#EF4444', percentage: '26%' },
  { name: 'Cement', tons: 30, fill: '#3B82F6', percentage: '21%' },
  { name: 'Steel', tons: 15, fill: '#4F46E5', percentage: '10%' },
  { name: 'Stone', tons: 10, fill: '#10B981', percentage: '8%' },
];

const SPEND_TREND = [
  { day: 'Mon', spend: 28000, heightPct: 29 },
  { day: 'Tue', spend: 45000, heightPct: 47 },
  { day: 'Wed', spend: 18000, heightPct: 18 },
  { day: 'Thu', spend: 62000, heightPct: 65 },
  { day: 'Fri', spend: 95000, heightPct: 100 },
  { day: 'Sat', spend: 54000, heightPct: 56 },
  { day: 'Sun', spend: 40800, heightPct: 42 },
];

export const ActivityDashboardScreen: React.FC<ActivityDashboardScreenProps> = ({
  deliveries,
}) => {
  const { theme, typography } = useTheme();
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('week');

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route') || deliveries[0];
  const maxTons = Math.max(...MATERIAL_BREAKDOWN.map((m) => m.tons));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Time Filter Pills Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.filterLeftGroup}>
          <Filter size={14} color={theme.textMuted} />
          <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Period:</Text>
        </View>
        <View style={styles.filterTabsGroup}>
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'quarter', label: 'Quarter' },
          ].map((tab) => {
            const isActive = timeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setTimeFilter(tab.id as any)}
                activeOpacity={0.8}
                style={[
                  styles.filterTabBtn,
                  { backgroundColor: isActive ? theme.primary : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Overview Stat Cards Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statCardHeader}>
            <Text style={[styles.statCardTitle, { color: theme.textSecondary }]}>Volume Supplied</Text>
            <Package size={16} color={theme.primary} />
          </View>
          <Text style={[styles.statCardValue, { color: theme.textPrimary }]}>145 Tons</Text>
          <View style={styles.badgeGreen}>
            <Text style={styles.badgeGreenText}>+18% vs last week</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statCardHeader}>
            <Text style={[styles.statCardTitle, { color: theme.textSecondary }]}>Total Expenditure</Text>
            <TrendingUp size={16} color={theme.primary} />
          </View>
          <Text style={[styles.statCardValue, { color: theme.textPrimary }]}>₹3,42,800</Text>
          <View style={[styles.badgeTheme, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.badgeThemeText, { color: theme.primaryDark }]}>4 Delivery Invoices</Text>
          </View>
        </View>
      </View>

      {/* Live Vehicle Tracking Timeline */}
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

      {/* Material Consumption Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Material Supply Breakdown
            </Text>
            <Text style={[styles.chartSubTitle, { color: theme.textSecondary }]}>Volume in Metric Tons (T)</Text>
          </View>
          <View style={[styles.badgeTheme, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.badgeThemeText, { color: theme.primaryDark }]}>145 Tons Total</Text>
          </View>
        </View>

        {/* Custom Bar Visualization */}
        <View style={styles.barChartContainer}>
          {MATERIAL_BREAKDOWN.map((item) => {
            const heightRatio = item.tons / maxTons;
            return (
              <View key={item.name} style={styles.barColumn}>
                <Text style={[styles.barValueText, { color: theme.textSecondary }]}>{item.tons}T</Text>
                <View style={[styles.barTrack, { backgroundColor: theme.surfaceSecondary }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${heightRatio * 100}%`,
                        backgroundColor: item.fill,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabelText, { color: theme.textPrimary }]}>{item.name}</Text>
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View style={[styles.legendGrid, { borderTopColor: theme.borderLight }]}>
          {MATERIAL_BREAKDOWN.map((m) => (
            <View key={m.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: m.fill }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                {m.name}: <Text style={{ color: theme.textPrimary, fontWeight: '800' }}>{m.percentage}</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Expenditure Trend Area Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Daily Material Spending
            </Text>
            <Text style={[styles.chartSubTitle, { color: theme.textSecondary }]}>In Indian Rupees (₹)</Text>
          </View>
          <View style={styles.badgeGreen}>
            <Text style={styles.badgeGreenText}>Weekly Cycle</Text>
          </View>
        </View>

        {/* Daily Spending Visualization */}
        <View style={styles.areaChartContainer}>
          {SPEND_TREND.map((item) => (
            <View key={item.day} style={styles.spendColumn}>
              <Text style={[styles.spendValueText, { color: theme.textSecondary }]}>
                ₹{(item.spend / 1000).toFixed(0)}k
              </Text>
              <View style={[styles.spendTrack, { backgroundColor: theme.surfaceSecondary }]}>
                <View
                  style={[
                    styles.spendBarFill,
                    { height: `${item.heightPct}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
              <Text style={[styles.spendDayText, { color: theme.textPrimary }]}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Delivery Logs List */}
      <View style={[styles.logsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.logsHeader, { borderBottomColor: theme.borderLight }]}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
            Recent Delivery Logs
          </Text>
          <Text style={[styles.logCountText, { color: theme.textSecondary }]}>4 Shipments</Text>
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
    paddingTop: 8,
    paddingBottom: 96,
    gap: 16,
  },
  filterBar: {
    borderRadius: 16,
    padding: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabsGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  filterTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  badgeGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeGreenText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  badgeTheme: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeThemeText: {
    fontSize: 10,
    fontWeight: '800',
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
    borderRadius: 999,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  shipmentDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  truckIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipmentTextGroup: {
    flex: 1,
    gap: 2,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '800',
  },
  driverText: {
    fontSize: 11,
  },
  boldDriver: {
    fontWeight: '800',
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
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  chartSubTitle: {
    fontSize: 10,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 12,
  },
  barColumn: {
    alignItems: 'center',
    width: 40,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '800',
  },
  barTrack: {
    width: 20,
    flex: 1,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabelText: {
    fontSize: 10,
    fontWeight: '800',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  areaChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 12,
  },
  spendColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  spendValueText: {
    fontSize: 8,
    fontWeight: '800',
  },
  spendTrack: {
    width: 14,
    flex: 1,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  spendBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  spendDayText: {
    fontSize: 10,
    fontWeight: '800',
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
  logCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logsList: {
    gap: 12,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  logLeft: {
    flex: 1,
    gap: 2,
  },
  logMaterialName: {
    fontSize: 13,
    fontWeight: '800',
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
    fontSize: 10,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusDelivered: {
    backgroundColor: '#D1FAE5',
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
    color: '#047857',
  },
  statusEnRouteText: {
    color: '#92400E',
  },
  statusPlacedText: {
    color: '#3730A3',
  },
});
