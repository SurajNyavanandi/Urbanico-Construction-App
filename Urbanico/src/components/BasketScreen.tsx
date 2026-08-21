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
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ArrowRight,
  Truck,
  Check,
} from 'lucide-react-native';
import { CartItem, ScreenType, ActivityDelivery } from '../types';
import { INITIAL_DELIVERIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { RazorpayModal, RazorpayPaymentResult } from './RazorpayModal';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { EmptyState } from './common/EmptyState';
import { ShimmerImage } from './common/ShimmerImage';
import { useToast } from '../context/ToastContext';

interface BasketScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  selectedLocation?: string;
  onNavigateScreen: (screen: ScreenType) => void;
  deliveries?: ActivityDelivery[];
  onOrderCreated?: (order: ActivityDelivery) => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onChangeAddressRedirect?: () => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

const TRACKING_STEPS = [
  { id: 'confirmed', title: 'Order Confirmed', description: 'Order received and verified', status: 'completed' },
  { id: 'processing', title: 'Processing', description: 'Materials batched at yard', status: 'completed' },
  { id: 'dispatched', title: 'Dispatched', description: 'Vehicle loaded & weighed', status: 'completed' },
  { id: 'out_for_delivery', title: 'Out for Delivery', description: 'On the way to site', status: 'active' },
  { id: 'delivered', title: 'Delivered', description: 'Delivery completed at site', status: 'pending' },
];

export const BasketScreen: React.FC<BasketScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedLocation: propLocation,
  onNavigateScreen,
  deliveries = INITIAL_DELIVERIES,
  onOrderCreated,
  onViewInvoice,
  onChangeAddressRedirect,
  isLoggedIn = false,
  onOpenLoginModal,
}) => {
  const { theme, typography } = useTheme();
  const { selectedLocation: globalLocation } = useLocation();
  const { showToast } = useToast();
  const activeLocation = globalLocation || propLocation || 'Miyapur Site, Phase 2, Hyderabad';
  const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');
  const [refreshing, setRefreshing] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Cart and delivery status refreshed', 'info');
    }, 800);
  };

  // Razorpay Payment States
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [latestPaymentResult, setLatestPaymentResult] = useState<RazorpayPaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const totalUnitQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const cgst = Math.round(subtotal * 0.09);
  const sgst = Math.round(subtotal * 0.09);
  const gstTax = cgst + sgst;
  const grandTotal = subtotal + gstTax;

  const activeEnRoute = deliveries.find((d) => d.status === 'En Route') || deliveries[0];

  // Dynamic tracking step calculation based on active order
  const dynamicTrackingSteps = [
    {
      id: 'confirmed',
      title: 'Order Confirmed',
      description: activeEnRoute ? `Verified for ${activeEnRoute.orderNumber}` : 'Order received & verified',
      status: 'completed',
    },
    {
      id: 'processing',
      title: 'Yard Batching & Quality Check',
      description: 'Materials weighed & batch certificate issued',
      status: activeEnRoute && activeEnRoute.status !== 'Placed' ? 'completed' : 'active',
    },
    {
      id: 'dispatched',
      title: 'Dispatched from Yard',
      description: activeEnRoute ? `Assigned to ${activeEnRoute.vehicleNumber}` : 'Dispatched with logistics crew',
      status: activeEnRoute && (activeEnRoute.status === 'En Route' || activeEnRoute.status === 'Delivered') ? 'completed' : 'pending',
    },
    {
      id: 'out_for_delivery',
      title: 'Out for Live Delivery',
      description: activeEnRoute ? `En route to ${activeEnRoute.siteAddress.split(',')[0]}` : 'On the way to site',
      status: activeEnRoute && activeEnRoute.status === 'En Route' ? 'active' : activeEnRoute && activeEnRoute.status === 'Delivered' ? 'completed' : 'pending',
    },
    {
      id: 'delivered',
      title: 'Delivered at Site',
      description: 'Material received and weighment verified',
      status: activeEnRoute && activeEnRoute.status === 'Delivered' ? 'completed' : 'pending',
    },
  ];

  const handlePlaceOrder = () => {
    if (!isLoggedIn) {
      showToast('Please log in or sign up to proceed to checkout', 'info');
      if (onOpenLoginModal) {
        onOpenLoginModal();
      }
      return;
    }

    setPaymentError(null);
    setIsPlacingOrder(true);
    setTimeout(() => {
      setIsPlacingOrder(false);
      setShowRazorpayModal(true);
    }, 400);
  };

  const handlePaymentSuccess = (result: RazorpayPaymentResult) => {
    setShowRazorpayModal(false);
    setLatestPaymentResult(result);
    setShowSuccessModal(true);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const newOrder: ActivityDelivery = {
      id: `del-${Date.now()}`,
      orderNumber: `URB-${Math.floor(10000 + Math.random() * 90000)}`,
      materialName:
        cartItems.map((c) => `${c.itemName} (${c.selectedOptionLabel})`).join(', ') ||
        'Direct Yard Supply Order',
      quantity: `${cartItems.reduce((acc, c) => acc + c.quantity, 0)} Items`,
      driverName: 'Assigned Driver (Yard Logistics)',
      vehicleType: 'Commercial Transport Vehicle',
      vehicleNumber: 'TS 08 U ' + Math.floor(1000 + Math.random() * 9000),
      estimatedArrival: 'Order Placed • Dispatching Soon',
      status: 'En Route',
      siteAddress: activeLocation,
      timestamp: `Today, ${formattedTime}`,
      totalAmount: grandTotal,
    };

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }
    onClearCart();
  };

  const handlePaymentFailure = (errorMsg: string) => {
    setPaymentError(errorMsg);
  };

  return (
    <View style={{ flex: 1 }}>
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
              { backgroundColor: activeTab === 'cart' ? theme.surface : 'transparent' },
            ]}
          >
            <ShoppingCart
              size={15}
              color={activeTab === 'cart' ? theme.textPrimary : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'cart' ? theme.textPrimary : theme.textMuted, fontWeight: activeTab === 'cart' ? '700' : '500' },
              ]}
            >
              My Cart {totalUnitQuantity > 0 ? `(${totalUnitQuantity})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
            style={[
              styles.tabButton,
              { backgroundColor: activeTab === 'history' ? theme.surface : 'transparent' },
            ]}
          >
            <Truck
              size={15}
              color={activeTab === 'history' ? theme.textPrimary : theme.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'history' ? theme.textPrimary : theme.textMuted, fontWeight: activeTab === 'history' ? '700' : '500' },
              ]}
            >
              Orders & Tracking
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'cart' ? (
          <>
            {/* Delivery Location Header */}
            <View style={[styles.locationHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.locationLeftRow}>
                <View style={[styles.locationIconBox, { backgroundColor: theme.surfaceSecondary }]}>
                  <MapPin size={16} color={theme.textPrimary} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={[styles.locationLabel, { color: theme.textSecondary }]}>Delivery Address</Text>
                  <Text style={[styles.locationValue, { color: theme.textPrimary }]} numberOfLines={1}>
                    {activeLocation}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => (onChangeAddressRedirect ? onChangeAddressRedirect() : onNavigateScreen('profile'))}>
                <Text style={[styles.changeBtnText, { color: theme.primary }]}>Change</Text>
              </TouchableOpacity>
            </View>

            {cartItems.length === 0 ? (
              <View style={[styles.nikeEmptyBagContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.nikeEmptyBagIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <ShoppingCart size={34} color={theme.textPrimary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.nikeEmptyBagTitle, { color: theme.textPrimary }]}>Your cart is empty.</Text>
                <Text style={[styles.nikeEmptyBagSub, { color: theme.textSecondary }]}>
                  When you add products, they'll appear here.
                </Text>
                <TouchableOpacity
                  onPress={() => onNavigateScreen('shop')}
                  style={[styles.nikeShopNowPill, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nikeShopNowPillText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cartSection}>
                {/* Cart Items List */}
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
                          <Trash2 size={15} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Price Summary Breakdown */}
                <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.summaryTitle, { color: theme.textPrimary, borderBottomColor: theme.borderLight }]}>
                    Summary
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal ({totalUnitQuantity} items)</Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{subtotal.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Central GST (CGST 9%)</Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{cgst.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>State GST (SGST 9%)</Text>
                    <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>₹{sgst.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Direct Yard Dispatch & Handling</Text>
                    <Text style={[styles.summaryValue, { color: '#16A34A', fontWeight: '700' }]}>Free Delivery</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.grandTotalRow, { borderTopColor: theme.borderLight }]}>
                    <Text style={[styles.grandTotalLabel, { color: theme.textPrimary }]}>Total (Incl. all taxes)</Text>
                    <Text style={[styles.grandTotalValue, { color: theme.textPrimary }]}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Nike Solid Black Checkout CTA */}
                <TouchableOpacity
                  onPress={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  activeOpacity={0.85}
                  style={[styles.nikeCheckoutPill, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.nikeCheckoutPillText}>
                    {isPlacingOrder ? 'Processing...' : `Checkout (₹${grandTotal.toLocaleString('en-IN')})`}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* Orders & Live Tracking View */
          <View style={styles.historySection}>
            <View style={styles.historyHeaderRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('cart')}
                style={[styles.backToCartBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.backToCartBtnText, { color: theme.textPrimary }]}>← Back to Bag</Text>
              </TouchableOpacity>
            </View>
            {!isLoggedIn ? (
              <View style={[styles.nikeEmptyBagContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.nikeEmptyBagIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <Truck size={34} color={theme.textPrimary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.nikeEmptyBagTitle, { color: theme.textPrimary }]}>Log in to track orders.</Text>
                <Text style={[styles.nikeEmptyBagSub, { color: theme.textSecondary }]}>
                  Sign in or create an account to view real-time vehicle dispatches and download GST tax invoices.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onOpenLoginModal) onOpenLoginModal();
                  }}
                  style={[styles.nikeShopNowPill, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nikeShopNowPillText}>Log In or Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : deliveries.length === 0 ? (
              <View style={[styles.nikeEmptyBagContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.nikeEmptyBagIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <Truck size={34} color={theme.textPrimary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.nikeEmptyBagTitle, { color: theme.textPrimary }]}>No active orders.</Text>
                <Text style={[styles.nikeEmptyBagSub, { color: theme.textSecondary }]}>
                  When you place an order, live dispatch tracking and invoices will appear here.
                </Text>
                <TouchableOpacity
                  onPress={() => onNavigateScreen('shop')}
                  style={[styles.nikeShopNowPill, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nikeShopNowPillText}>Explore Materials</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Active Live Delivery Tracking Card */}
                {activeEnRoute && (
                  <View style={[styles.trackingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.trackingCardHeader, { borderBottomColor: theme.borderLight }]}>
                      <View>
                        <Text style={[styles.trackingOrderNumber, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                          Order #{activeEnRoute.orderNumber}
                        </Text>
                        <Text style={[styles.trackingMaterialName, { color: theme.textSecondary }]}>
                          {activeEnRoute.materialName}
                        </Text>
                      </View>
                      <View style={[styles.etaPill, { backgroundColor: theme.surfaceSecondary }]}>
                        <Text style={[styles.etaPillText, { color: theme.textPrimary }]}>{activeEnRoute.estimatedArrival}</Text>
                      </View>
                    </View>

                    {/* Delivery Meta */}
                    <View style={styles.deliveryMetaRow}>
                      <View style={styles.deliveryMetaCol}>
                        <Text style={[styles.metaLabelText, { color: theme.textSecondary }]}>Driver</Text>
                        <Text style={[styles.metaValText, { color: theme.textPrimary }]}>{activeEnRoute.driverName} ({activeEnRoute.vehicleNumber})</Text>
                      </View>
                      <View style={styles.deliveryMetaCol}>
                        <Text style={[styles.metaLabelText, { color: theme.textSecondary }]}>Destination</Text>
                        <Text style={[styles.metaValText, { color: theme.textPrimary }]} numberOfLines={1}>{activeEnRoute.siteAddress}</Text>
                      </View>
                    </View>

                    {/* Vertical Tracking Hierarchy */}
                    <View style={styles.verticalHierarchy}>
                      {dynamicTrackingSteps.map((step, idx) => {
                        const isLast = idx === dynamicTrackingSteps.length - 1;
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

                {/* Past Orders List */}
                <View style={[styles.trackingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.trackingCardHeader, { borderBottomColor: theme.borderLight }]}>
                    <Text style={[styles.trackingOrderNumber, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                      Previous Orders
                    </Text>
                    <Text style={[styles.metaLabelText, { color: theme.textSecondary }]}>{deliveries.length}</Text>
                  </View>

                  <View style={styles.deliveriesList}>
                    {deliveries.map((del, idx) => (
                      <View key={del.id} style={[styles.deliveryRow, idx > 0 && { borderTopColor: theme.borderLight, borderTopWidth: 1 }]}>
                        <View style={styles.deliveryLeftInfo}>
                          <Text style={[styles.delMaterialName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {del.materialName}
                          </Text>
                          <Text style={[styles.timestampText, { color: theme.textSecondary }]}>
                            {del.timestamp} • {del.vehicleNumber}
                          </Text>
                        </View>

                        <View style={styles.deliveryRightInfo}>
                          <Text style={[styles.delAmountText, { color: theme.textPrimary }]}>
                            ₹{del.totalAmount.toLocaleString('en-IN')}
                          </Text>
                          <Text
                            style={[
                              styles.statusBadgeText,
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
          </View>
        )}

        {/* Razorpay Modal */}
        <RazorpayModal
          visible={showRazorpayModal}
          onClose={() => setShowRazorpayModal(false)}
          amount={grandTotal}
          orderDescription={`Order (${cartItems.length} items) - Urbanico Supply`}
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
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.2,
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
    fontSize: 11,
    fontWeight: '400',
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: '500',
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
    width: 56,
    height: 56,
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
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  itemOptionLabel: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 3,
    letterSpacing: -0.1,
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
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingBottom: 6,
    letterSpacing: -0.2,
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
    fontWeight: '500',
  },
  grandTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  appleCtaBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  appleCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  historySection: {
    gap: 16,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -4,
  },
  backToCartBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backToCartBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  trackingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  trackingOrderNumber: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  trackingMaterialName: {
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
  deliveryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  deliveryMetaCol: {
    flex: 1,
    gap: 2,
  },
  metaLabelText: {
    fontSize: 11,
    fontWeight: '400',
  },
  metaValText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verticalHierarchy: {
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
  deliveriesList: {
    paddingTop: 4,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deliveryLeftInfo: {
    flex: 1,
    gap: 2,
  },
  delMaterialName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 12,
  },
  deliveryRightInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  delAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  nikeEmptyBagContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 90,
    paddingHorizontal: 24,
  },
  nikeEmptyBagIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nikeEmptyBagTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  nikeEmptyBagSub: {
    fontSize: 14,
    color: '#707072',
    textAlign: 'center',
    marginBottom: 28,
  },
  nikeShopNowPill: {
    backgroundColor: '#111111',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nikeShopNowPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  nikeCheckoutPill: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 30,
    marginTop: 8,
  },
  nikeCheckoutPillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
