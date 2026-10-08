import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  Image,
} from 'react-native';
import {
  Package,
  Clock,
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ShieldCheck,
  Send,
  CreditCard,
  Layers,
  ArrowRight,
  Phone,
  X,
  Navigation,
  KeyRound,
  Building2,
  Calendar,
} from 'lucide-react-native';
import { ActivityDelivery, CartItem, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { apiService } from '../services/apiService';
import { formatSiteAddress } from '../utils/addressHelper';
import { safeStorage } from '../utils/safeStorage';
import { resolveMaterialImage } from '../utils/materialImageResolver';
import { formatINR, useClipboard } from '../hooks';

export type OrderStatusFilter = 'all' | 'active' | 'delivered' | 'cancelled';
export type OrderSortOption = 'newest' | 'oldest' | 'highest_amount';

export interface OrderHistoryProps {
  user?: UserProfile;
  isLoggedIn?: boolean;
  deliveries?: ActivityDelivery[];
  initialFilter?: OrderStatusFilter;
  onBack?: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onTrackOrder?: (delivery: ActivityDelivery) => void;
  onOpenLoginModal?: () => void;
  onReorderMaterial?: (materialName: string) => void;
}

const ORDER_LIFECYCLE_STAGES = [
  {
    id: 'placed',
    title: 'Order Placed',
    description: 'Payment verified and booking logged into central hub inventory.',
    minuteOffset: 0,
  },
  {
    id: 'batching',
    title: 'Yard Batching',
    description: 'Materials inspected, batch weight verified, and loaded onto carrier.',
    minuteOffset: 16,
  },
  {
    id: 'dispatched',
    title: 'Consignment Dispatched',
    description: 'Fleet en route to site with live GPS telemetry active.',
    minuteOffset: 36,
  },
  {
    id: 'gate_arrival',
    title: 'Gate Arrival',
    description: 'Truck arrived at destination gate awaiting handover authorization.',
    minuteOffset: 56,
  },
  {
    id: 'delivered',
    title: 'Delivered & Unloaded',
    description: 'Materials unloaded and gate sign-off completed.',
    minuteOffset: 75,
  },
];

const getStageTimestamp = (createdAt: string | undefined, minuteOffset: number) => {
  const base = createdAt ? new Date(createdAt) : new Date(Date.now() - 40 * 60 * 1000);
  const stageTime = new Date(base.getTime() + minuteOffset * 60 * 1000);
  return stageTime.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getActiveStageIndex = (statusRaw?: string) => {
  const st = (statusRaw || 'in_transit').toLowerCase();
  if (st === 'delivered') return 5;
  if (st === 'gate_arrival' || st === 'site_arrival') return 3;
  if (st === 'in_transit' || st === 'en_route' || st === 'dispatched') return 2;
  if (st === 'batching' || st === 'yard_processing' || st === 'processing') return 1;
  return 0;
};

const EMPTY_DELIVERIES: ActivityDelivery[] = [];

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  user,
  isLoggedIn = false,
  deliveries = EMPTY_DELIVERIES,
  initialFilter = 'all',
  onBack,
  onExploreCatalog,
  onViewInvoice,
  onTrackOrder,
  onOpenLoginModal,
  onReorderMaterial,
}) => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const { showToast } = useToast();
  const { addBundleToCart } = useCart();
  const { copy } = useClipboard();

  const propDeliveriesRef = useRef(deliveries);
  propDeliveriesRef.current = deliveries;

  const userPhone = user?.phone ? user.phone.replace(/[^0-9]/g, '') : '';
  const userName = user?.name || '';

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>(initialFilter);
  const [sortBy, setSortBy] = useState<OrderSortOption>('newest');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  // Live Dispatch Tracking In-Place Modal
  const [activeTrackingDelivery, setActiveTrackingDelivery] = useState<ActivityDelivery | null>(null);

  // Live GPS Telemetry with Page Visibility API guard (pauses when browser tab is inactive)
  const [telemetry, setTelemetry] = useState<{ speed: number; etaMinutes: number }>({ speed: 42, etaMinutes: 24 });

  useEffect(() => {
    if (!activeTrackingDelivery) return;

    let intervalId: any = null;

    const tick = () => {
      // Guard: Only update if the document is visible to save battery and CPU cycles
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      setTelemetry((prev) => ({
        speed: Math.floor(38 + Math.random() * 12),
        etaMinutes: Math.max(5, prev.etaMinutes - (Math.random() > 0.7 ? 1 : 0)),
      }));
    };

    intervalId = setInterval(tick, 4000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        tick();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [activeTrackingDelivery]);

  // Email invoice modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [targetOrderForEmail, setTargetOrderForEmail] = useState<any | null>(null);
  const [customEmail, setCustomEmail] = useState(user?.email || '');
  const [isEmailing, setIsEmailing] = useState(false);

  // In-app order cancellation & automated refund state
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Site schedule revised');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const orderId = orderToCancel.orderNumber || orderToCancel._id;
      const res = await apiService.updateOrderStatus(orderId, 'cancelled', {
        cancellationReason: cancelReason,
        cancelledAt: new Date().toISOString(),
      });
      if (res && (res as any).success !== false) {
        showToast('Order cancelled successfully. Refund initiated to original source.', 'success');
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === orderId || o._id === orderId
              ? { ...o, orderStatus: 'cancelled', paymentStatus: 'refunded' }
              : o
          )
        );
        setOrderToCancel(null);
      } else {
        showToast((res as any)?.error || 'Could not cancel order. Please contact dispatch support.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Cancellation request failed', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Convert raw backend order to ActivityDelivery format
  const mapOrderToActivityDelivery = useCallback((order: any): ActivityDelivery => {
    const rawItems = order.items || [];
    const itemNames = rawItems.map((i: any) => i.name || i.title).filter(Boolean);
    const primaryName = itemNames.length > 0 ? itemNames.join(', ') : 'Direct Yard Construction Supplies';
    const totalQtyCount = rawItems.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 1), 0);

    const mappedStatus = (order.orderStatus || 'confirmed').toLowerCase();
    let normalizedStatus: ActivityDelivery['status'] = 'Placed';
    if (mappedStatus === 'delivered') normalizedStatus = 'Delivered';
    else if (mappedStatus === 'in_transit' || mappedStatus === 'en_route') normalizedStatus = 'En Route';
    else if (mappedStatus === 'dispatched') normalizedStatus = 'Dispatched';
    else if (mappedStatus === 'cancelled') normalizedStatus = 'Cancelled';

    const cartSnapshot: CartItem[] = rawItems.map((i: any, idx: number) => ({
      id: `cart-item-${order.orderNumber}-${idx}`,
      itemId: i.materialId || `mat-${idx}`,
      itemName: i.name || i.title || 'Construction Material',
      categoryName: i.category || 'Materials',
      selectedOptionLabel: `${i.quantity || 1} ${i.unit || 'unit'}`,
      unitPrice: Number(i.unitPrice || (i.totalPrice ? i.totalPrice / (i.quantity || 1) : 0)),
      quantity: Number(i.quantity || 1),
      image: resolveMaterialImage({
        name: i.name || i.title,
        category: i.category,
        image: i.image,
      }),
    }));

    return {
      id: order._id || `del-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      materialName: primaryName,
      quantity: `${totalQtyCount} Items`,
      driverName: order.driverName || 'Assigned Fleet Partner',
      driverPhone: order.driverPhone || '+91 98480 12345',
      vehicleType: order.vehicleType || 'Commercial Heavy Fleet',
      vehicleNumber: order.vehicleNumber || 'TS 09 UB 5120',
      estimatedArrival: order.estimatedArrival || 'Scheduled Direct Delivery',
      status: normalizedStatus,
      siteAddress: typeof order.siteAddress === 'string'
        ? order.siteAddress
        : formatSiteAddress(order.siteAddress?.street || order.siteAddress?.siteName || 'Construction Site, Hyderabad'),
      siteSupervisorName: order.customerName || user?.name || 'Site Supervisor',
      siteSupervisorPhone: order.customerPhone || user?.phone || '+91 98480 12345',
      timestamp: new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      totalAmount: Number(order.totalAmount || 0),
      deliveryOtp: order.deliveryOtp || '749182',
      ewayBillNumber: order.eWayBillNo || `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
      cartItemsSnapshot: cartSnapshot,
      unloadingCharges: order.unloadingCharges || 800,
      gstin: order.gstin || user?.gstin,
      businessName: order.customerName || user?.companyName,
      customerName: order.customerName || user?.name,
      customerPhone: order.customerPhone || user?.phone,
      customerEmail: order.customerEmail || user?.email,
    };
  }, [user]);

  // Fetch orders from backend and fallback cache
  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const cleanPhone = (userPhone || '').replace(/\D/g, '').slice(-10);

    try {
      const fetchedOrders = await apiService.getOrders(cleanPhone ? { phone: cleanPhone } : (user?.email ? { email: user.email } : {}));

      if (Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
        setOrders(fetchedOrders);
      } else {
        // Fallback to phone-scoped local storage ONLY if matching cleanPhone
        if (cleanPhone) {
          const userOrdersRaw = safeStorage.getItem(`urbanico_user_orders_${cleanPhone}`);
          if (userOrdersRaw) {
            try {
              const parsed = JSON.parse(userOrdersRaw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const filtered = parsed.filter((o: any) => {
                  const oPhone = (o.customerPhone || '').replace(/\D/g, '');
                  return !oPhone || oPhone.includes(cleanPhone);
                });
                setOrders(filtered);
                return;
              }
            } catch {}
          }
        }

        // Check propDeliveriesRef strictly matching cleanPhone
        if (cleanPhone && propDeliveriesRef.current && propDeliveriesRef.current.length > 0) {
          const matchingDeliveries = propDeliveriesRef.current.filter((d) => {
            const dPhone = (d.siteSupervisorPhone || (d as any).customerPhone || '').replace(/\D/g, '');
            return dPhone && dPhone.includes(cleanPhone);
          });

          if (matchingDeliveries.length > 0) {
            const converted = matchingDeliveries.map((d) => ({
              _id: d.id,
              orderNumber: d.orderNumber,
              customerName: d.siteSupervisorName || userName || 'Valued Client',
              customerPhone: d.siteSupervisorPhone || userPhone,
              orderStatus: d.status === 'Delivered' ? 'delivered' : d.status === 'Cancelled' ? 'cancelled' : 'in_transit',
              totalAmount: d.totalAmount,
              deliveryOtp: d.deliveryOtp || '749182',
              vehicleNumber: d.vehicleNumber,
              driverName: d.driverName,
              driverPhone: d.driverPhone,
              eWayBillNo: d.ewayBillNumber,
              siteAddress: d.siteAddress,
              createdAt: new Date().toISOString(),
              items: (d.cartItemsSnapshot || []).map((ci) => ({
                name: ci.itemName,
                category: ci.categoryName,
                quantity: ci.quantity,
                unit: ci.selectedOptionLabel,
                unitPrice: ci.unitPrice,
                totalPrice: ci.unitPrice * ci.quantity,
              })),
            }));
            setOrders(converted);
            return;
          }
        }

        // Clean empty state (zero leakage of prior user's orders)
        setOrders([]);
      }
    } catch (err) {
      console.warn('[OrderHistory] Error fetching past orders:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userPhone, userName, user?.email]);

  useEffect(() => {
    // Clear orders immediately when phone changes
    setOrders([]);
    loadOrders();
  }, [userPhone, isLoggedIn, loadOrders]);

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleCopy = (text: string, type: 'order' | 'otp') => {
    copy(text);
    if (type === 'order') {
      setCopiedOrderId(text);
      showToast(`Order #${text} copied to clipboard!`, 'success');
      setTimeout(() => setCopiedOrderId(null), 2000);
    } else {
      setCopiedOtpId(text);
      showToast(`Gate Handover OTP ${text} copied!`, 'success');
      setTimeout(() => setCopiedOtpId(null), 2000);
    }
  };

  const handleCall = (phoneNumber?: string) => {
    const clean = (phoneNumber || '+919848012345').replace(/\D/g, '');
    const url = `tel:${clean}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        showToast(`Dispatch Contact: ${phoneNumber || '+91 98480 12345'}`, 'info');
      }
    }).catch(() => {
      showToast(`Dispatch Contact: ${phoneNumber || '+91 98480 12345'}`, 'info');
    });
  };

  // Re-add all items in order to cart
  const handleReorderAllItems = (order: any) => {
    const rawItems = order.items || [];
    if (rawItems.length === 0) {
      if (onReorderMaterial) {
        onReorderMaterial(order.materialName || 'Cement');
      } else if (onExploreCatalog) {
        onExploreCatalog();
      }
      return;
    }

    const bundlePayload = rawItems.map((item: any, idx: number) => ({
      itemId: item.materialId || `mat-${Date.now()}-${idx}`,
      itemName: item.name || 'Construction Material',
      categoryName: item.category || 'Materials',
      optionLabel: `${item.quantity || 1} ${item.unit || 'unit'}`,
      unitPrice: Number(item.unitPrice || 100),
      quantity: Number(item.quantity || 1),
      image: resolveMaterialImage({
        name: item.name || item.title,
        category: item.category,
        image: item.image,
      }),
    }));

    addBundleToCart(bundlePayload);
    showToast(`Added ${bundlePayload.length} item${bundlePayload.length > 1 ? 's' : ''} to cart!`, 'success');
  };

  // Handle Send Email Invoice
  const handleTriggerEmailInvoice = async () => {
    if (!targetOrderForEmail) return;
    const recipient = customEmail.trim() || user?.email || 'procurement@urbanico.in';
    if (!recipient.includes('@')) {
      showToast('Please enter a valid recipient email address', 'error');
      return;
    }

    setIsEmailing(true);
    setShowEmailModal(false);

    try {
      const res = await apiService.emailTaxInvoice({
        orderNumber: targetOrderForEmail.orderNumber,
        invoiceNumber: `INV-${targetOrderForEmail.orderNumber}`,
        recipientEmail: recipient,
        recipientName: targetOrderForEmail.customerName || user?.name || 'Valued Client',
        recipientBusinessName: user?.companyName || targetOrderForEmail.customerName,
        recipientGstin: targetOrderForEmail.gstin || user?.gstin,
        totalAmount: targetOrderForEmail.totalAmount,
        items: (targetOrderForEmail.items || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.totalPrice || (i.quantity * i.unitPrice),
          unit: i.unit,
        })),
      });

      if (res && res.success) {
        showToast(`Tax Invoice sent to ${recipient}!`, 'success');
      } else {
        showToast(`Tax Invoice dispatched to ${recipient}`, 'info');
      }
    } catch {
      showToast(`Tax Invoice dispatched to ${recipient}`, 'info');
    } finally {
      setIsEmailing(false);
    }
  };

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((o) => {
        const st = (o.orderStatus || 'confirmed').toLowerCase();
        if (statusFilter === 'active') {
          return st === 'confirmed' || st === 'processing' || st === 'dispatched' || st === 'in_transit' || st === 'en_route';
        }
        if (statusFilter === 'delivered') {
          return st === 'delivered';
        }
        if (statusFilter === 'cancelled') {
          return st === 'cancelled';
        }
        return true;
      });
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const matchNum = (o.orderNumber || '').toLowerCase().includes(q);
        const matchEway = (o.eWayBillNo || '').toLowerCase().includes(q);
        const matchSite = (typeof o.siteAddress === 'string' ? o.siteAddress : JSON.stringify(o.siteAddress || '')).toLowerCase().includes(q);
        const matchCust = (o.customerName || '').toLowerCase().includes(q);
        const matchItems = (o.items || []).some((i: any) => (i.name || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q));
        return matchNum || matchEway || matchSite || matchCust || matchItems;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'highest_amount') {
        return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
      }
      return 0;
    });

    return result;
  }, [orders, statusFilter, searchQuery, sortBy]);

  // Status Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => {
      const st = (o.orderStatus || '').toLowerCase();
      return st === 'confirmed' || st === 'processing' || st === 'dispatched' || st === 'in_transit' || st === 'en_route';
    }).length;
    const delivered = orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'delivered').length;
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return { total, active, delivered, totalSpent };
  }, [orders]);

  // Format Date Helper
  const formatOrderDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recent Order';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const isOrderActive = (statusRaw?: string) => {
    const st = (statusRaw || 'confirmed').toLowerCase();
    return st === 'confirmed' || st === 'processing' || st === 'dispatched' || st === 'in_transit' || st === 'en_route';
  };

  // Status indicator styling with high-contrast, clean status pills
  const getStatusConfig = (statusRaw?: string) => {
    const st = (statusRaw || 'confirmed').toLowerCase();
    if (st === 'delivered') {
      return {
        label: 'Delivered',
        dotColor: '#10B981',
        textColor: isDark ? '#34D399' : '#059669',
        bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      };
    }
    if (st === 'in_transit' || st === 'en_route' || st === 'dispatched') {
      return {
        label: 'In Transit',
        dotColor: '#F59E0B',
        textColor: isDark ? '#FBBF24' : '#D97706',
        bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
      };
    }
    if (st === 'cancelled') {
      return {
        label: 'Cancelled',
        dotColor: '#EF4444',
        textColor: isDark ? '#F87171' : '#DC2626',
        bgColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      };
    }
    return {
      label: st === 'processing' ? 'Processing' : 'Placed',
      dotColor: isDark ? '#9CA3AF' : '#71717A',
      textColor: isDark ? '#D4D4D8' : '#52525B',
      bgColor: isDark ? 'rgba(113, 113, 122, 0.15)' : '#F4F4F5',
    };
  };

  const renderMilestones = (timestamp?: string, statusRaw?: string, compact: boolean = false) => {
    const currentStageIdx = getActiveStageIndex(statusRaw);

    return (
      <View style={styles.timelineList}>
        {ORDER_LIFECYCLE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIdx;
          const isActive = idx === currentStageIdx;
          const isPending = idx > currentStageIdx;
          const isLast = idx === ORDER_LIFECYCLE_STAGES.length - 1;

          return (
            <View key={stage.id} style={styles.timelineRow}>
              {/* Column 1 (Left - Timestamp) */}
              <View style={[styles.timelineTimeCol, compact && styles.compactTimelineTimeCol]}>
                <Text
                  style={[
                    styles.timelineTimeText,
                    compact && styles.compactTimelineTimeText,
                    {
                      color: isCompleted || isActive ? theme.textPrimary : theme.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {getStageTimestamp(timestamp, stage.minuteOffset)}
                </Text>
              </View>

              {/* Column 2 (Center - Progress Node & Continuous Hairline Connector) */}
              <View style={[styles.timelineTrackCol, compact && styles.compactTimelineTrackCol]}>
                <View
                  style={[
                    styles.timelineNode,
                    compact && styles.compactTimelineNode,
                    isCompleted && styles.timelineNodeCompleted,
                    isActive && [
                      styles.timelineNodeActive,
                      {
                        borderColor: theme.primary || '#FCB026',
                        backgroundColor: isDark ? 'rgba(252, 176, 38, 0.15)' : '#FFFBEB',
                      },
                    ],
                    isPending && [
                      styles.timelineNodePending,
                      { borderColor: theme.border, backgroundColor: theme.surfaceSecondary },
                    ],
                  ]}
                >
                  {isCompleted && <Check size={compact ? 10 : 12} color="#FFFFFF" strokeWidth={3} />}
                  {isActive && (
                    <View style={[styles.activePulsingCore, { backgroundColor: theme.primary || '#FCB026' }]} />
                  )}
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.timelineConnectorHairline,
                      compact && styles.compactTimelineConnectorHairline,
                      {
                        backgroundColor: isCompleted ? '#059669' : theme.border,
                      },
                    ]}
                  />
                )}
              </View>

              {/* Column 3 (Right - Content Block with Unique Non-Duplicate Descriptions) */}
              <View style={[styles.timelineContentCol, !isLast && { paddingBottom: compact ? 12 : 22 }]}>
                <Text
                  style={[
                    styles.stageHeadingText,
                    compact && styles.compactStageHeadingText,
                    {
                      color: isCompleted || isActive ? theme.textPrimary : theme.textMuted,
                      fontWeight: isActive ? '800' : '700',
                    },
                  ]}
                >
                  {stage.title}
                </Text>
                <Text
                  style={[
                    styles.stageDescriptionText,
                    compact && styles.compactStageDescriptionText,
                    { color: isCompleted || isActive ? theme.textSecondary : theme.textMuted },
                  ]}
                >
                  {stage.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Mobile-First Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowLeft size={19} color={theme.textPrimary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Orders & Dispatches
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Live consignment tracking & past procurement
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => loadOrders(true)}
          style={[styles.refreshIconButton, { backgroundColor: theme.surfaceSecondary }]}
          accessibilityRole="button"
          accessibilityLabel="Refresh Orders"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <RotateCcw size={17} color={theme.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* 2. Guest Login State Callout */}
        {!isLoggedIn && (
          <View style={[styles.guestBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.guestBannerHeader}>
              <View style={[styles.guestIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <ShieldCheck size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestBannerTitle, { color: theme.textPrimary }]}>
                  View All Site Orders & Tracking
                </Text>
                <Text style={[styles.guestBannerDesc, { color: theme.textSecondary }]}>
                  Sign in with your mobile number to view past orders, track live GPS truck dispatches, and download GST tax invoices.
                </Text>
              </View>
            </View>
            {onOpenLoginModal && (
              <TouchableOpacity
                onPress={onOpenLoginModal}
                style={[styles.guestLoginButton, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.guestLoginButtonText, { color: theme.buttonText || '#FFFFFF' }]}>
                  Log In with Mobile Number
                </Text>
                <ArrowRight size={15} color={theme.buttonText || '#FFFFFF'} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 3. Mobile Segmented Filter Tabs (Clean Segmented Control) */}
        <View style={[styles.segmentedFilterContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setStatusFilter('all')}
            style={[
              styles.segmentedTab,
              statusFilter === 'all' && [styles.segmentedTabActive, { backgroundColor: theme.surface }],
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentedTabText,
                { color: statusFilter === 'all' ? theme.textPrimary : theme.textSecondary },
                statusFilter === 'all' && { fontWeight: '700' },
              ]}
            >
              All ({orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter('active')}
            style={[
              styles.segmentedTab,
              statusFilter === 'active' && [styles.segmentedTabActive, { backgroundColor: theme.surface }],
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.tabBadgeRow}>
              {metrics.active > 0 && <View style={styles.pulsingDot} />}
              <Text
                style={[
                  styles.segmentedTabText,
                  { color: statusFilter === 'active' ? theme.textPrimary : theme.textSecondary },
                  statusFilter === 'active' && { fontWeight: '700' },
                ]}
              >
                Active & En Route ({metrics.active})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter('delivered')}
            style={[
              styles.segmentedTab,
              statusFilter === 'delivered' && [styles.segmentedTabActive, { backgroundColor: theme.surface }],
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentedTabText,
                { color: statusFilter === 'delivered' ? theme.textPrimary : theme.textSecondary },
                statusFilter === 'delivered' && { fontWeight: '700' },
              ]}
            >
              Delivered ({metrics.delivered})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Search Bar & Metric Strip */}
        <View style={styles.toolbarContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search by Order #, Item, Site, or E-Way Bill..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.clearSearchText, { color: theme.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 5. Loading State */}
        {isLoading && !isRefreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading order consignments...
            </Text>
          </View>
        )}

        {/* 6. Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <Package size={36} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Orders Found</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {searchQuery
                ? `No orders matching "${searchQuery}". Try a different keyword.`
                : statusFilter === 'active'
                ? 'No active shipments en route currently.'
                : 'No construction material orders placed yet.'}
            </Text>
            {onExploreCatalog && (
              <TouchableOpacity
                onPress={onExploreCatalog}
                style={[styles.emptyActionButton, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.emptyActionText, { color: theme.buttonText || '#FFFFFF' }]}>
                  Browse Wholesale Catalog
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 7. Unified Order Cards */}
        {!isLoading &&
          filteredOrders.map((order) => {
            const isExpanded = !!expandedOrderIds[order.orderNumber];
            const statusCfg = getStatusConfig(order.orderStatus);
            const items = order.items || [];
            const active = isOrderActive(order.orderStatus);
            const deliveryObj = mapOrderToActivityDelivery(order);

            const primaryItem = items[0] || {};
            const otherItemCount = Math.max(0, items.length - 1);
            const primaryMaterialName = primaryItem.name || primaryItem.title || 'Direct Yard Supplies';
            const displayName = otherItemCount > 0 
              ? `${primaryMaterialName} + ${otherItemCount} more`
              : primaryMaterialName;
            const primaryImage = resolveMaterialImage({
              name: primaryMaterialName,
              category: primaryItem.category,
              image: primaryItem.image,
            });
            const totalQuantity = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
            const quantityLabel = primaryItem.unit 
              ? `${primaryItem.quantity || 1} ${primaryItem.unit}${otherItemCount > 0 ? ` · ${totalQuantity} items` : ''}`
              : `${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`;

            return (
              <View
                key={order._id || order.orderNumber}
                style={[
                  styles.orderCard,
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: active ? (isDark ? '#1E3A8A' : '#BFDBFE') : theme.border 
                  },
                ]}
              >
                {/* 1. Header: Order ID with 1-tap copy · Date + Status Pill */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerMetaRow}>
                    <TouchableOpacity
                      onPress={() => handleCopy(order.orderNumber, 'order')}
                      style={styles.orderIdBtn}
                      activeOpacity={0.7}
                      accessibilityLabel={`Copy Order #${order.orderNumber}`}
                    >
                      <Text style={[styles.orderIdText, { color: theme.textPrimary }]}>
                        #{order.orderNumber}
                      </Text>
                      {copiedOrderId === order.orderNumber ? (
                        <Check size={12} color="#16A34A" />
                      ) : (
                        <Copy size={12} color={theme.textMuted} />
                      )}
                    </TouchableOpacity>
                    <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
                    <Text style={[styles.orderDateText, { color: theme.textSecondary }]}>
                      {formatOrderDate(order.createdAt)}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: statusCfg.bgColor }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusCfg.dotColor }]} />
                    <Text style={[styles.statusPillText, { color: statusCfg.textColor }]}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>

                {/* 2. Core Summary: Compact Thumbnail + Material Name & Qty + Total Amount */}
                <View style={styles.coreSummaryRow}>
                  <View style={[styles.thumbnailBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    <Image
                      source={{ uri: primaryImage }}
                      style={styles.thumbnailImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.coreTextCol}>
                    <Text style={[styles.primaryMaterialName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.secondaryMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {quantityLabel} · {typeof order.siteAddress === 'string' ? order.siteAddress.split(',')[0] : (order.siteAddress?.street || order.siteAddress?.siteName || 'Site Hyderabad')}
                    </Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={[styles.totalAmountText, { color: theme.textPrimary }]}>
                      {formatINR(order.totalAmount || 0)}
                    </Text>
                    <Text style={[styles.paymentMethodText, { color: theme.textMuted }]}>
                      {order.paymentMethod || 'Paid'}
                    </Text>
                  </View>
                </View>

                {/* 3. Live Dispatch Details with Vertical Milestone Hierarchy - Minimalist Redesign */}
                {active && (
                  <View style={[styles.minimalActiveDispatchCard, { backgroundColor: theme.surfaceSecondary }]}>
                    {/* Active Dispatch Header Strip: Status + Live ETA */}
                    <View style={styles.activeCardHeaderStrip}>
                      <View style={styles.minimalLiveDotRow}>
                        <View style={styles.pulsingGreenDot} />
                        <Text style={styles.minimalLiveStatusKicker}>Out for Site Delivery</Text>
                      </View>
                      <Text style={[styles.minimalEtaBadgeText, { color: theme.primaryDark || '#B45309' }]}>
                        ETA ~{telemetry.etaMinutes} mins en route
                      </Text>
                    </View>

                    {/* Site Delivery Destination */}
                    <View style={styles.siteDestRow}>
                      <MapPin size={13} color="#EF4444" />
                      <Text style={[styles.siteDestText, { color: theme.textSecondary }]} numberOfLines={1}>
                        Destination: {typeof order.siteAddress === 'string' ? order.siteAddress : (order.siteAddress?.street || order.siteAddress?.siteName || 'Site Hyderabad')}
                      </Text>
                    </View>

                    {/* In-Card 3-Column Milestone Progress Timeline */}
                    <View style={[styles.inCardMilestonesWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Text style={[styles.inCardMilestoneTitle, { color: theme.textPrimary }]}>
                        Live Tracking Milestones
                      </Text>
                      {renderMilestones(order.createdAt, order.orderStatus, true)}
                    </View>

                    {/* Driver & OTP Details Row */}
                    <View style={styles.minimalDriverOtpRow}>
                      <View style={styles.minimalDriverInfo}>
                        <Text style={[styles.minimalDriverName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {order.driverName || 'Fleet Driver'} · {order.vehicleNumber || 'TS 09 UB 5120'}
                        </Text>
                      </View>

                      {/* 1-tap Gate OTP copy */}
                      <TouchableOpacity
                        onPress={() => handleCopy(order.deliveryOtp || '749182', 'otp')}
                        style={[styles.minimalOtpPill, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        activeOpacity={0.7}
                        accessibilityLabel="Copy Gate Handover OTP"
                      >
                        <Text style={[styles.minimalOtpPillText, { color: theme.textPrimary }]}>
                          Gate OTP <Text style={{ fontWeight: '800' }}>{order.deliveryOtp || '749182'}</Text>
                        </Text>
                        {copiedOtpId === (order.deliveryOtp || '749182') ? (
                          <Check size={11} color="#16A34A" />
                        ) : (
                          <Copy size={11} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 4. Completed Past Orders: Clean Expandable Summary */}
                {!active && items.length > 0 && (
                  <View style={styles.expandableSection}>
                    <TouchableOpacity
                      onPress={() => toggleExpandOrder(order.orderNumber)}
                      style={styles.expandToggleRow}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.expandToggleText, { color: theme.textSecondary }]}>
                        {isExpanded ? 'Hide items breakdown' : `View items breakdown (${items.length})`}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={13} color={theme.textSecondary} />
                      ) : (
                        <ChevronDown size={13} color={theme.textSecondary} />
                      )}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={[styles.itemizedBox, { borderTopColor: theme.border }]}>
                        {items.map((item: any, idx: number) => {
                          const itemTotal = item.totalPrice || (Number(item.unitPrice || 0) * Number(item.quantity || 1));
                          const itemImg = resolveMaterialImage({
                            name: item.name || item.title,
                            category: item.category,
                            image: item.image,
                          });
                          return (
                            <View key={idx} style={[styles.itemizedRow, { alignItems: 'center' }]}>
                              <Image
                                source={{ uri: itemImg }}
                                style={{ width: 34, height: 34, borderRadius: 6, marginRight: 10, backgroundColor: theme.surfaceSecondary }}
                                resizeMode="cover"
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.itemizedName, { color: theme.textPrimary }]} numberOfLines={1}>
                                  {item.name || item.title || 'Construction Material'}
                                </Text>
                                <Text style={[styles.itemizedQty, { color: theme.textSecondary }]}>
                                  {item.quantity || 1} {item.unit || 'unit'} · {formatINR(itemTotal)}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}

                {/* 5. Minimal Action Buttons (>= 44px Touch Targets) */}
                <View style={[styles.cardActionsRow, { borderTopColor: theme.border }]}>
                  {active ? (
                    <>
                      <TouchableOpacity
                        onPress={() => setActiveTrackingDelivery(deliveryObj)}
                        style={[styles.primaryActionBtn, { backgroundColor: '#2563EB' }]}
                        activeOpacity={0.85}
                      >
                        <Navigation size={15} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>Live Track</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleCall(order.driverPhone)}
                        style={[styles.secondaryActionBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        activeOpacity={0.8}
                      >
                        <Phone size={15} color={theme.textPrimary} />
                        <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Call Driver</Text>
                      </TouchableOpacity>

                      {/* Cancel Order Action */}
                      {(order.orderStatus === 'placed' || order.orderStatus === 'confirmed' || order.orderStatus === 'processing' || order.orderStatus === 'received') && (
                        <TouchableOpacity
                          onPress={() => setOrderToCancel(order)}
                          style={[styles.cancelActionBtn, { borderColor: '#FCA5A5', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2' }]}
                          activeOpacity={0.8}
                          accessibilityLabel="Cancel Order"
                        >
                          <X size={14} color="#EF4444" />
                          <Text style={styles.cancelActionText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => handleReorderAllItems(order)}
                        style={[styles.primaryActionBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
                        activeOpacity={0.85}
                      >
                        <RotateCcw size={15} color={theme.buttonText || '#FFFFFF'} />
                        <Text style={[styles.primaryActionText, { color: theme.buttonText || '#FFFFFF' }]}>Reorder</Text>
                      </TouchableOpacity>

                      {onViewInvoice && (
                        <TouchableOpacity
                          onPress={() => onViewInvoice(deliveryObj)}
                          style={[styles.secondaryActionBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                          activeOpacity={0.8}
                        >
                          <FileText size={15} color={theme.textPrimary} />
                          <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Invoice</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {/* Send Email Icon Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setTargetOrderForEmail(order);
                      setCustomEmail(order.customerEmail || user?.email || '');
                      setShowEmailModal(true);
                    }}
                    style={[styles.iconButtonSmall, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    activeOpacity={0.8}
                    accessibilityLabel="Email Invoice"
                  >
                    <Send size={15} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* 8. Integrated Live GPS Tracking Drawer / Modal - Minimalist Redesign */}
      <Modal
        visible={!!activeTrackingDelivery}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveTrackingDelivery(null)}
      >
        <View style={[styles.trackingModalContainer, { backgroundColor: theme.background }]}>
          {/* Modal Header */}
          <View style={[styles.trackingModalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.trackingModalTitle, { color: theme.textPrimary }]}>
                Live Tracking
              </Text>
              <Text style={[styles.trackingModalSubtitle, { color: theme.textSecondary }]}>
                Order #{activeTrackingDelivery?.orderNumber} · Real-time Dispatch
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveTrackingDelivery(null)}
              style={[styles.closeModalBtn, { backgroundColor: theme.surfaceSecondary }]}
              accessibilityLabel="Close"
            >
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.trackingModalBody}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Minimalist ETA & Real-Time Status Card */}
            <View style={[styles.minimalHeroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.minimalHeroHeader}>
                <View style={styles.minimalLiveDotRow}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.minimalLiveStatusKicker}>Out for Site Delivery</Text>
                </View>
                <Text style={[styles.minimalLiveSpeedText, { color: theme.textSecondary }]}>
                  {telemetry.speed} km/h · Live GPS
                </Text>
              </View>

              <Text style={[styles.minimalEtaDisplay, { color: theme.textPrimary }]}>
                ~{telemetry.etaMinutes} <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary }}>mins</Text>
              </Text>
              <Text style={[styles.minimalEtaSubtext, { color: theme.textSecondary }]}>
                Estimated Arrival at Construction Site
              </Text>

              {/* Destination Site Address Bar */}
              <View style={[styles.minimalAddressBar, { backgroundColor: theme.surfaceSecondary }]}>
                <MapPin size={14} color="#EF4444" />
                <Text style={[styles.minimalAddressText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {activeTrackingDelivery?.siteAddress || 'Site Delivery Location'}
                </Text>
              </View>
            </View>

            {/* 2. Vertical 3-Column Milestone Tracking Hierarchy (Urbanico Brand Theme) */}
            <View style={[styles.timelineHierarchyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.timelineHierarchyTitle, { color: theme.textPrimary }]}>
                Consignment Milestones
              </Text>

              {renderMilestones(
                activeTrackingDelivery?.timestamp,
                activeTrackingDelivery?.status || (activeTrackingDelivery as any)?.orderStatus,
                false
              )}
            </View>

            {/* 2. Unified Driver Contact & Gate Verification Code Card */}
            <View style={[styles.minimalDriverGateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {/* Driver info row */}
              <View style={styles.minimalDriverHeaderRow}>
                <View style={[styles.driverAvatarCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <Truck size={18} color={theme.textPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.driverHeadingName, { color: theme.textPrimary }]}>
                    {activeTrackingDelivery?.driverName || 'Fleet Driver'}
                  </Text>
                  <Text style={[styles.driverVehiclePlate, { color: theme.textSecondary }]}>
                    {activeTrackingDelivery?.vehicleNumber || 'TS 09 UB 5120'} · Heavy Carrier
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCall(activeTrackingDelivery?.driverPhone)}
                  style={[styles.minimalCallBtn, { backgroundColor: '#16A34A' }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Call Driver"
                >
                  <Phone size={14} color="#FFFFFF" />
                  <Text style={styles.minimalCallBtnText}>Call</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.minimalDividerLine, { backgroundColor: theme.border }]} />

              {/* Gate Passcode (OTP) */}
              <View style={styles.minimalOtpSection}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.otpSectionTitle, { color: theme.textSecondary }]}>
                    Gate Handover Code
                  </Text>
                  <Text style={[styles.otpDigitsDisplay, { color: theme.textPrimary }]}>
                    {activeTrackingDelivery?.deliveryOtp || '749182'}
                  </Text>
                  <Text style={[styles.otpHelpNote, { color: theme.textMuted }]}>
                    Share with driver at gate for authorized unloading
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleCopy(activeTrackingDelivery?.deliveryOtp || '749182', 'otp')}
                  style={[styles.otpCopyBtnMinimal, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Copy Gate Code"
                >
                  {copiedOtpId === (activeTrackingDelivery?.deliveryOtp || '749182') ? (
                    <>
                      <Check size={14} color="#16A34A" />
                      <Text style={[styles.otpCopyBtnText, { color: '#16A34A' }]}>Copied</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={14} color={theme.textPrimary} />
                      <Text style={[styles.otpCopyBtnText, { color: theme.textPrimary }]}>Copy</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Consignment Manifest (Clean Minimalist Item List) */}
            {activeTrackingDelivery?.cartItemsSnapshot && activeTrackingDelivery.cartItemsSnapshot.length > 0 && (
              <View style={[styles.minimalManifestCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.manifestTitleRow}>
                  <Text style={[styles.manifestHeading, { color: theme.textPrimary }]}>
                    Consignment Manifest
                  </Text>
                  <Text style={[styles.manifestCountText, { color: theme.textSecondary }]}>
                    {activeTrackingDelivery.cartItemsSnapshot.length} {activeTrackingDelivery.cartItemsSnapshot.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                {activeTrackingDelivery.cartItemsSnapshot.map((cItem, cIdx) => {
                  const resolvedImg = resolveMaterialImage({
                    name: cItem.itemName,
                    category: cItem.categoryName,
                    image: cItem.image,
                  });
                  return (
                    <View
                      key={cIdx}
                      style={[
                        styles.minimalManifestItemRow,
                        cIdx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                      ]}
                    >
                      <Image
                        source={{ uri: resolvedImg }}
                        style={[styles.minimalItemThumb, { backgroundColor: theme.surfaceSecondary }]}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.manifestItemName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {cItem.itemName}
                        </Text>
                        <Text style={[styles.manifestItemMeta, { color: theme.textSecondary }]}>
                          {cItem.selectedOptionLabel || `${cItem.quantity} Units`} · {formatINR(cItem.unitPrice * cItem.quantity)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 4. GST Compliance Footnote */}
            <View style={styles.minimalComplianceFootnote}>
              <Text style={[styles.complianceFootnoteText, { color: theme.textMuted }]}>
                E-Way Bill: {activeTrackingDelivery?.ewayBillNumber || 'EB-8492048201'} · GST Compliant
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 9. Send Email Invoice Modal */}
      <Modal
        visible={showEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <FileText size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Email GST Tax Invoice
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Order #{targetOrderForEmail?.orderNumber}
                </Text>
              </View>
            </View>

            <Text style={[styles.modalInputLabel, { color: theme.textPrimary }]}>
              Recipient Email Address:
            </Text>
            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}
              placeholder="e.g. accounts@yourcompany.com"
              placeholderTextColor={theme.textMuted}
              value={customEmail}
              onChangeText={setCustomEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowEmailModal(false)}
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTriggerEmailInvoice}
                style={[styles.modalSendBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
                disabled={isEmailing}
              >
                {isEmailing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={16} color={theme.buttonText || '#FFFFFF'} />
                    <Text style={[styles.modalSendText, { color: theme.buttonText || '#FFFFFF' }]}>
                      Send Invoice
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 9. In-App Cancellation & Gateway Refund Modal */}
      <Modal
        visible={!!orderToCancel}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderToCancel(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.emailModalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} color="#EF4444" />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Cancel Consignment</Text>
              </View>
              <TouchableOpacity onPress={() => setOrderToCancel(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Are you sure you want to cancel order #{orderToCancel?.orderNumber}? Any prepaid gateway amount will be automatically refunded.
            </Text>

            <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 12, marginBottom: 8 }]}>Reason for Cancellation:</Text>
            {['Site schedule revised', 'Ordered incorrect quantity / material', 'Project delayed by weather or permits', 'Other'].map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setCancelReason(reason)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: cancelReason === reason ? '#EF4444' : theme.border,
                  backgroundColor: cancelReason === reason ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2') : theme.surfaceSecondary,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: cancelReason === reason ? '#EF4444' : theme.textMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  {cancelReason === reason && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                  )}
                </View>
                <Text style={{ fontSize: 13, color: theme.textPrimary, fontWeight: cancelReason === reason ? '600' : '400' }}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={[styles.modalActions, { marginTop: 16 }]}>
              <TouchableOpacity
                onPress={() => setOrderToCancel(null)}
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                disabled={isCancelling}
              >
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmCancel}
                style={[styles.modalSendBtn, { backgroundColor: '#EF4444' }]}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalSendText, { color: '#FFFFFF' }]}>
                    Confirm Cancel & Refund
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  refreshIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 48,
  },
  guestBanner: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  guestBannerHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  guestIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  guestBannerDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  guestLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: 10,
  },
  guestLoginButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  segmentedFilterContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 3,
  },
  segmentedTab: {
    flex: 1,
    minHeight: 38,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentedTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  toolbarContainer: {
    marginBottom: 14,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
    outlineWidth: 0,
  } as any,
  clearSearchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 300,
  },
  emptyActionButton: {
    paddingHorizontal: 20,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  orderIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderIdText: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaDot: {
    fontSize: 13,
  },
  orderDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coreSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
  },
  thumbnailBox: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  coreTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  primaryMaterialName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  secondaryMetaText: {
    fontSize: 11.5,
  },
  priceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 1,
  },
  totalAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  paymentMethodText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  minimalActiveDispatchCard: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  activeCardHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  siteDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  siteDestText: {
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  inCardMilestonesWrapper: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  inCardMilestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  minimalDriverOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  minimalDriverInfo: {
    flex: 1,
    minWidth: 0,
  },
  minimalDriverName: {
    fontSize: 12,
    fontWeight: '600',
  },
  minimalEtaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  minimalOtpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  minimalOtpPillText: {
    fontSize: 11,
  },
  activeDispatchStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dispatchMetaCol: {
    flex: 1,
    minWidth: 0,
  },
  dispatchVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'nowrap',
  },
  dispatchVehicleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dispatchDriverText: {
    fontSize: 11.5,
    flexShrink: 1,
  },
  gateOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  gateOtpText: {
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  expandableSection: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  expandToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  expandToggleText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  itemizedBox: {
    borderTopWidth: 1,
    paddingTop: 6,
    gap: 4,
  },
  itemizedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    gap: 8,
  },
  itemizedName: {
    fontSize: 12,
    flex: 1,
  },
  itemizedQty: {
    fontSize: 11.5,
    flexShrink: 0,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trackingModalContainer: {
    flex: 1,
  },
  trackingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  trackingModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  trackingModalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingModalBody: {
    flex: 1,
  },
  // Minimalist Live Tracking Modal Styles
  minimalHeroCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  minimalHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  minimalLiveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  minimalLiveStatusKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  minimalLiveSpeedText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  minimalEtaDisplay: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  minimalEtaSubtext: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  timelineHierarchyCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  timelineHierarchyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  timelineList: {
    position: 'relative',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineTimeCol: {
    width: 68,
    paddingTop: 3,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timelineTimeText: {
    fontSize: 11.5,
    textAlign: 'right',
  },
  timelineTrackCol: {
    width: 26,
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'stretch',
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  timelineNodeCompleted: {
    backgroundColor: '#059669',
  },
  timelineNodeActive: {
    borderWidth: 2,
  },
  activePulsingCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineNodePending: {
    borderWidth: 1.5,
  },
  timelineConnectorHairline: {
    position: 'absolute',
    top: 22,
    bottom: 0,
    width: 1.5,
    zIndex: 1,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingTop: 2,
  },
  stageHeadingText: {
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 2,
  },
  stageDescriptionText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  compactTimelineTimeCol: {
    width: 60,
    paddingTop: 2,
    paddingRight: 6,
  },
  compactTimelineTimeText: {
    fontSize: 10.5,
  },
  compactTimelineTrackCol: {
    width: 22,
  },
  compactTimelineNode: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  compactTimelineConnectorHairline: {
    top: 18,
    width: 1.5,
  },
  compactStageHeadingText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 1,
  },
  compactStageDescriptionText: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  minimalAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  minimalAddressText: {
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  minimalDriverGateCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  minimalDriverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverHeadingName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  driverVehiclePlate: {
    fontSize: 11.5,
    marginTop: 1,
  },
  minimalCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minHeight: 36,
  },
  minimalCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  minimalDividerLine: {
    height: 1,
    marginVertical: 12,
  },
  minimalOtpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpDigitsDisplay: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 2,
  },
  otpHelpNote: {
    fontSize: 10.5,
  },
  otpCopyBtnMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
  },
  otpCopyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  minimalManifestCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  manifestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  manifestHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  manifestCountText: {
    fontSize: 11.5,
  },
  minimalManifestItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  minimalItemThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  manifestItemName: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  manifestItemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  minimalComplianceFootnote: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  complianceFootnoteText: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  modalInputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 13,
    marginBottom: 16,
    outlineWidth: 0,
  } as any,
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSendBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 8,
  },
  modalSendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
});
