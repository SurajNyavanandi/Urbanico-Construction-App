import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  FileText,
} from 'lucide-react-native';
import { CartItem, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { RazorpayModal, RazorpayPaymentResult } from './RazorpayModal';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { EmptyState } from './common/EmptyState';
import { LoadingButton } from './common/LoadingButton';
import { ShimmerImage } from './common/ShimmerImage';
import { Toast } from './common/Toast';
import { GoogleMapPicker } from './common/GoogleMapPicker';

interface BasketScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  selectedLocation?: string;
  onNavigateScreen: (screen: ScreenType) => void;
  deliveries?: ActivityDelivery[];
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onChangeAddressRedirect?: () => void;
}

export const BasketScreen: React.FC<BasketScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedLocation: propLocation,
  onNavigateScreen,
  deliveries = INITIAL_DELIVERIES,
  onViewInvoice,
  onChangeAddressRedirect,
}) => {
  const { theme, typography } = useTheme();
  const { selectedLocation: globalLocation, currentCoords } = useLocation();
  const activeLocation = globalLocation || propLocation || 'Miyapur Site, Phase 2, Hyderabad';
  const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setToastMessage('Basket & live delivery status refreshed');
    }, 800);
  };

  // Razorpay Payment States
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [latestPaymentResult, setLatestPaymentResult] = useState<RazorpayPaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const gstTax = Math.round(subtotal * 0.18);
  const deliveryFee = subtotal > 10000 ? 0 : 450;
  const grandTotal = subtotal + gstTax + deliveryFee;

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route') || deliveries[0];

  const handlePlaceOrder = () => {
    setPaymentError(null);
    setIsPlacingOrder(true);
    setTimeout(() => {
      setIsPlacingOrder(false);
      setShowRazorpayModal(true);
    }, 500);
  };

  const handlePaymentSuccess = (result: RazorpayPaymentResult) => {
    setShowRazorpayModal(false);
    setLatestPaymentResult(result);
    setShowSuccessModal(true);
    onClearCart();
  };

  const handlePaymentFailure = (errorMsg: string) => {
    setPaymentError(errorMsg);
  };

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="info"
        onDismiss={() => setToastMessage(null)}
      />
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
      {/* Top Segmented Tab (Cart vs Order History & Tracking) */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSecondary }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('cart')}
          activeOpacity={0.8}
          style={[
            styles.tabButton,
            { backgroundColor: activeTab === 'cart' ? theme.primary : 'transparent' },
          ]}
        >
          <ShoppingBag
            size={16}
            color={activeTab === 'cart' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'cart' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            My Basket ({cartItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
          style={[
            styles.tabButton,
            { backgroundColor: activeTab === 'history' ? theme.primary : 'transparent' },
          ]}
        >
          <Truck
            size={16}
            color={activeTab === 'history' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'history' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Orders & Live Tracking
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'cart' ? (
        <>
          {/* Location Delivery Header */}
          <View style={[styles.locationHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.locationLeftRow}>
              <View style={[styles.locationIconBox, { backgroundColor: theme.primaryLight }]}>
                <MapPin size={16} color={theme.primaryDark} />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={[styles.locationLabel, { color: theme.textMuted }]}>Delivery Site Address</Text>
                <Text style={[styles.locationValue, { color: theme.textPrimary }]} numberOfLines={1}>
                  {activeLocation}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => (onChangeAddressRedirect ? onChangeAddressRedirect() : onNavigateScreen('profile'))}>
              <Text style={[styles.changeBtnText, { color: theme.primary, fontWeight: '800' }]}>Change on Map</Text>
            </TouchableOpacity>
          </View>

          {cartItems.length === 0 ? (
            <EmptyState
              type="empty-cart"
              onAction={() => onNavigateScreen('home')}
              actionLabel="Browse Catalog"
            />
          ) : (
            <View style={styles.cartSection}>
              {/* Basket Items List */}
              <View style={styles.itemsCardList}>
                {cartItems.map((item) => (
                  <View key={item.id} style={[styles.cartItemRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.itemImageWrapper, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderLight }]}>
                      <ShimmerImage
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                        resizeMode="contain"
                        borderRadius={8}
                        preset="thumbnail"
                      />
                    </View>

                    <View style={styles.itemMainInfo}>
                      <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {item.itemName}
                      </Text>
                      <Text style={[styles.itemOptionLabel, { color: theme.textSecondary }]}>
                        {item.selectedOptionLabel}
                      </Text>
                      <Text style={[styles.itemUnitPrice, { color: theme.textPrimary }]}>
                        ₹{item.unitPrice.toLocaleString('en-IN')} / unit
                      </Text>
                    </View>

                    {/* Stepper + Delete */}
                    <View style={styles.stepperActionRow}>
                      <View style={[styles.stepperContainer, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
                        <TouchableOpacity
                          onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          style={[styles.stepperBtn, { backgroundColor: theme.surface }]}
                          activeOpacity={0.7}
                        >
                          <Minus size={12} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.stepperQtyText, { color: theme.textPrimary }]}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          style={[styles.stepperBtn, { backgroundColor: theme.surface }]}
                          activeOpacity={0.7}
                        >
                          <Plus size={12} color={theme.textPrimary} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => onRemoveItem(item.id)}
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Price Summary Breakdown */}
              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.summaryTitle, { color: theme.textMuted, borderBottomColor: theme.borderLight }]}>
                  Payment Summary
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Materials Subtotal</Text>
                  <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{subtotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Estimated GST (18%)</Text>
                  <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{gstTax.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Heavy Vehicle Delivery</Text>
                  <Text style={[styles.summaryValue, { color: '#059669' }]}>
                    {deliveryFee === 0 ? 'FREE (Over ₹10k)' : `₹${deliveryFee}`}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.grandTotalRow, { borderTopColor: theme.borderLight }]}>
                  <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>Total Payable</Text>
                  <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Guarantee Tag */}
              <View style={[styles.guaranteeTag, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                <ShieldCheck size={18} color={theme.primaryDark} />
                <Text style={[styles.guaranteeText, { color: theme.primaryDark }]}>
                  Direct manufacturer dispatch with verified weighbridge slips.
                </Text>
              </View>

              {/* Confirm Order CTA */}
              <LoadingButton
                title={`Confirm Order • ₹${grandTotal.toLocaleString('en-IN')}`}
                onPress={handlePlaceOrder}
                isLoading={isPlacingOrder}
                variant="primary"
                style={{ height: 52, marginTop: 8 }}
                icon={<ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />}
              />
            </View>
          )}
        </>
      ) : (
        /* Orders & Live Tracking View inside Basket Section */
        <View style={styles.historySection}>
          {/* Active Live Delivery Tracking Card */}
          {activeEnRoute && (
            <View style={[styles.liveTrackingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.trackingHeader, { borderBottomColor: theme.borderLight }]}>
                <View style={styles.pingRow}>
                  <View style={styles.pingDot} />
                  <Text style={[styles.shipmentIdText, { color: theme.textPrimary }]}>
                    Active Delivery #{activeEnRoute.orderNumber}
                  </Text>
                </View>
                <View style={[styles.etaBadge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.etaBadgeText, { color: theme.primaryDark }]}>{activeEnRoute.estimatedArrival}</Text>
                </View>
              </View>

              <View style={styles.driverInfoRow}>
                <View style={styles.truckIconBox}>
                  <Truck size={20} color="#D97706" />
                </View>
                <View style={styles.driverDetails}>
                  <Text style={[styles.materialName, { color: theme.textPrimary }]}>{activeEnRoute.materialName}</Text>
                  <Text style={[styles.driverSubText, { color: theme.textSecondary }]}>
                    Driver: {activeEnRoute.driverName} ({activeEnRoute.vehicleNumber})
                  </Text>
                  <View style={styles.addressRow}>
                    <MapPin size={12} color="#EF4444" />
                    <Text style={[styles.addressText, { color: theme.textMuted }]} numberOfLines={1}>
                      {activeEnRoute.siteAddress}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Embedded Google Maps Route Tracking */}
              <View style={{ marginVertical: 10 }}>
                <GoogleMapPicker
                  center={currentCoords}
                  markerPosition={currentCoords}
                  markerTitle={`Site Destination: ${activeEnRoute.siteAddress}`}
                  routeOrigin={{ lat: 17.4385, lng: 78.3820 }} // Depot
                  routeDestination={currentCoords}
                  height={180}
                  interactive={true}
                />
              </View>

              {/* Status Stepper */}
              <View style={styles.stepperProgressRow}>
                {['Placed', 'Dispatched', 'En Route', 'Delivered'].map((step, idx) => {
                  const isDone = idx <= 2;
                  const isCurrent = idx === 2;
                  return (
                    <View key={step} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          isCurrent || isDone
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.stepNumberText, { color: isCurrent || isDone ? '#FFFFFF' : theme.textMuted }]}>
                          {isDone ? '✓' : idx + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color: isCurrent
                              ? theme.primary
                              : isDone
                              ? theme.textPrimary
                              : theme.textMuted,
                          },
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

          {/* Past Orders List */}
          <View style={[styles.pastOrdersCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.pastOrdersHeader, { borderBottomColor: theme.borderLight }]}>
              <View style={styles.pastOrdersHeaderLeft}>
                <FileText size={16} color={theme.primary} />
                <Text style={[styles.pastOrdersTitle, { color: theme.textPrimary }]}>Order History & Invoices</Text>
              </View>
              <Text style={[styles.ordersCountText, { color: theme.textSecondary }]}>{deliveries.length} Orders</Text>
            </View>

            <View style={styles.deliveriesList}>
              {deliveries.map((del) => (
                <View key={del.id} style={[styles.deliveryRow, { borderTopColor: theme.borderLight }]}>
                  <View style={styles.deliveryLeftInfo}>
                    <Text style={[styles.delMaterialName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {del.materialName}
                    </Text>
                    <View style={styles.timestampRow}>
                      <Clock size={12} color={theme.textMuted} />
                      <Text style={[styles.timestampText, { color: theme.textSecondary }]}>{del.timestamp}</Text>
                    </View>
                    <Text style={[styles.vehicleText, { color: theme.textSecondary }]}>
                      Vehicle: {del.vehicleNumber} ({del.driverName.split(' ')[0]})
                    </Text>
                  </View>

                  <View style={styles.deliveryRightInfo}>
                    <Text style={[styles.delAmountText, { color: theme.textPrimary }]}>
                      ₹{del.totalAmount.toLocaleString('en-IN')}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        del.status === 'Delivered'
                          ? styles.badgeDelivered
                          : del.status === 'En Route'
                          ? styles.badgeEnRoute
                          : { backgroundColor: theme.primaryLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          del.status === 'Delivered'
                            ? styles.textDelivered
                            : del.status === 'En Route'
                            ? styles.textEnRoute
                            : { color: theme.primaryDark },
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
        </View>
      )}

      {/* Razorpay Test Mode Payment Modal */}
      <RazorpayModal
        visible={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        amount={grandTotal}
        orderDescription={`Order (${cartItems.length} items) - Urbanico Material Dispatch`}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />

      {/* Payment Success Confirmation Receipt Screen */}
      <PaymentSuccessModal
        visible={showSuccessModal}
        paymentResult={latestPaymentResult}
        selectedLocation={activeLocation}
        onClose={() => setShowSuccessModal(false)}
        onTrackOrder={() => setActiveTab('history')}
        onViewInvoice={() => {
          setShowSuccessModal(false);
          if (onViewInvoice && deliveries[0]) {
            onViewInvoice(deliveries[0]);
          }
        }}
      />
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 112,
    gap: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationHeader: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCartCard: {
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
    marginVertical: 16,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextGroup: {
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  primaryPillBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryPillBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryPillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  secondaryPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cartSection: {
    gap: 12,
  },
  itemsCardList: {
    gap: 10,
  },
  cartItemRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemMainInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemOptionLabel: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  stepperActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 2,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    width: 24,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
  },
  summaryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    paddingBottom: 6,
    letterSpacing: 0.2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  grandTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  guaranteeTag: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guaranteeText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  confirmCtaBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  historySection: {
    gap: 16,
  },
  liveTrackingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  pingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  shipmentIdText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  etaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
  },
  etaBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  truckIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '800',
  },
  driverSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    fontSize: 11,
    flex: 1,
  },
  stepperProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  pastOrdersCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  pastOrdersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  pastOrdersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pastOrdersTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  ordersCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deliveriesList: {
    gap: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  deliveryLeftInfo: {
    flex: 1,
    gap: 2,
  },
  delMaterialName: {
    fontSize: 12,
    fontWeight: '800',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: 11,
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deliveryRightInfo: {
    alignItems: 'flex-end',
  },
  delAmountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  badgeDelivered: {
    backgroundColor: '#D1FAE5',
  },
  badgeEnRoute: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textDelivered: {
    color: '#065F46',
  },
  textEnRoute: {
    color: '#92400E',
  },
});
