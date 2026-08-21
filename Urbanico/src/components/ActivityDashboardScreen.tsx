import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Truck,
  MapPin,
  Clock,
  Check,
  ArrowLeft,
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './common/EmptyState';
import { useToast } from '../context/ToastContext';

interface ActivityDashboardScreenProps {
  deliveries: ActivityDelivery[];
  onBack: () => void;
  onExploreCatalog?: () => void;
}

const TRACKING_STEPS = [
  { id: 'confirmed', title: 'Order Confirmed', description: 'Order received and verified', status: 'completed' },
  { id: 'processing', title: 'Processing', description: 'Materials batched at yard', status: 'completed' },
  { id: 'dispatched', title: 'Dispatched', description: 'Vehicle loaded & weighed', status: 'completed' },
  { id: 'out_for_delivery', title: 'Out for Delivery', description: 'On the way to site', status: 'active' },
  { id: 'delivered', title: 'Delivered', description: 'Delivery completed at site', status: 'pending' },
];

export const ActivityDashboardScreen: React.FC<ActivityDashboardScreenProps> = ({
  deliveries,
  onBack,
  onExploreCatalog,
}) => {
  const { theme, typography } = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Tracking updated', 'info');
    }, 800);
  };

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route') || deliveries[0];

  // Dynamic real-time metrics calculated from deliveries state
  const totalSpent = deliveries.reduce((acc, d) => acc + (d.totalAmount || 0), 0);
  const deliveredCount = deliveries.filter((d) => d.status === 'Delivered').length;
  const successRate = deliveries.length > 0 ? Math.round((deliveredCount / deliveries.length) * 100) : 100;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top Nav Bar */}
      <View style={styles.topNavBar}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#111111" size={20} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
        <Text style={styles.navBarTitle}>Activity & Dispatches</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {deliveries.length === 0 ? (
          <EmptyState
            type="no-orders"
            onAction={onExploreCatalog}
            actionLabel="Explore Catalog"
          />
        ) : (
          <>
            {/* 1. Live Shipments Vertical Tracking Section */}
            {activeEnRoute && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Header */}
                <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
                  <View>
                    <Text style={[styles.orderNumberTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                      Order #{activeEnRoute.orderNumber}
                    </Text>
                    <Text style={[styles.materialSub, { color: theme.textSecondary }]}>
                      {activeEnRoute.materialName}
                    </Text>
                  </View>
                  <View style={[styles.etaPill, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.etaPillText, { color: theme.textPrimary }]}>{activeEnRoute.estimatedArrival}</Text>
                  </View>
                </View>

                {/* Delivery Meta */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Driver</Text>
                    <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{activeEnRoute.driverName} ({activeEnRoute.vehicleNumber})</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Destination</Text>
                    <Text style={[styles.metaVal, { color: theme.textPrimary }]} numberOfLines={1}>{activeEnRoute.siteAddress}</Text>
                  </View>
                </View>

                {/* Vertical Tracking Hierarchy */}
                <View style={styles.verticalTracker}>
                  {TRACKING_STEPS.map((step, idx) => {
                    const isLast = idx === TRACKING_STEPS.length - 1;
                    const isCompleted = step.status === 'completed';
                    const isActive = step.status === 'active';

                    return (
                      <View key={step.id} style={styles.timelineRow}>
                        {/* Left Column: Dot & Line */}
                        <View style={styles.timelineIndicatorCol}>
                          <View
                            style={[
                              styles.timelineDot,
                              isActive
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : isCompleted
                                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                                : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                            ]}
                          >
                            {isCompleted && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                            {isActive && <View style={styles.activeInnerDot} />}
                          </View>
                          {!isLast && (
                            <View
                              style={[
                                styles.timelineLine,
                                {
                                  backgroundColor: isCompleted ? theme.primary : theme.border,
                                },
                              ]}
                            />
                          )}
                        </View>

                        {/* Right Column: Step Info */}
                        <View style={[styles.timelineContent, isLast ? { paddingBottom: 0 } : { paddingBottom: 24 }]}>
                          <Text
                            style={[
                              styles.timelineStepTitle,
                              {
                                color: isActive
                                  ? theme.primary
                                  : isCompleted
                                  ? theme.textPrimary
                                  : theme.textSecondary,
                                fontWeight: isActive || isCompleted ? '600' : '400',
                              },
                            ]}
                          >
                            {step.title}
                          </Text>
                          <Text style={[styles.timelineStepDesc, { color: theme.textSecondary }]}>
                            {step.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 2. Dynamic Real-Time Orders & Volume Summary */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                  Procurement Summary
                </Text>
                <View style={[styles.etaPill, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.etaPillText, { color: '#059669' }]}>
                    {successRate}% Fulfilled
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Invoiced</Text>
                  <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                    ₹{totalSpent.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.metricDividerVertical} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Dispatches</Text>
                  <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                    {deliveries.length} Shipments
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Order History List */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                  Previous Orders
                </Text>
                <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                  {deliveries.length}
                </Text>
              </View>

              <View style={styles.ordersList}>
                {deliveries.map((del, idx) => (
                  <View
                    key={del.id}
                    style={[
                      styles.orderItemRow,
                      idx > 0 && { borderTopWidth: 1, borderTopColor: theme.borderLight },
                    ]}
                  >
                    <View style={styles.orderLeft}>
                      <Text style={[styles.orderMaterialName, { color: theme.textPrimary }]}>{del.materialName}</Text>
                      <Text style={[styles.orderTimeText, { color: theme.textSecondary }]}>{del.timestamp} • {del.vehicleNumber}</Text>
                    </View>

                    <View style={styles.orderRight}>
                      <Text style={[styles.orderAmount, { color: theme.textPrimary }]}>
                        ₹{del.totalAmount.toLocaleString('en-IN')}
                      </Text>
                      <Text
                        style={[
                          styles.orderStatusText,
                          { color: del.status === 'Delivered' ? theme.textSecondary : theme.primary },
                        ]}
                      >
                        {del.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  navBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.3,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 96,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  orderNumberTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  materialSub: {
    fontSize: 13,
    marginTop: 2,
  },
  etaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etaPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  verticalTracker: {
    paddingTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineStepTitle: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  timelineStepDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  ordersList: {
    paddingTop: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  orderLeft: {
    gap: 2,
    flex: 1,
  },
  orderMaterialName: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderTimeText: {
    fontSize: 12,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metricDividerVertical: {
    width: 1,
    height: 32,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
});
