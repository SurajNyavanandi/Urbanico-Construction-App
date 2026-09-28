import { useState, useEffect, useCallback } from 'react';
import { ActivityDelivery, UserProfile } from '../types';
import { safeStorage } from '../utils/safeStorage';
import { formatSiteAddress } from '../utils/addressHelper';
import { apiService } from '../services/apiService';

export interface UseOrderManagerOptions {
  user: UserProfile;
  isLoggedIn: boolean;
  selectedLocation?: string;
  onPaymentSuccess?: (order: ActivityDelivery) => void;
  onPaymentFailure?: (error: string) => void;
  onPaymentCancel?: () => void;
}

export function useOrderManager({
  user,
  isLoggedIn,
  selectedLocation,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentCancel,
}: UseOrderManagerOptions) {
  const [deliveries, setDeliveries] = useState<ActivityDelivery[]>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const isAuth = authSaved ? JSON.parse(authSaved).isLoggedIn : false;
      if (isAuth) {
        const saved = safeStorage.getItem('urbanico_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((del: any, idx: number) => ({
              ...del,
              id:
                del.id ||
                (del.orderNumber
                  ? `order-${del.orderNumber}-${idx}`
                  : `del-${Date.now()}-${idx}`),
              siteAddress: formatSiteAddress(del.siteAddress),
            }));
          }
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Sync backend live orders on mount and auth changes
  useEffect(() => {
    if (isLoggedIn && user.phone) {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        apiService
          .getOrders({ phone: cleanPhone })
          .then((backendOrders) => {
            if (backendOrders && backendOrders.length > 0) {
              setDeliveries((prev) => {
                const backendMapped: ActivityDelivery[] = backendOrders.map((bo: any) => ({
                  id: bo._id || `del-${bo.orderNumber}`,
                  orderNumber: bo.orderNumber,
                  materialName:
                    bo.items?.map((i: any) => `${i.name} (${i.unit || 'unit'})`).join(', ') ||
                    'Direct Yard Supply Order',
                  quantity: `${
                    bo.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1
                  } Items`,
                  driverName: bo.driverName || 'Assigned Delivery Partner',
                  driverPhone: bo.driverPhone || 'Dispatch Support Desk',
                  vehicleType:
                    bo.vehicleType ||
                    (bo.isService ? 'Field Service Unit' : 'Commercial Transport'),
                  vehicleNumber: bo.vehicleNumber || 'TS 09 UB 5120',
                  estimatedArrival: bo.estimatedArrival || '35 mins away',
                  status: bo.orderStatus === 'delivered' ? 'Delivered' : 'En Route',
                  siteAddress:
                    bo.siteAddress?.street ||
                    bo.siteAddress?.siteName ||
                    'Site Location, Hyderabad',
                  siteSupervisorName: bo.customerName || 'Site Supervisor',
                  siteSupervisorPhone: bo.customerPhone || user.phone,
                  timestamp: new Date(bo.createdAt || Date.now()).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  }),
                  totalAmount: bo.totalAmount || 0,
                  deliveryOtp: bo.deliveryOtp || '261125',
                  ewayBillNumber:
                    bo.eWayBillNo ||
                    `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
                }));

                const existingNums = new Set(prev.map((d) => d.orderNumber));
                const newOnes = backendMapped.filter((d) => !existingNums.has(d.orderNumber));
                return [...newOnes, ...prev];
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [isLoggedIn, user.phone]);

  const addOrder = useCallback(
    (newOrder: ActivityDelivery) => {
      const sanitizedOrder: ActivityDelivery = {
        ...newOrder,
        siteAddress: formatSiteAddress(newOrder.siteAddress),
      };

      setDeliveries((prev) => {
        const updated = [sanitizedOrder, ...prev];
        try {
          safeStorage.setItem('urbanico_orders', JSON.stringify(updated));
          if (user && user.phone) {
            const cleanPhone = user.phone.replace(/[^0-9]/g, '');
            if (cleanPhone) {
              safeStorage.setItem(
                `urbanico_user_orders_${cleanPhone}`,
                JSON.stringify(updated)
              );
            }
          }
        } catch {
          // ignore
        }
        return updated;
      });

      return sanitizedOrder;
    },
    [user]
  );

  const loadOrdersForPhone = useCallback((phone: string) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return;

    try {
      const userOrdersRaw = safeStorage.getItem(`urbanico_user_orders_${cleanPhone}`);
      if (userOrdersRaw) {
        const parsed = JSON.parse(userOrdersRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map((d) => ({
            ...d,
            siteAddress: formatSiteAddress(d.siteAddress),
          }));
          setDeliveries(sanitized);
          safeStorage.setItem('urbanico_orders', JSON.stringify(sanitized));
          return;
        }
      }

      const generalOrdersRaw = safeStorage.getItem('urbanico_orders');
      if (generalOrdersRaw) {
        const parsedGen = JSON.parse(generalOrdersRaw);
        if (Array.isArray(parsedGen) && parsedGen.length > 0) {
          const sanitized = parsedGen.map((d) => ({
            ...d,
            siteAddress: formatSiteAddress(d.siteAddress),
          }));
          setDeliveries(sanitized);
          safeStorage.setItem(`urbanico_user_orders_${cleanPhone}`, JSON.stringify(sanitized));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const resetOrders = useCallback(() => {
    setDeliveries([]);
  }, []);

  // Handle Native Razorpay Web Redirection / Callback URL
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment_status');
      const paymentId = params.get('razorpay_payment_id');
      const orderId = params.get('razorpay_order_id') || params.get('order_id');
      const amountStr = params.get('amount');
      const errorMsg = params.get('error');

      if (paymentStatus === 'success' && paymentId) {
        const parsedAmount = amountStr ? parseFloat(amountStr) : 198;
        const newDelivery: ActivityDelivery = {
          id: `del-${Date.now()}`,
          orderNumber: orderId
            ? orderId.startsWith('URB-')
              ? orderId
              : `URB-${orderId.slice(-6).toUpperCase()}`
            : `URB-${Date.now().toString().slice(-6)}`,
          materialName: 'Materials Direct Supply',
          quantity: '1 Order',
          driverName: 'Assigned Fleet Partner',
          driverPhone: '+91 98480 12345',
          vehicleType: 'Heavy Commercial Fleet',
          vehicleNumber: 'TS 08 UB 4040',
          estimatedArrival: '45 mins',
          status: 'Placed',
          siteAddress: formatSiteAddress(selectedLocation || 'Site Destination'),
          timestamp: 'Just now',
          totalAmount: parsedAmount,
          deliveryOtp: '261125',
          ewayBillNumber: `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
          customerName: user?.name || 'Urbanico Customer',
          customerPhone: user?.phone || '9848012345',
          customerEmail: user?.email || 'customer@urbanico.in',
        };

        addOrder(newDelivery);
        onPaymentSuccess?.(newDelivery);

        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
        onPaymentFailure?.(errorMsg || 'Payment was declined or failed. Please retry.');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentStatus === 'cancelled') {
        onPaymentCancel?.();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('[Payment Callback] Error parsing callback parameters:', e);
    }
  }, [addOrder, onPaymentCancel, onPaymentFailure, onPaymentSuccess, selectedLocation, user]);

  return {
    deliveries,
    setDeliveries,
    addOrder,
    loadOrdersForPhone,
    resetOrders,
  };
}
