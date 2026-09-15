import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Truck,
  MapPin,
  Clock,
  Check,
  ArrowLeft,
  PhoneCall,
  MessageSquare,
  Camera,
  FileText,
  AlertTriangle,
  Sparkles,
  Navigation,
  Layers,
  Repeat,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './common/EmptyState';
import { useToast } from '../context/ToastContext';
import { LiveDispatcherChatModal } from './common/LiveDispatcherChatModal';
import { SupervisorHandoffModal } from './common/SupervisorHandoffModal';

interface ActivityDashboardScreenProps {
  deliveries: ActivityDelivery[];
  onBack: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onReorderMaterial?: (materialName: string) => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

const TRACKING_STEPS = [
  { id: 'confirmed', title: 'Order Confirmed', description: 'Order received & materials reserved', status: 'completed' },
  { id: 'processing', title: 'Batching & Loading', description: 'Materials loaded & dispatched from hub', status: 'completed' },
  { id: 'dispatched', title: 'Dispatched with E-Way Bill', description: 'Government E-Way bill #EWB-TS-2026 issued', status: 'completed' },
  { id: 'out_for_delivery', title: 'Live GPS En Route', description: 'Transit via Outer Ring Road (ORR Exit 3)', status: 'active' },
  { id: 'delivered', title: 'Site Delivery & Handover', description: 'Digital OTP sign-off & physical gate delivery', status: 'pending' },
];

export const ActivityDashboardScreen: React.FC<ActivityDashboardScreenProps> = ({
  deliveries = [],
  onBack,
  onExploreCatalog,
  onViewInvoice,
  onReorderMaterial,
  isLoggedIn = true,
  onOpenLoginModal,
}) => {
  const { theme, typography } = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Live GPS simulation coordinates and moving vehicle state (Item 1)
  const [gpsProgress, setGpsProgress] = useState(68);
  const [gpsSpeed, setGpsSpeed] = useState(42);
  const [etaRemainingMins, setEtaRemainingMins] = useState(24);
  const [distanceKm, setDistanceKm] = useState(3.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setGpsProgress((prev) => (prev >= 98 ? 68 : prev + 1));
      setGpsSpeed(Math.floor(38 + Math.random() * 12));
      setDistanceKm((prev) => Math.max(0.8, Math.round((prev - 0.05) * 100) / 100));
      setEtaRemainingMins((prev) => Math.max(4, Math.round(prev > 5 ? prev - 0.2 : prev)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Modals
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorData, setSupervisorData] = useState(() => ({
    name: deliveries[0]?.driverName ? `${deliveries[0].driverName} (Site Contact)` : '',
    phone: deliveries[0]?.driverPhone || '',
  }));

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const [cancelledIds, setCancelledIds] = useState<string[]>([]);

  const validDeliveries = Array.isArray(deliveries) ? deliveries.filter(Boolean) : [];
  const activeEnRoute = validDeliveries.find((d) => {
    const isCancelled = cancelledIds.includes(d?.id) || (d?.status || '').toLowerCase() === 'cancelled';
    return !isCancelled && (d?.status || '').toLowerCase() === 'en route';
  }) || validDeliveries.find((d) => !cancelledIds.includes(d?.id) && (d?.status || '').toLowerCase() !== 'cancelled') || validDeliveries[0];

  const totalSpent = validDeliveries.reduce((acc, d) => acc + (d?.totalAmount || 0), 0);
  const deliveredCount = validDeliveries.filter((d) => (d?.status || '').toLowerCase() === 'delivered').length;
  const successRate = validDeliveries.length > 0 ? Math.round((deliveredCount / validDeliveries.length) * 100) : 100;

  const handleCallDriver = () => {
    // Direct action
  };

  const handleCancelOrder = (orderId?: string) => {
    const targetId = orderId || activeEnRoute?.id || activeEnRoute?.orderNumber;
    if (targetId) {
      setCancelledIds((prev) => [...prev, targetId]);
      showToast('Dispatch cancelled. Reversal & refund initiated.', 'info');
    }
  };

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
        <Text style={styles.navBarTitle}>Activity</Text>
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
        {validDeliveries.length === 0 ? (
          !isLoggedIn ? (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', padding: 24 }]}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.surfaceSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Truck size={32} color={theme.primary} strokeWidth={1.75} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 8, fontFamily: typography.fontFamilyHeading }}>
                Log in to View Orders
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20, maxWidth: 280 }}>
                If you previously placed site orders with your mobile number, log in to track active dispatches, GPS telemetry, and GST tax invoices.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                style={{ backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 12 }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Log In or Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onExploreCatalog}
                style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' }}
                activeOpacity={0.7}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>Explore Catalog</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <EmptyState
              type="no-orders"
              onAction={onExploreCatalog}
              actionLabel="Explore Catalog"
            />
          )
        ) : (
          <>
            {/* 1. Live Shipments Vertical Tracking Section & Minimalist Route Tracker */}
            {activeEnRoute && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Header */}
                <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
                  <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <Text style={[styles.orderNumberTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                      Order #{activeEnRoute.orderNumber}
                    </Text>
                    <Text style={[styles.materialSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {activeEnRoute.materialName}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.etaPill, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.etaPillText, { color: '#15803D' }]} numberOfLines={1}>
                        {etaRemainingMins} mins
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                      style={[styles.headerCancelIconBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                      activeOpacity={0.75}
                      accessibilityLabel="Cancel dispatch"
                    >
                      <X size={14} color="#DC2626" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Minimalist Non-Overlapping Route Telemetry Track */}
                <View style={[styles.modernRouteCard, { backgroundColor: theme.mode === 'dark' ? '#0F172A' : '#F8FAFC', borderColor: theme.borderLight }]}>
                  <View style={styles.routePointsRow}>
                    <View style={styles.routePointItem}>
                      <View style={[styles.routePointDot, { backgroundColor: '#0284C7' }]} />
                      <Text style={[styles.routePointLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                        Miyapur Hub
                      </Text>
                    </View>
                    <View style={[styles.routePointItem, { justifyContent: 'flex-end' }]}>
                      <MapPin size={13} color="#DC2626" />
                      <Text style={[styles.routePointLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                        Site Gate
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeTrackContainer}>
                    <View style={[styles.routeTrackBase, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#CBD5E1' }]}>
                      <View style={[styles.routeTrackFill, { width: `${Math.min(94, Math.max(8, gpsProgress))}%`, backgroundColor: '#0284C7' }]} />
                    </View>
                    <View style={[styles.movingVehicleIconWrapper, { left: `${Math.min(90, Math.max(5, gpsProgress))}%` }]}>
                      <View style={styles.vehiclePulseGlow} />
                      <View style={styles.vehiclePuck}>
                        <Truck size={12} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>

                  <View style={styles.telemetryStrip}>
                    <Text style={[styles.telemetryStripText, { color: theme.textSecondary }]}>
                      Speed: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{gpsSpeed} km/h</Text>
                    </Text>
                    <Text style={[styles.telemetryDotDivider, { color: theme.textMuted }]}>•</Text>
                    <Text style={[styles.telemetryStripText, { color: theme.textSecondary }]}>
                      ETA: <Text style={{ fontWeight: '700', color: '#059669' }}>{etaRemainingMins} mins</Text>
                    </Text>
                    <Text style={[styles.telemetryDotDivider, { color: theme.textMuted }]}>•</Text>
                    <Text style={[styles.telemetryStripText, { color: theme.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{distanceKm} km</Text> away
                    </Text>
                  </View>
                </View>

                {/* Logistics Advisory Note */}
                <View style={styles.trafficAlertBox}>
                  <AlertTriangle size={13} color="#D97706" />
                  <Text style={styles.trafficAlertText} numberOfLines={2}>
                    Logistics Route: Transit via ORR Exit 3 on schedule. Materials dispatched and sealed.
                  </Text>
                </View>

                {/* OTP & Gate Handoff Card */}
                <View style={styles.otpSection}>
                  <View style={styles.otpLeft}>
                    <Text style={styles.otpLabel}>Delivery Verification Code (OTP)</Text>
                    <Text style={styles.otpValue}>{activeEnRoute.deliveryOtp || '8842'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowSupervisorModal(true)}
                    style={styles.handoffBtn}
                    activeOpacity={0.7}
                  >
                    <UserCheck size={13} color="#111111" />
                    <Text style={styles.handoffBtnText}>Delegate</Text>
                  </TouchableOpacity>
                </View>

                {/* Delivery Meta */}
                <View style={styles.metaRow}>
                  <View style={[styles.metaCol, { flex: 1, minWidth: 0 }]}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Driver & Vehicle</Text>
                    <Text style={[styles.metaVal, { color: theme.textPrimary }]} numberOfLines={1}>
                      {activeEnRoute.driverName} ({activeEnRoute.vehicleNumber})
                    </Text>
                  </View>
                  <View style={[styles.metaCol, { flex: 1, minWidth: 0 }]}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Assigned Site Supervisor</Text>
                    <Text style={[styles.metaVal, { color: theme.textPrimary }]} numberOfLines={1}>
                      {supervisorData.name}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => setShowChatModal(true)}
                    style={[styles.actionBtn, { backgroundColor: '#111111' }]}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnTextWhite}>Live Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCallDriver}
                    style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                    activeOpacity={0.8}
                  >
                    <PhoneCall size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnTextWhite}>Call Driver</Text>
                  </TouchableOpacity>

                  {/* Cancel Button - Icon Only! */}
                  <TouchableOpacity
                    onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                    style={[styles.cancelActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                    activeOpacity={0.8}
                    accessibilityLabel="Cancel dispatch"
                  >
                    <X size={15} color="#DC2626" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>

                {/* Vertical Tracking Hierarchy */}
                <View style={styles.verticalTracker}>
                  {TRACKING_STEPS.map((step, idx) => {
                    const isLast = idx === TRACKING_STEPS.length - 1;
                    const isCompleted = step.status === 'completed';
                    const isActive = step.status === 'active';

                    return (
                      <View key={step.id} style={styles.timelineRow}>
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

                        <View style={[styles.timelineContent, isLast ? { paddingBottom: 0 } : { paddingBottom: 22 }]}>
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

            {/* Automated Reorder Recommendations for Concrete Cycles (Item 13) */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
                <View style={styles.cardHeaderLeft}>
                  <Sparkles size={16} color="#059669" />
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Next Pour Stage Recommendations
                  </Text>
                </View>
                <View style={[styles.etaPill, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.etaPillText, { color: '#059669' }]}>Phase-2 Ready</Text>
                </View>
              </View>

              <Text style={[styles.reorderDesc, { color: theme.textSecondary }]}>
                Based on your aggregate and cement orders, your site is scheduled for slab curing and interior brickwork:
              </Text>

              <View style={styles.reorderCardsList}>
                {[
                  {
                    name: 'Dr. Fixit Slabguard Curing Compound (20L)',
                    category: 'Chemicals',
                    rate: '₹2,450 / Drum',
                    leadTime: 'Same Day Delivery',
                  },
                  {
                    name: 'Manufactured Sand (Zone-II) Plastering Batch',
                    category: 'Aggregates',
                    rate: '₹4,200 / Brass',
                    leadTime: 'Express Delivery',
                  },
                  {
                    name: 'Binding Wire (18 Gauge) 25kg Bundle',
                    category: 'Hardware',
                    rate: '₹1,850 / Bundle',
                    leadTime: 'In Stock',
                  },
                ].map((item, idx) => (
                  <View key={idx} style={[styles.reorderCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <View style={styles.reorderLeft}>
                      <Text style={[styles.reorderItemName, { color: theme.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.reorderMeta, { color: theme.textSecondary }]}>
                        {item.rate} • {item.leadTime}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (onReorderMaterial) onReorderMaterial(item.name);
                        showToast(`Added "${item.name}" to rapid requisition`, 'success');
                      }}
                      style={styles.reorderBtn}
                      activeOpacity={0.7}
                    >
                      <Repeat size={12} color="#FFFFFF" />
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* 3. Procurement Volume Summary */}
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
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Invoiced (GST)</Text>
                  <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                    ₹{totalSpent.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.metricDividerVertical} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Dispatches Cleared</Text>
                  <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                    {validDeliveries.length} Shipments
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. Order History List */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                  Previous Dispatches
                </Text>
                <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                  {validDeliveries.length}
                </Text>
              </View>

              <View style={styles.ordersList}>
                {validDeliveries.map((del, idx) => {
                  const isCancelled = cancelledIds.includes(del?.id) || (del?.status || '').toLowerCase() === 'cancelled';
                  return (
                    <View
                      key={del?.id || `del_${idx}`}
                      style={[
                        styles.orderItemRow,
                        idx > 0 && { borderTopWidth: 1, borderTopColor: theme.borderLight },
                      ]}
                    >
                      <View style={[styles.orderLeft, { flex: 1, minWidth: 0, marginRight: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[styles.orderMaterialName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {del?.materialName || 'Material Delivery'}
                          </Text>
                          {isCancelled && (
                            <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#DC2626' }}>CANCELLED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.orderTimeText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {del?.timestamp || 'Recent'} • {isCancelled ? 'Refund Issued' : (del?.vehicleNumber || 'Standard Logistics')}
                        </Text>
                        {Boolean(del?.ewayBillNumber) && !isCancelled && (
                          <Text style={[styles.ewayText, { color: '#0284C7' }]} numberOfLines={1}>
                            E-Way Bill: {del.ewayBillNumber}
                          </Text>
                        )}
                      </View>

                      <View style={[styles.orderRight, { alignItems: 'flex-end', flexShrink: 0 }]}>
                        <Text style={[styles.orderAmount, { color: theme.textPrimary, textDecorationLine: isCancelled ? 'line-through' : 'none' }]}>
                          ₹{del?.totalAmount ? del.totalAmount.toLocaleString('en-IN') : '0'}
                        </Text>
                        {Boolean(onViewInvoice) && (
                          <TouchableOpacity
                            onPress={() => onViewInvoice(del)}
                            style={styles.invoiceActionBtn}
                            activeOpacity={0.7}
                          >
                            <FileText size={11} color="#111111" />
                            <Text style={styles.invoiceActionText}>GST Invoice</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Live Dispatcher Chat Modal */}
      <LiveDispatcherChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        orderNumber={activeEnRoute?.orderNumber}
        driverName={activeEnRoute?.driverName}
        driverPhone={activeEnRoute?.driverPhone}
      />

      {/* Supervisor Delegation Modal */}
      <SupervisorHandoffModal
        visible={showSupervisorModal}
        onClose={() => setShowSupervisorModal(false)}
        orderNumber={activeEnRoute?.orderNumber}
        currentSupervisorName={supervisorData.name}
        currentSupervisorPhone={supervisorData.phone}
        onSaveSupervisor={(name, phone) => setSupervisorData({ name, phone })}
      />
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
    gap: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  orderNumberTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  materialSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  etaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etaPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  headerCancelIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernRouteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  routePointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routePointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  routePointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routePointLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  routeTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 2,
  },
  routeTrackBase: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  routeTrackFill: {
    height: '100%',
    borderRadius: 2,
  },
  movingVehicleIconWrapper: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePulseGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
  },
  vehiclePuck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 2,
  },
  telemetryStripText: {
    fontSize: 11,
  },
  telemetryDotDivider: {
    fontSize: 10,
  },
  trafficAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 8,
  },
  trafficAlertText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },
  otpSection: {
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpLeft: {
    gap: 2,
  },
  otpLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  otpValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#111111',
  },
  handoffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  handoffBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnTextWhite: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cancelActionBtn: {
    width: 38,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  timelineStepDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  reorderDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  reorderCardsList: {
    gap: 8,
    marginTop: 4,
  },
  reorderCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reorderLeft: {
    flex: 1,
    gap: 2,
  },
  reorderItemName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  reorderMeta: {
    fontSize: 11,
  },
  reorderBtn: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reorderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  ordersList: {
    paddingTop: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  orderLeft: {
    gap: 2,
    flex: 1,
  },
  orderMaterialName: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderTimeText: {
    fontSize: 11.5,
  },
  ewayText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  invoiceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  invoiceActionText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#111111',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  metricDividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
});

export default ActivityDashboardScreen;
