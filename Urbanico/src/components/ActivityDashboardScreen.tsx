import React, { useState } from 'react';
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
  Package,
  MapPin,
  Clock,
  Check,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Sparkles,
  Layers,
  Repeat,
  ShieldCheck,
  UserCheck,
  KeyRound,
  X,
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './common/EmptyState';
import { useToast } from '../context/ToastContext';
import { SupervisorHandoffModal } from './common/SupervisorHandoffModal';
import { formatSiteAddress } from '../utils/addressHelper';

interface ActivityDashboardScreenProps {
  deliveries: ActivityDelivery[];
  onBack: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onReorderMaterial?: (materialName: string) => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

const ORDER_LIFECYCLE_STAGES = [
  {
    id: 'confirmed',
    stepNumber: 1,
    title: 'Order Confirmed',
    description: 'Payment authorized & order booked in central inventory',
    status: 'completed',
  },
  {
    id: 'yard_processing',
    stepNumber: 2,
    title: 'Yard Material Batching',
    description: 'Materials inspected, batch sealed & prepared for transit',
    status: 'completed',
  },
  {
    id: 'in_transit',
    stepNumber: 3,
    title: 'Out for Site Delivery',
    description: 'Consignment en route to your construction site',
    status: 'active',
  },
  {
    id: 'site_handover',
    stepNumber: 4,
    title: 'Site Delivery & Unloading',
    description: 'Gate OTP verification, material handover & e-invoice sign-off',
    status: 'pending',
  },
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

  // Modals
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [supervisorData, setSupervisorData] = useState(() => ({
    name: deliveries[0]?.driverName ? `${deliveries[0].driverName} (Site Incharge)` : 'Site Incharge',
    phone: deliveries[0]?.driverPhone || '+91 98480 12345',
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

  const handleCancelOrder = (orderId?: string) => {
    const targetId = orderId || activeEnRoute?.id || activeEnRoute?.orderNumber;
    if (targetId) {
      setCancelledIds((prev) => [...prev, targetId]);
      showToast('Order delivery cancelled. Refund initiated.', 'info');
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
        <Text style={styles.navBarTitle}>Activity & Orders</Text>
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
                <Package size={32} color={theme.primary} strokeWidth={1.75} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 8, fontFamily: typography.fontFamilyHeading }}>
                Log in to View Orders
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20, maxWidth: 280 }}>
                If you previously placed site orders with your mobile number, log in to view active orders, dispatch lifecycle stages, and GST tax invoices.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                style={{ backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 12 }}
                activeOpacity={0.85}
              >
                <Text style={{ color: theme.primaryText || '#18181B', fontWeight: '700', fontSize: 14 }}>Log In or Sign Up</Text>
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
            {/* 1. Active Order Vertical Lifecycle Hierarchy Card */}
            {activeEnRoute && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Header */}
                <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
                  <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={[styles.orderNumberTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                        Order #{activeEnRoute.orderNumber}
                      </Text>
                      <View style={[styles.statusBadgePill, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>
                          IN TRANSIT
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.materialSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {activeEnRoute.materialName} • {activeEnRoute.quantity || '1 Load'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.etaPill, { backgroundColor: '#DCFCE7' }]}>
                      <Clock size={11} color="#15803D" />
                      <Text style={[styles.etaPillText, { color: '#15803D' }]} numberOfLines={1}>
                        Est. {activeEnRoute.estimatedArrival || 'Within 3 hrs'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                      style={[styles.headerCancelIconBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                      activeOpacity={0.75}
                      accessibilityLabel="Cancel order"
                    >
                      <X size={14} color="#DC2626" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Vertical Lifecycle Stepper Hierarchy */}
                <View style={styles.milestonesSection}>
                  <Text style={[styles.sectionMicroTitle, { color: theme.textMuted }]}>
                    ORDER LIFECYCLE & DISPATCH STAGES
                  </Text>
                  {ORDER_LIFECYCLE_STAGES.map((step, idx) => {
                    const isDone = step.status === 'completed';
                    const isActive = step.status === 'active';
                    return (
                      <View key={step.id} style={styles.timelineRow}>
                        <View style={styles.timelineIndicatorCol}>
                          <View
                            style={[
                              styles.statusDot,
                              isDone && styles.dotCompleted,
                              isActive && styles.dotActive,
                            ]}
                          >
                            {isDone ? (
                              <Check size={10} color="#FFFFFF" strokeWidth={3} />
                            ) : (
                              <Text style={[styles.stepNumberText, { color: isActive ? '#FFFFFF' : theme.textMuted }]}>
                                {step.stepNumber}
                              </Text>
                            )}
                          </View>
                          {idx < ORDER_LIFECYCLE_STAGES.length - 1 && (
                            <View
                              style={[
                                styles.timelineLine,
                                isDone ? styles.lineCompleted : styles.linePending,
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.timelineContentCol}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text
                              style={[
                                styles.stepTitle,
                                { color: isDone || isActive ? theme.textPrimary : theme.textMuted },
                              ]}
                            >
                              {step.title}
                            </Text>
                            {isActive && (
                              <View style={[styles.activeStageTag, { backgroundColor: theme.primary }]}>
                                <Text style={styles.activeStageTagText}>CURRENT</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
                            {step.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Delivery Site Destination & Verification Details */}
                <View style={[styles.deliveryInfoCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  {/* Destination Address */}
                  <View style={styles.infoRow}>
                    <MapPin size={15} color={theme.primary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Delivery Site Destination</Text>
                      <Text style={[styles.infoValue, { color: theme.textPrimary }]} numberOfLines={2}>
                        {formatSiteAddress(activeEnRoute.siteAddress)}
                      </Text>
                    </View>
                  </View>

                  {/* Gate Verification OTP Code */}
                  <View style={[styles.otpRowContainer, { borderTopColor: theme.borderLight }]}>
                    <View style={styles.otpLeftBox}>
                      <KeyRound size={15} color="#059669" />
                      <View>
                        <Text style={[styles.otpMicroLabel, { color: theme.textSecondary }]}>
                          Delivery Gate Verification Code
                        </Text>
                        <Text style={[styles.otpMainValue, { color: theme.textPrimary }]}>
                          {activeEnRoute.deliveryOtp || '8842'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowSupervisorModal(true)}
                      style={[styles.delegateBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      activeOpacity={0.75}
                    >
                      <UserCheck size={12} color={theme.textPrimary} />
                      <Text style={[styles.delegateBtnText, { color: theme.textPrimary }]}>
                        Delegate
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Assigned Site Supervisor */}
                  <View style={[styles.supervisorRow, { borderTopColor: theme.borderLight }]}>
                    <ShieldCheck size={14} color="#0284C7" />
                    <Text style={[styles.supervisorText, { color: theme.textSecondary }]}>
                      Site Incharge: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{supervisorData.name}</Text> ({supervisorData.phone})
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionRow}>
                  {Boolean(onViewInvoice) && (
                    <TouchableOpacity
                      onPress={() => onViewInvoice(activeEnRoute)}
                      style={[styles.actionBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}
                      activeOpacity={0.8}
                    >
                      <FileText size={13} color={theme.textPrimary} />
                      <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>GST Tax Invoice</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => setShowSupervisorModal(true)}
                    style={[styles.actionBtn, { backgroundColor: theme.buttonBg || '#FCB026' }]}
                    activeOpacity={0.8}
                  >
                    <ShieldCheck size={13} color={theme.buttonText || '#18181B'} />
                    <Text style={[styles.actionBtnTextWhite, { color: theme.buttonText || '#18181B' }]}>Supervisor</Text>
                  </TouchableOpacity>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                    style={[styles.cancelActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                    activeOpacity={0.8}
                    accessibilityLabel="Cancel order"
                  >
                    <X size={15} color="#DC2626" strokeWidth={2.4} />
                  </TouchableOpacity>
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
                            {del?.orderNumber ? `Order #${del.orderNumber}` : 'Standard Order'}
                          </Text>
                          {isCancelled && (
                            <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#DC2626' }}>CANCELLED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2, marginBottom: 2 }} numberOfLines={1}>
                          {del?.materialName || 'Material Delivery'}
                        </Text>
                        <Text style={[styles.orderTimeText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {del?.timestamp || 'Recent'}{isCancelled ? ' • Refund Issued' : ''}
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
  statusBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  milestonesSection: {
    paddingVertical: 4,
  },
  sectionMicroTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  timelineIndicatorCol: {
    width: 26,
    alignItems: 'center',
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  dotCompleted: {
    backgroundColor: '#059669',
  },
  dotActive: {
    backgroundColor: '#0284C7',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 3,
  },
  lineCompleted: {
    backgroundColor: '#059669',
  },
  linePending: {
    backgroundColor: '#E4E4E7',
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  activeStageTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  activeStageTagText: {
    color: '#18181B',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stepDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  deliveryInfoCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  otpRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  otpLeftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otpMicroLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  otpMainValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  delegateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  delegateBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  supervisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  supervisorText: {
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnTextWhite: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cancelActionBtn: {
    width: 38,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FCB026',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reorderBtnText: {
    color: '#18181B',
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
