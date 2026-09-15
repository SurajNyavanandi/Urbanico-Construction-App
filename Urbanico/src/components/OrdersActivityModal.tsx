import React, { useState, useEffect } from 'react';
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
  Truck,
  MapPin,
  Clock,
  Check,
  X,
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
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import { ActivityDelivery } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './common/EmptyState';
import { useToast } from '../context/ToastContext';
import { LiveDispatcherChatModal } from './common/LiveDispatcherChatModal';
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

const TRACKING_STEPS = [
  { id: 'confirmed', title: 'Order Confirmed', description: 'Order received & materials reserved', status: 'completed' },
  { id: 'processing', title: 'Batching & Loading', description: 'Materials loaded & dispatched from hub', status: 'completed' },
  { id: 'dispatched', title: 'Dispatched with E-Way Bill', description: 'Government E-Way bill #EWB-TS-2026 issued', status: 'completed' },
  { id: 'out_for_delivery', title: 'Live GPS En Route', description: 'Transit via Outer Ring Road (ORR Exit 3)', status: 'active' },
  { id: 'delivered', title: 'Site Delivery & Handover', description: 'Digital OTP sign-off & physical gate delivery', status: 'pending' },
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

  // Live GPS simulation
  const [gpsProgress, setGpsProgress] = useState(68);
  const [gpsSpeed, setGpsSpeed] = useState(42);
  const [etaRemainingMins, setEtaRemainingMins] = useState(24);
  const [distanceKm, setDistanceKm] = useState(3.4);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setGpsProgress((prev) => (prev >= 98 ? 68 : prev + 1));
      setGpsSpeed(Math.floor(38 + Math.random() * 12));
      setDistanceKm((prev) => Math.max(0.8, Math.round((prev - 0.05) * 100) / 100));
      setEtaRemainingMins((prev) => Math.max(4, Math.round(prev > 5 ? prev - 0.2 : prev)));
    }, 4000);
    return () => clearInterval(interval);
  }, [visible]);

  // Sub Modals inside Activity
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

  const handleCallDriver = () => {
    // Direct call action
  };

  const handleCancelOrder = (orderId?: string) => {
    const targetId = orderId || activeEnRoute?.id || activeEnRoute?.orderNumber;
    if (targetId) {
      setCancelledIds((prev) => [...prev, targetId]);
      showToast('Dispatch cancelled. Refund initiated.', 'info');
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
                <Truck size={18} color={theme.textPrimary} strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  My Orders & Live Dispatches
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Live GPS tracking, real-time dispatch & GST Invoices
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
                    <Truck size={32} color={theme.primary} strokeWidth={1.75} />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary, textAlign: 'center', marginBottom: 8, fontFamily: typography.fontFamilyHeading }}>
                    Log in to View Orders
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20, maxWidth: 280 }}>
                    If you previously booked site deliveries with your mobile number, log in to access real-time GPS dispatches, E-Way bills, and GST tax invoices.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      if (onOpenLoginModal) onOpenLoginModal();
                    }}
                    style={{ backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 12 }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Log In or Sign Up</Text>
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
                {/* 1. Live Shipments Vertical Tracking Section & Minimalist Route Tracker */}
                {activeEnRoute && (
                  <View style={[styles.card, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    {/* Header */}
                    <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Text style={[styles.orderNumberTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                          Order #{activeEnRoute.orderNumber || '1001'}
                        </Text>
                        <Text style={[styles.materialSub, { color: theme.textSecondary }]} numberOfLines={1}>
                          {activeEnRoute.materialName || 'Material Delivery'} ({activeEnRoute.quantity || '1 Load'})
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.etaPill, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={[styles.etaPillText, { color: '#15803D' }]} numberOfLines={1}>
                            {etaRemainingMins}m • {distanceKm}km
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                          style={[styles.headerCancelIconBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                          activeOpacity={0.75}
                          accessibilityLabel="Cancel dispatch"
                        >
                          <X size={13} color="#DC2626" strokeWidth={2.4} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Minimalist Non-Overlapping Route Telemetry Track */}
                    <View style={[styles.modernRouteCard, { backgroundColor: theme.mode === 'dark' ? '#0F172A' : '#F1F5F9', borderColor: theme.border }]}>
                      <View style={styles.routePointsRow}>
                        <View style={styles.routePointItem}>
                          <View style={[styles.routePointDot, { backgroundColor: '#0284C7' }]} />
                          <Text style={[styles.routePointLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                            Miyapur Hub
                          </Text>
                        </View>
                        <View style={[styles.routePointItem, { justifyContent: 'flex-end' }]}>
                          <MapPin size={12} color="#DC2626" />
                          <Text style={[styles.routePointLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                            Site Gate 2
                          </Text>
                        </View>
                      </View>

                      <View style={styles.routeTrackContainer}>
                        <View style={[styles.routeTrackBase, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#CBD5E1' }]}>
                          <View style={[styles.routeTrackFill, { width: `${Math.min(94, Math.max(8, gpsProgress))}%`, backgroundColor: '#059669' }]} />
                        </View>
                        <View style={[styles.movingVehicleIconWrapper, { left: `${Math.min(90, Math.max(5, gpsProgress))}%` }]}>
                          <View style={styles.vehiclePulseGlow} />
                          <View style={styles.vehiclePuck}>
                            <Truck size={11} color="#FFFFFF" />
                          </View>
                        </View>
                      </View>

                      <View style={styles.telemetryStrip}>
                        <Text style={[styles.telemetryStripText, { color: theme.textSecondary }]}>
                          Speed: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{gpsSpeed} km/h</Text>
                        </Text>
                        <Text style={[styles.telemetryDotDivider, { color: theme.textMuted }]}>•</Text>
                        <Text style={[styles.telemetryStripText, { color: theme.textSecondary }]}>
                          ETA: <Text style={{ fontWeight: '700', color: '#059669' }}>{etaRemainingMins}m</Text>
                        </Text>
                        <Text style={[styles.telemetryDotDivider, { color: theme.textMuted }]}>•</Text>
                        <Text style={[styles.telemetryStripText, { color: theme.textSecondary }]}>
                          <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{distanceKm}km</Text> remaining
                        </Text>
                      </View>
                    </View>

                    {/* Vehicle & Driver Card */}
                    <View style={[styles.driverDetailRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={styles.driverAvatar}>
                        <UserCheck size={18} color="#111111" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.driverNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                          {activeEnRoute.driverName || 'Assigned Delivery Partner'}
                        </Text>
                        <Text style={[styles.driverMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {activeEnRoute.vehicleNumber || 'AP 28 TE 4920'} • {activeEnRoute.vehicleType || 'Commercial Logistics'}
                        </Text>
                      </View>
                      <View style={styles.driverActionButtons}>
                        <TouchableOpacity onPress={handleCallDriver} style={styles.callDriverBtn} activeOpacity={0.75}>
                          <PhoneCall size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowChatModal(true)} style={styles.chatDriverBtn} activeOpacity={0.75}>
                          <MessageSquare size={14} color="#111111" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Vertical Tracking Milestones */}
                    <View style={styles.milestonesSection}>
                      <Text style={[styles.sectionMicroTitle, { color: theme.textMuted }]}>
                        DISPATCH TIMELINE & E-WAY STATUS
                      </Text>
                      {TRACKING_STEPS.map((step, idx) => {
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
                                {isDone && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                {isActive && <View style={styles.activeInnerPulse} />}
                              </View>
                              {idx < TRACKING_STEPS.length - 1 && (
                                <View
                                  style={[
                                    styles.timelineLine,
                                    isDone ? styles.lineCompleted : styles.linePending,
                                  ]}
                                />
                              )}
                            </View>
                            <View style={styles.timelineContentCol}>
                              <Text
                                style={[
                                  styles.stepTitle,
                                  { color: isDone || isActive ? theme.textPrimary : theme.textMuted },
                                ]}
                              >
                                {step.title}
                              </Text>
                              <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
                                {step.description}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Fast Action Quick Buttons */}
                    <View style={styles.actionGridRow}>
                      <TouchableOpacity
                        onPress={() => setShowChatModal(true)}
                        style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <MessageSquare size={14} color="#111111" />
                        <Text style={[styles.quickActionBtnText, { color: theme.textPrimary }]}>Live Dispatch</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowSupervisorModal(true)}
                        style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <ShieldCheck size={14} color="#059669" />
                        <Text style={[styles.quickActionBtnText, { color: theme.textPrimary }]}>Supervisor</Text>
                      </TouchableOpacity>

                      {/* Cancel Button - Icon Only! */}
                      <TouchableOpacity
                        onPress={() => handleCancelOrder(activeEnRoute.id || activeEnRoute.orderNumber)}
                        style={[styles.cancelQuickBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}
                        activeOpacity={0.75}
                        accessibilityLabel="Cancel dispatch"
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
                            <Repeat size={13} color="#FFFFFF" />
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
      <LiveDispatcherChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        orderNumber={activeEnRoute?.orderNumber}
        driverName={activeEnRoute?.driverName}
      />
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
  modernRouteCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    margin: 10,
    marginBottom: 4,
    gap: 8,
  },
  routePointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routePointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  routePointDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  routePointLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeTrackContainer: {
    height: 22,
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
    marginTop: -11,
    marginLeft: -11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePulseGlow: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(5, 150, 105, 0.25)',
  },
  vehiclePuck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingTop: 2,
  },
  telemetryStripText: {
    fontSize: 10.5,
  },
  telemetryDotDivider: {
    fontSize: 9,
  },
  driverDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  driverAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverNameText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  driverMetaText: {
    fontSize: 11,
    marginTop: 1,
  },
  driverActionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  callDriverBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatDriverBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestonesSection: {
    padding: 12,
  },
  sectionMicroTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 38,
  },
  timelineIndicatorCol: {
    width: 24,
    alignItems: 'center',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D4D4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: '#059669',
  },
  dotActive: {
    backgroundColor: '#2563EB',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  activeInnerPulse: {
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
  lineCompleted: {
    backgroundColor: '#059669',
  },
  linePending: {
    backgroundColor: '#E4E4E7',
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 8,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 10.5,
    marginTop: 1,
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
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cancelQuickBtn: {
    width: 38,
    height: 34,
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
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reorderBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  primaryDoneBtn: {
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 9,
    alignItems: 'center',
  },
  primaryDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
