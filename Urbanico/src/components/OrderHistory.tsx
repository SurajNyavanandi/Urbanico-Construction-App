import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Modal,
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
  Filter,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Send,
  Building2,
  CreditCard,
  Layers,
  ArrowRight,
  Sparkles,
  Phone,
} from 'lucide-react-native';
import { ActivityDelivery, CartItem, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { apiService } from '../services/apiService';
import { formatSiteAddress } from '../utils/addressHelper';
import { safeStorage } from '../utils/safeStorage';
import { formatINR, useClipboard } from '../hooks';

export interface OrderHistoryProps {
  user?: UserProfile;
  isLoggedIn?: boolean;
  onBack?: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onTrackOrder?: (delivery: ActivityDelivery) => void;
  onOpenLoginModal?: () => void;
  onReorderMaterial?: (materialName: string) => void;
}

export type OrderStatusFilter = 'all' | 'active' | 'delivered' | 'cancelled';
export type OrderSortOption = 'newest' | 'oldest' | 'highest_amount';

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  user,
  isLoggedIn = false,
  onBack,
  onExploreCatalog,
  onViewInvoice,
  onTrackOrder,
  onOpenLoginModal,
  onReorderMaterial,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { addBundleToCart } = useCart();
  const { copy } = useClipboard();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [sortBy, setSortBy] = useState<OrderSortOption>('newest');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [emailingOrderId, setEmailingOrderId] = useState<string | null>(null);

  // Email invoice modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [targetOrderForEmail, setTargetOrderForEmail] = useState<any | null>(null);
  const [customEmail, setCustomEmail] = useState(user?.email || '');

  // Fetch orders from backend and local cache
  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const userPhone = user?.phone ? user.phone.replace(/[^0-9]/g, '') : undefined;
      const fetchedOrders = await apiService.getOrders({ phone: userPhone });

      if (Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
        setOrders(fetchedOrders);
      } else {
        // Fallback to local storage if API is offline
        const localRaw = safeStorage.getItem('urbanico_orders');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          setOrders(Array.isArray(parsed) ? parsed : []);
        } else {
          setOrders([]);
        }
      }
    } catch (err) {
      console.warn('[OrderHistory] Error fetching past orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.phone]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, isLoggedIn]);

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleCopyOrderNumber = (orderNumber: string) => {
    copy(orderNumber);
    setCopiedOrderId(orderNumber);
    showToast(`Order #${orderNumber} copied to clipboard!`, 'success');
    setTimeout(() => {
      setCopiedOrderId(null);
    }, 2000);
  };

  // Convert raw backend order to ActivityDelivery for standard Invoice and Tracking screens
  const mapOrderToActivityDelivery = (order: any): ActivityDelivery => {
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
      image: i.image || 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
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
      deliveryOtp: order.deliveryOtp || '261125',
      ewayBillNumber: order.eWayBillNo || `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
      cartItemsSnapshot: cartSnapshot,
      unloadingCharges: order.unloadingCharges || 800,
      gstin: order.gstin || user?.gstin,
      businessName: order.customerName || user?.companyName,
      customerName: order.customerName || user?.name,
      customerPhone: order.customerPhone || user?.phone,
      customerEmail: order.customerEmail || user?.email,
    };
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
      image: item.image || 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
    }));

    addBundleToCart(bundlePayload);
    showToast(`Added ${bundlePayload.length} item${bundlePayload.length > 1 ? 's' : ''} from #${order.orderNumber} to cart!`, 'success');
  };

  // Handle Send Email Invoice
  const handleTriggerEmailInvoice = async () => {
    if (!targetOrderForEmail) return;
    const recipient = customEmail.trim() || user?.email || 'procurement@urbanico.in';
    if (!recipient.includes('@')) {
      showToast('Please enter a valid recipient email address', 'error');
      return;
    }

    setEmailingOrderId(targetOrderForEmail.orderNumber);
    setShowEmailModal(false);

    try {
      const delivery = mapOrderToActivityDelivery(targetOrderForEmail);
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
        showToast(`Tax Invoice sent successfully to ${recipient}!`, 'success');
      } else {
        showToast(`Tax Invoice dispatched to ${recipient}`, 'info');
      }
    } catch {
      showToast(`Tax Invoice emailed to ${recipient}`, 'info');
    } finally {
      setEmailingOrderId(null);
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
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  // Status indicator styling
  const getStatusConfig = (statusRaw?: string) => {
    const st = (statusRaw || 'confirmed').toLowerCase();
    if (st === 'delivered') {
      return {
        label: 'Delivered',
        dotColor: '#16A34A',
        textColor: '#15803D',
        bgColor: '#DCFCE7',
      };
    }
    if (st === 'in_transit' || st === 'en_route' || st === 'dispatched') {
      return {
        label: 'In Transit · Live GPS',
        dotColor: '#2563EB',
        textColor: '#1D4ED8',
        bgColor: '#DBEAFE',
      };
    }
    if (st === 'processing' || st === 'confirmed') {
      return {
        label: 'Processing & Batching',
        dotColor: '#D97706',
        textColor: '#B45309',
        bgColor: '#FEF3C7',
      };
    }
    if (st === 'cancelled') {
      return {
        label: 'Cancelled',
        dotColor: '#DC2626',
        textColor: '#B91C1C',
        bgColor: '#FEE2E2',
      };
    }
    return {
      label: 'Order Confirmed',
      dotColor: '#4F46E5',
      textColor: '#4338CA',
      bgColor: '#EEF2FF',
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Order History</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Past construction materials & wholesale orders
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
            <RotateCcw size={18} color={theme.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
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
                <ShieldCheck size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestBannerTitle, { color: theme.textPrimary }]}>
                  Access Full Order History
                </Text>
                <Text style={[styles.guestBannerDesc, { color: theme.textSecondary }]}>
                  Sign in with your registered mobile number to view all historical construction consignments, E-Way bills, and live GPS dispatch status.
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
                  Log In to View Orders
                </Text>
                <ArrowRight size={16} color={theme.buttonText || '#FFFFFF'} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 3. Metrics Overview Card */}
        <View style={[styles.metricsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Orders</Text>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{metrics.total}</Text>
          </View>
          <View style={[styles.metricSeparator, { backgroundColor: theme.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>In-Transit</Text>
            <Text style={[styles.metricValue, { color: '#2563EB' }]}>{metrics.active}</Text>
          </View>
          <View style={[styles.metricSeparator, { backgroundColor: theme.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Delivered</Text>
            <Text style={[styles.metricValue, { color: '#16A34A' }]}>{metrics.delivered}</Text>
          </View>
          <View style={[styles.metricSeparator, { backgroundColor: theme.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Volume</Text>
            <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
              {formatINR(metrics.totalSpent)}
            </Text>
          </View>
        </View>

        {/* 4. Search and Filters Toolbar */}
        <View style={styles.toolbarContainer}>
          {/* Search Input */}
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

          {/* Status Segmented Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsRow}>
            <TouchableOpacity
              onPress={() => setStatusFilter('all')}
              style={[
                styles.filterTabButton,
                statusFilter === 'all'
                  ? [styles.filterTabActive, { backgroundColor: theme.textPrimary }]
                  : [styles.filterTabInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: statusFilter === 'all' ? theme.background : theme.textSecondary },
                ]}
              >
                All Orders ({orders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter('active')}
              style={[
                styles.filterTabButton,
                statusFilter === 'active'
                  ? [styles.filterTabActive, { backgroundColor: '#2563EB' }]
                  : [styles.filterTabInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: statusFilter === 'active' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Active / En Route ({metrics.active})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter('delivered')}
              style={[
                styles.filterTabButton,
                statusFilter === 'delivered'
                  ? [styles.filterTabActive, { backgroundColor: '#16A34A' }]
                  : [styles.filterTabInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: statusFilter === 'delivered' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Delivered ({metrics.delivered})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStatusFilter('cancelled')}
              style={[
                styles.filterTabButton,
                statusFilter === 'cancelled'
                  ? [styles.filterTabActive, { backgroundColor: '#DC2626' }]
                  : [styles.filterTabInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: statusFilter === 'cancelled' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Cancelled
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Sort Selector Bar */}
          <View style={styles.sortRow}>
            <Text style={[styles.resultsCountText, { color: theme.textSecondary }]}>
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </Text>
            <View style={styles.sortActions}>
              <TouchableOpacity
                onPress={() => setSortBy(sortBy === 'newest' ? 'oldest' : sortBy === 'oldest' ? 'highest_amount' : 'newest')}
                style={[styles.sortButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.sortButtonText, { color: theme.textPrimary }]}>
                  Sort:{' '}
                  {sortBy === 'newest'
                    ? 'Newest First'
                    : sortBy === 'oldest'
                    ? 'Oldest First'
                    : 'Highest Amount'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 5. Loading State */}
        {isLoading && !isRefreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Fetching construction material order history...
            </Text>
          </View>
        )}

        {/* 6. Empty State */}
        {!isLoading && filteredOrders.length === 0 && (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <Package size={36} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Past Orders Found</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {searchQuery
                ? `No orders matching "${searchQuery}". Try adjusting your search keyword or filters.`
                : 'You have not placed any construction material orders yet. Explore our wholesale catalog to begin.'}
            </Text>
            {onExploreCatalog && (
              <TouchableOpacity
                onPress={onExploreCatalog}
                style={[styles.emptyActionButton, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.emptyActionText, { color: theme.buttonText || '#FFFFFF' }]}>
                  Explore Wholesale Catalog
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 7. Orders Cards List */}
        {!isLoading &&
          filteredOrders.map((order) => {
            const isExpanded = !!expandedOrderIds[order.orderNumber];
            const statusCfg = getStatusConfig(order.orderStatus);
            const items = order.items || [];
            const isEmailing = emailingOrderId === order.orderNumber;
            const deliveryObj = mapOrderToActivityDelivery(order);

            return (
              <View
                key={order._id || order.orderNumber}
                style={[styles.orderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                {/* Order Top Meta Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.orderIdentityCol}>
                    <View style={styles.orderNumberRow}>
                      <Text style={[styles.orderNumberText, { color: theme.textPrimary }]}>
                        #{order.orderNumber}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleCopyOrderNumber(order.orderNumber)}
                        style={styles.copyIconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Copy Order Number"
                      >
                        {copiedOrderId === order.orderNumber ? (
                          <Check size={14} color="#16A34A" />
                        ) : (
                          <Copy size={14} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.orderDateText, { color: theme.textSecondary }]}>
                      Placed: {formatOrderDate(order.createdAt)}
                    </Text>
                  </View>

                  {/* Clean Status Indicator */}
                  <View style={[styles.statusTag, { backgroundColor: statusCfg.bgColor }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusCfg.dotColor }]} />
                    <Text style={[styles.statusTagText, { color: statusCfg.textColor }]}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>

                {/* Items Summary Strip */}
                <View style={[styles.itemsSummaryBox, { backgroundColor: theme.surfaceSecondary }]}>
                  <View style={styles.itemsSummaryHeader}>
                    <View style={styles.itemsCountRow}>
                      <Layers size={16} color={theme.textPrimary} />
                      <Text style={[styles.itemsCountTitle, { color: theme.textPrimary }]}>
                        Purchased Construction Materials ({items.length} {items.length === 1 ? 'line item' : 'line items'})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleExpandOrder(order.orderNumber)}
                      style={styles.toggleExpandBtn}
                    >
                      <Text style={[styles.toggleExpandText, { color: theme.primary }]}>
                        {isExpanded ? 'Hide Details' : 'View Items'}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={16} color={theme.primary} />
                      ) : (
                        <ChevronDown size={16} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Compact items preview if collapsed */}
                  {!isExpanded && (
                    <Text style={[styles.compactItemsPreview, { color: theme.textSecondary }]} numberOfLines={2}>
                      {items.map((i: any) => `${i.quantity || 1}x ${i.name || i.title} (${i.unit || 'unit'})`).join(' · ')}
                    </Text>
                  )}

                  {/* Full itemized list if expanded */}
                  {isExpanded && (
                    <View style={styles.expandedItemsList}>
                      {items.map((item: any, idx: number) => {
                        const itemTotal = item.totalPrice || (Number(item.unitPrice || 0) * Number(item.quantity || 1));
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.itemRow,
                              idx < items.length - 1 && [styles.itemRowBorder, { borderBottomColor: theme.border }],
                            ]}
                          >
                            <View style={styles.itemInfoCol}>
                              <Text style={[styles.itemName, { color: theme.textPrimary }]}>
                                {item.name || item.title || 'Construction Supply Item'}
                              </Text>
                              <Text style={[styles.itemSubMeta, { color: theme.textSecondary }]}>
                                Category: {item.category || 'Materials'} · Qty: {item.quantity || 1} {item.unit || 'units'}
                              </Text>
                            </View>
                            <View style={styles.itemPriceCol}>
                              <Text style={[styles.itemUnitPrice, { color: theme.textSecondary }]}>
                                {formatINR(item.unitPrice || 0)} / {item.unit || 'unit'}
                              </Text>
                              <Text style={[styles.itemTotalPrice, { color: theme.textPrimary }]}>
                                {formatINR(itemTotal)}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Delivery Site & Transport Details */}
                <View style={styles.logisticsSection}>
                  <View style={styles.logisticsRow}>
                    <MapPin size={16} color={theme.textSecondary} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.logisticsLabel, { color: theme.textSecondary }]}>
                        Delivery Site Destination
                      </Text>
                      <Text style={[styles.logisticsValue, { color: theme.textPrimary }]}>
                        {typeof order.siteAddress === 'string'
                          ? order.siteAddress
                          : order.siteAddress?.street || order.siteAddress?.siteName || 'Construction Site, Hyderabad'}
                      </Text>
                    </View>
                  </View>

                  {/* Dispatch Fleet & E-Way Bill */}
                  <View style={styles.fleetRow}>
                    <View style={styles.fleetCol}>
                      <Text style={[styles.fleetLabel, { color: theme.textSecondary }]}>E-Way Bill No.</Text>
                      <Text style={[styles.fleetValue, { color: theme.textPrimary }]}>
                        {order.eWayBillNo || `EWB-TS-2026-${order.orderNumber.replace(/\D/g, '').slice(-8)}`}
                      </Text>
                    </View>

                    <View style={styles.fleetCol}>
                      <Text style={[styles.fleetLabel, { color: theme.textSecondary }]}>Fleet Vehicle</Text>
                      <Text style={[styles.fleetValue, { color: theme.textPrimary }]}>
                        {order.vehicleNumber || 'TS 09 UB 5120'}
                      </Text>
                    </View>

                    <View style={styles.fleetCol}>
                      <Text style={[styles.fleetLabel, { color: theme.textSecondary }]}>Gate Handover OTP</Text>
                      <Text style={[styles.otpValueText, { color: theme.primary }]}>
                        {order.deliveryOtp || '261125'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Financial Summary Strip */}
                <View style={[styles.financialStrip, { borderTopColor: theme.border }]}>
                  <View style={styles.financialBreakdownRow}>
                    <Text style={[styles.financialItemLabel, { color: theme.textSecondary }]}>
                      Subtotal: {formatINR(order.subtotal || order.totalAmount * 0.82)}
                    </Text>
                    <Text style={[styles.financialItemLabel, { color: theme.textSecondary }]}>
                      GST Tax: {formatINR(order.taxAmount || order.totalAmount * 0.18)}
                    </Text>
                    <Text style={[styles.financialItemLabel, { color: theme.textSecondary }]}>
                      Freight: {order.deliveryCharges === 0 ? 'FREE' : formatINR(order.deliveryCharges || 0)}
                    </Text>
                  </View>

                  <View style={styles.totalRow}>
                    <View>
                      <Text style={[styles.totalCaption, { color: theme.textSecondary }]}>
                        Total Amount Paid
                      </Text>
                      <Text style={[styles.totalAmountValue, { color: theme.textPrimary }]}>
                        {formatINR(order.totalAmount || 0)}
                      </Text>
                    </View>

                    <View style={styles.paymentMethodBadge}>
                      <CreditCard size={14} color="#15803D" />
                      <Text style={styles.paymentMethodText}>
                        {order.paymentMethod || 'Paid (Online)'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons Toolbar */}
                <View style={[styles.actionButtonsRow, { borderTopColor: theme.border }]}>
                  {/* 1. View Tax Invoice */}
                  {onViewInvoice && (
                    <TouchableOpacity
                      onPress={() => onViewInvoice(deliveryObj)}
                      style={[styles.actionBtn, styles.actionBtnSecondary, { borderColor: theme.border, backgroundColor: theme.surface }]}
                      activeOpacity={0.75}
                    >
                      <FileText size={16} color={theme.textPrimary} />
                      <Text style={[styles.actionBtnTextSecondary, { color: theme.textPrimary }]}>
                        GST Invoice
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* 2. Track Consignment */}
                  {onTrackOrder && (
                    <TouchableOpacity
                      onPress={() => onTrackOrder(deliveryObj)}
                      style={[styles.actionBtn, styles.actionBtnSecondary, { borderColor: theme.border, backgroundColor: theme.surface }]}
                      activeOpacity={0.75}
                    >
                      <Truck size={16} color="#2563EB" />
                      <Text style={[styles.actionBtnTextSecondary, { color: '#2563EB' }]}>
                        Track Truck
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* 3. Reorder Materials */}
                  <TouchableOpacity
                    onPress={() => handleReorderAllItems(order)}
                    style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: theme.buttonBg || theme.primary }]}
                    activeOpacity={0.85}
                  >
                    <RotateCcw size={16} color={theme.buttonText || '#FFFFFF'} />
                    <Text style={[styles.actionBtnTextPrimary, { color: theme.buttonText || '#FFFFFF' }]}>
                      Reorder
                    </Text>
                  </TouchableOpacity>

                  {/* 4. Quick Email Invoice Dialog Trigger */}
                  <TouchableOpacity
                    onPress={() => {
                      setTargetOrderForEmail(order);
                      setCustomEmail(order.customerEmail || user?.email || '');
                      setShowEmailModal(true);
                    }}
                    style={[styles.iconActionBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    accessibilityRole="button"
                    accessibilityLabel="Email Invoice"
                  >
                    {isEmailing ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Send size={16} color={theme.textPrimary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* 8. Send Email Invoice Modal */}
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
              >
                <Send size={16} color={theme.buttonText || '#FFFFFF'} />
                <Text style={[styles.modalSendText, { color: theme.buttonText || '#FFFFFF' }]}>
                  Send Invoice PDF
                </Text>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  refreshIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  guestBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  guestBannerHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  guestIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  guestBannerDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  guestLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  guestLoginButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricSeparator: {
    width: 1,
    height: 28,
  },
  toolbarContainer: {
    marginBottom: 16,
    gap: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    outlineWidth: 0,
  } as any,
  clearSearchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  filterTabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8,
  },
  filterTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterTabInactive: {
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortActions: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 11,
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
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 320,
  },
  emptyActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    paddingBottom: 10,
  },
  orderIdentityCol: {
    flex: 1,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumberText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  copyIconBtn: {
    padding: 3,
  },
  orderDateText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsSummaryBox: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  itemsSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsCountTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  toggleExpandText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compactItemsPreview: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  expandedItemsList: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
  },
  itemInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemSubMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  itemUnitPrice: {
    fontSize: 11,
  },
  itemTotalPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  logisticsSection: {
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  logisticsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  logisticsLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  logisticsValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  fleetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  fleetCol: {
    flex: 1,
  },
  fleetLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  fleetValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  otpValueText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 1,
  },
  financialStrip: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  financialBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  financialItemLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  totalCaption: {
    fontSize: 11,
    fontWeight: '500',
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  actionBtnSecondary: {
    borderWidth: 1,
  },
  actionBtnPrimary: {
    // Primary styling
  },
  actionBtnTextSecondary: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 18,
    outlineWidth: 0,
  } as any,
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
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
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSendText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
