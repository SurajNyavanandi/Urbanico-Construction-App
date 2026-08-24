import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './common/EmptyState';
import { useToast } from '../context/ToastContext';
import { LiveDispatcherChatModal } from './common/LiveDispatcherChatModal';
import { WeighbridgeScanModal } from './common/WeighbridgeScanModal';
import { SupervisorHandoffModal } from './common/SupervisorHandoffModal';

interface ActivityDashboardScreenProps {
  deliveries: ActivityDelivery[];
  onBack: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onReorderMaterial?: (materialName: string) => void;
}

const TRACKING_STEPS = [
  { id: 'confirmed', title: 'Order Confirmed', description: 'Order received & verified at quarry hub', status: 'completed' },
  { id: 'processing', title: 'Batching & Loading', description: 'Hydraulic tipper loaded & tare weighed', status: 'completed' },
  { id: 'dispatched', title: 'Dispatched with E-Way Bill', description: 'Government E-Way bill #EWB-TS-2026 issued', status: 'completed' },
  { id: 'out_for_delivery', title: 'Live GPS En Route', description: 'Transit via Outer Ring Road (ORR Exit 3)', status: 'active' },
  { id: 'delivered', title: 'Site Weighbridge Verification', description: 'Digital OTP sign-off & physical gate handover', status: 'pending' },
];

export const ActivityDashboardScreen: React.FC<ActivityDashboardScreenProps> = ({
  deliveries,
  onBack,
  onExploreCatalog,
  onViewInvoice,
  onReorderMaterial,
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
  const [showWeighbridgeModal, setShowWeighbridgeModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorData, setSupervisorData] = useState({
    name: 'Anand Verma (Site Engineer)',
    phone: '9876543210',
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Live telemetry & order status updated', 'info');
    }, 800);
  };

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route') || deliveries[0];

  const totalSpent = deliveries.reduce((acc, d) => acc + (d.totalAmount || 0), 0);
  const deliveredCount = deliveries.filter((d) => d.status === 'Delivered').length;
  const successRate = deliveries.length > 0 ? Math.round((deliveredCount / deliveries.length) * 100) : 100;

  const handleCallDriver = () => {
    showToast(`Connecting secure line to Driver ${activeEnRoute?.driverName || 'Ramesh'}...`, 'info');
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
        <Text style={styles.navBarTitle}>Activity & Live Dispatches</Text>
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
            {/* 1. Live Shipments Vertical Tracking Section & Simulated Map */}
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
                  <View style={[styles.etaPill, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.etaPillText, { color: '#15803D' }]}>
                      {etaRemainingMins} mins ({distanceKm} km away)
                    </Text>
                  </View>
                </View>

                {/* Simulated Live GPS Map View (Item 1) */}
                <View style={styles.liveMapStage}>
                  <View style={styles.mapGridLines} />
                  <View style={styles.routePathLine} />

                  {/* Quarry Pin */}
                  <View style={styles.quarryPin}>
                    <Text style={styles.pinLabel}>Miyapur Yard</Text>
                  </View>

                  {/* Active Vehicle Marker */}
                  <View style={[styles.movingVehicleMarker, { left: `${gpsProgress}%` }]}>
                    <View style={styles.vehiclePulseCircle} />
                    <View style={styles.vehicleIconCircle}>
                      <Truck size={14} color="#FFFFFF" />
                    </View>
                    <View style={styles.vehicleSpeedTag}>
                      <Text style={styles.vehicleSpeedText}>{gpsSpeed} km/h</Text>
                    </View>
                  </View>

                  {/* Destination Pin */}
                  <View style={styles.destPin}>
                    <MapPin size={16} color="#DC2626" />
                    <Text style={styles.destPinLabel}>Site Gate</Text>
                  </View>
                </View>

                {/* Live Weather / Traffic Delay Injection (Item 19) */}
                <View style={styles.trafficAlertBox}>
                  <AlertTriangle size={13} color="#D97706" />
                  <Text style={styles.trafficAlertText}>
                    Logistics Update: Gachibowli flyover lane clear. Driver maintaining optimal aggregate transport speed.
                  </Text>
                </View>

                {/* OTP & Gate Handoff Card (Item 21) */}
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
                    <Text style={styles.handoffBtnText}>Delegate OTP</Text>
                  </TouchableOpacity>
                </View>

                {/* Delivery Meta */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Driver & Fleet Vehicle</Text>
                    <Text style={[styles.metaVal, { color: theme.textPrimary }]}>
                      {activeEnRoute.driverName} ({activeEnRoute.vehicleNumber})
                    </Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Assigned Site Supervisor</Text>
                    <Text style={[styles.metaVal, { color: theme.textPrimary }]} numberOfLines={1}>
                      {supervisorData.name}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row (Item 8, 14, 17) */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => setShowChatModal(true)}
                    style={[styles.actionBtn, { backgroundColor: '#111111' }]}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnTextWhite}>Live Yard Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCallDriver}
                    style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                    activeOpacity={0.8}
                  >
                    <PhoneCall size={13} color="#FFFFFF" />
                    <Text style={styles.actionBtnTextWhite}>Call Driver</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowWeighbridgeModal(true)}
                    style={[styles.actionBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}
                    activeOpacity={0.8}
                  >
                    <Camera size={13} color={theme.textPrimary} />
                    <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Weighbridge OCR</Text>
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
                    leadTime: 'Same Day Dispatch',
                  },
                  {
                    name: 'Manufactured Sand (Zone-II) Plastering Batch',
                    category: 'Aggregates',
                    rate: '₹4,200 / Brass',
                    leadTime: '2 Hours Delivery',
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
                  Commercial Procurement Ledger
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
                    {deliveries.length} Shipments
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
                      {del.ewayBillNumber && (
                        <Text style={[styles.ewayText, { color: '#0284C7' }]}>E-Way Bill: {del.ewayBillNumber}</Text>
                      )}
                    </View>

                    <View style={styles.orderRight}>
                      <Text style={[styles.orderAmount, { color: theme.textPrimary }]}>
                        ₹{del.totalAmount.toLocaleString('en-IN')}
                      </Text>
                      {onViewInvoice && (
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
                ))}
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

      {/* Weighbridge Scan Modal */}
      <WeighbridgeScanModal
        visible={showWeighbridgeModal}
        onClose={() => setShowWeighbridgeModal(false)}
        orderNumber={activeEnRoute?.orderNumber}
        expectedTons={10.0}
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
  liveMapStage: {
    height: 100,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mapGridLines: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  routePathLine: {
    height: 4,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
    width: '100%',
  },
  quarryPin: {
    position: 'absolute',
    left: 14,
    top: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  movingVehicleMarker: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    alignItems: 'center',
    marginLeft: -16,
  },
  vehiclePulseCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
  },
  vehicleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  vehicleSpeedTag: {
    backgroundColor: '#111111',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  vehicleSpeedText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  destPin: {
    position: 'absolute',
    right: 14,
    top: 24,
    alignItems: 'center',
  },
  destPinLabel: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
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
