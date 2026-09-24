import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {
  Package,
  MapPin,
  Clock,
  Check,
  X,
  FileText,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Repeat,
  CheckCircle2,
  Building2,
  Phone,
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './common/EmptyState';
import { useToast } from '../context/ToastContext';
import { SupervisorHandoffModal } from './common/SupervisorHandoffModal';
import { formatSiteAddress } from '../utils/addressHelper';

interface OrdersActivityModalProps {
  visible: boolean;
  onClose: () => void;
  deliveries: ActivityDelivery[];
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

export const OrdersActivityModal: React.FC<OrdersActivityModalProps> = ({
  visible,
  onClose,
  deliveries = [],
  onExploreCatalog,
  onViewInvoice,
  onReorderMaterial,
  isLoggedIn = true,
  onOpenLoginModal,
}) => {
  const { theme, typography } = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Sub Modals inside Activity
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

  const handleCancelOrder = (orderId?: string) => {
    const targetId = orderId || activeEnRoute?.id || activeEnRoute?.orderNumber;
    if (targetId) {
      setCancelledIds((prev) => [...prev, targetId]);
      showToast('Order delivery cancelled. Refund initiated.', 'info');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={[styles.headerIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <Package size={18} color={theme.textPrimary} strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  My Orders & Delivery Activity
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Order status, lifecycle milestones & GST invoices
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
              activeOpacity={0.7}
              accessibilityLabel="Close orders modal"
            >
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
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
                <View style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, alignItems: 'center', padding: 24 }]}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Package size={32} color={theme.primary} strokeWidth={1.75} />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 8, fontFamily: typography.fontFamilyHeading }}>
                    Log in to View Orders
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20, maxWidth: 280 }}>
                    If you previously booked site deliveries with your mobile number, log in to access order milestones, E-Way bills, and GST tax invoices.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      if (onOpenLoginModal) onOpenLoginModal();
                    }}
                    style={{ backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 12 }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: theme.primaryText || '#18181B', fontWeight: '700', fontSize: 14 }}>Log In or Sign Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      if (onExploreCatalog) onExploreCatalog();
                    }}
                    style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>Explore Catalog</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <EmptyState
                  type="no-orders"
                  onAction={() => {
                    onClose();
                    if (onExploreCatalog) onExploreCatalog();
                  }}
                  actionLabel="Explore Catalog"
                />
              )
            ) : (
              <>
                {/* 1. Active Order Vertical Lifecycle Hierarchy Card */}
                {activeEnRoute && (
                  <View style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    {/* Header */}
                    <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Text style={[styles.orderNumberTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                            Order #{activeEnRoute.orderNumber || '1001'}
                          </Text>
                          <View style={[styles.statusBadgePill, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>
                              IN TRANSIT
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.materialSub, { color: theme.textSecondary }]} numberOfLines={1}>
                          {activeEnRoute.materialName || 'Material Delivery'} • {activeEnRoute.quantity || '1 Load'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.etaPill, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                          <Clock size={11} color={theme.textSecondary} />
                          <Text style={[styles.etaPillText, { color: theme.textPrimary }]} numberOfLines={1}>
                            Est. {activeEnRoute.estimatedArrival || 'Today'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                          style={[styles.headerCancelIconBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                          activeOpacity={0.75}
                          accessibilityLabel="Cancel order"
                        >
                          <X size={13} color="#DC2626" strokeWidth={2.4} />
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
                    <View style={[styles.deliveryInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                      <View style={[styles.otpRowContainer, { borderTopColor: theme.border }]}>
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
                          style={[styles.delegateBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                          activeOpacity={0.75}
                        >
                          <UserCheck size={12} color={theme.textPrimary} />
                          <Text style={[styles.delegateBtnText, { color: theme.textPrimary }]}>
                            Delegate
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Assigned Site Supervisor */}
                      <View style={[styles.supervisorRow, { borderTopColor: theme.border }]}>
                        <ShieldCheck size={14} color="#0284C7" />
                        <Text style={[styles.supervisorText, { color: theme.textSecondary }]}>
                          Site Incharge: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{supervisorData.name}</Text> ({supervisorData.phone})
                        </Text>
                      </View>
                    </View>

                    {/* Fast Action Quick Buttons */}
                    <View style={styles.actionGridRow}>
                      {Boolean(onViewInvoice) && (
                        <TouchableOpacity
                          onPress={() => onViewInvoice(activeEnRoute)}
                          style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                          activeOpacity={0.75}
                        >
                          <FileText size={14} color={theme.textPrimary} />
                          <Text style={[styles.quickActionBtnText, { color: theme.textPrimary }]}>GST Tax Invoice</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => setShowSupervisorModal(true)}
                        style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <ShieldCheck size={14} color="#059669" />
                        <Text style={[styles.quickActionBtnText, { color: theme.textPrimary }]}>Site Supervisor</Text>
                      </TouchableOpacity>

                      {/* Cancel Button */}
                      <TouchableOpacity
                        onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                        style={[styles.cancelQuickBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                        activeOpacity={0.75}
                        accessibilityLabel="Cancel order"
                      >
                        <X size={15} color="#DC2626" strokeWidth={2.4} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 2. All Orders & Delivery Ledger List */}
                <View style={styles.allOrdersHeaderRow}>
                  <Text style={[styles.allOrdersHeading, { color: theme.textPrimary }]}>
                    All Site Deliveries ({validDeliveries.length})
                  </Text>
                  <Text style={[styles.allOrdersSub, { color: theme.textMuted }]}>
                    Total: ₹{totalSpent.toLocaleString('en-IN')}
                  </Text>
                </View>

                {validDeliveries.map((del, dIdx) => {
                  const isCancelled = cancelledIds.includes(del?.id) || (del?.status || '').toLowerCase() === 'cancelled';
                  const statusStr = isCancelled ? 'Cancelled' : (del?.status || 'Processing');
                  const isDelivered = statusStr.toLowerCase() === 'delivered';
                  return (
                    <View
                      key={del?.id || `del_${dIdx}`}
                      style={[styles.orderItemCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                    >
                      <View style={styles.orderItemCardTop}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={styles.orderItemBadgeRow}>
                            <Text style={[styles.orderItemNumber, { color: theme.textPrimary }]} numberOfLines={1}>
                              #{del?.orderNumber || `100${dIdx + 1}`}
                            </Text>
                            <View
                              style={[
                                styles.statusBadgePill,
                                isCancelled
                                  ? { backgroundColor: '#FEE2E2' }
                                  : isDelivered
                                  ? { backgroundColor: '#DCFCE7' }
                                  : { backgroundColor: '#FEF3C7' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  isCancelled
                                    ? { color: '#DC2626' }
                                    : isDelivered
                                    ? { color: '#15803D' }
                                    : { color: '#B45309' },
                                ]}
                                numberOfLines={1}
                              >
                                {statusStr.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.orderItemName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {del?.materialName || 'Construction Material'}
                          </Text>
                          <Text style={[styles.orderItemMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                            {del?.quantity || '1 Load'} • <Text style={{ textDecorationLine: isCancelled ? 'line-through' : 'none', fontWeight: '700' }}>₹{del?.totalAmount ? del.totalAmount.toLocaleString('en-IN') : '0'}</Text> • {formatSiteAddress(del?.siteAddress)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.orderItemActionsRow, { borderTopColor: theme.border }]}>
                        {Boolean(onViewInvoice) && (
                          <TouchableOpacity
                            onPress={() => onViewInvoice(del)}
                            style={[styles.invoiceBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            activeOpacity={0.75}
                          >
                            <FileText size={13} color="#64748B" />
                            <Text style={[styles.invoiceBtnText, { color: theme.textSecondary }]}>Invoice (PDF)</Text>
                          </TouchableOpacity>
                        )}

                        {Boolean(onReorderMaterial && del?.materialName) && (
                          <TouchableOpacity
                            onPress={() => {
                              onClose();
                              onReorderMaterial(del.materialName);
                            }}
                            style={styles.reorderBtn}
                            activeOpacity={0.8}
                          >
                            <Repeat size={13} color="#18181B" />
                            <Text style={styles.reorderBtnText}>Buy Again</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.primaryDoneBtn} activeOpacity={0.85}>
              <Text style={styles.primaryDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sub-modals */}
      <SupervisorHandoffModal
        visible={showSupervisorModal}
        onClose={() => setShowSupervisorModal(false)}
        orderNumber={activeEnRoute?.orderNumber}
        currentSupervisorName={supervisorData.name}
        currentSupervisorPhone={supervisorData.phone}
        onSaveSupervisor={(name, phone) => {
          setSupervisorData({ name, phone });
          setShowSupervisorModal(false);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalBody: {
    maxHeight: 520,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  orderNumberTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  materialSub: {
    fontSize: 12,
    marginTop: 2,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  etaPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerCancelIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestonesSection: {
    padding: 14,
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
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    marginHorizontal: 12,
    marginBottom: 12,
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
  actionGridRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cancelQuickBtn: {
    width: 38,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allOrdersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  allOrdersHeading: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  allOrdersSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  orderItemCardTop: {
    padding: 12,
  },
  orderItemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderItemNumber: {
    fontSize: 12.5,
    fontWeight: '800',
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
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  orderItemMeta: {
    fontSize: 11.5,
  },
  orderItemActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  invoiceBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FCB026',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reorderBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#18181B',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  primaryDoneBtn: {
    backgroundColor: '#FCB026',
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 9,
    alignItems: 'center',
  },
  primaryDoneBtnText: {
    color: '#18181B',
    fontSize: 13,
    fontWeight: '700',
  },
});

