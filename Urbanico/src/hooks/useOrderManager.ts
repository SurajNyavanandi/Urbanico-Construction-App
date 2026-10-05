import { useState, useEffect, useCallback } from 'react';
import { ActivityDelivery, UserProfile } from '../types';
import { safeStorage } from '../utils/safeStorage';
import { formatSiteAddress } from '../utils/addressHelper';
import { apiService } from '../services/apiService';
import { resolveMaterialImage } from '../utils/materialImageResolver';

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
      const phone = authSaved ? JSON.parse(authSaved).phone : '';
      const cleanPhone = phone ? phone.replace(/[^0-9]/g, '').slice(-10) : '';
      if (isAuth && cleanPhone) {
        const userOrdersRaw = safeStorage.getItem(`urbanico_user_orders_${cleanPhone}`);
        if (userOrdersRaw) {
          const parsed = JSON.parse(userOrdersRaw);
          if (Array.isArray(parsed)) {
            return parsed
              .filter((del: any) => {
                const delPhone = (del.customerPhone || del.siteSupervisorPhone || '').replace(/[^0-9]/g, '');
                return !delPhone || delPhone.includes(cleanPhone);
              })
              .map((del: any, idx: number) => ({
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
    const cleanPhone = user?.phone ? user.phone.replace(/[^0-9]/g, '').slice(-10) : '';
    if (!isLoggedIn || !cleanPhone) {
      // Immediately reset deliveries when logged out or when phone is absent
      setDeliveries([]);
      return;
    }

    // Immediately clear deliveries from prior user to eliminate stale state
    setDeliveries([]);

    // Check phone-scoped local storage for instant offline display
    const userOrdersRaw = safeStorage.getItem(`urbanico_user_orders_${cleanPhone}`);
    if (userOrdersRaw) {
      try {
        const parsed = JSON.parse(userOrdersRaw);
        if (Array.isArray(parsed)) {
          const strictlyFiltered = parsed
            .filter((del: any) => {
              const delPhone = (del.customerPhone || del.siteSupervisorPhone || '').replace(/[^0-9]/g, '');
              return !delPhone || delPhone.includes(cleanPhone);
            })
            .map((del: any, idx: number) => ({
              ...del,
              id:
                del.id ||
                (del.orderNumber
                  ? `order-${del.orderNumber}-${idx}`
                  : `del-${Date.now()}-${idx}`),
              siteAddress: formatSiteAddress(del.siteAddress),
            }));
          setDeliveries(strictlyFiltered);
        }
      } catch {
        // ignore
      }
    }

    // Fetch backend orders strictly for this user phone
    apiService
      .getOrders({ phone: cleanPhone })
      .then((backendOrders) => {
        if (backendOrders) {
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
            deliveryOtp: bo.deliveryOtp || bo.otp || Math.floor(100000 + Math.random() * 900000).toString(),
            ewayBillNumber:
              bo.eWayBillNo ||
              `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
            cartItemsSnapshot: (bo.items || []).map((it: any, iIdx: number) => ({
              id: `ci-${bo.orderNumber}-${iIdx}`,
              itemId: it.materialId || `mat-${iIdx}`,
              itemName: it.name || 'Construction Material',
              categoryName: it.category || 'Materials',
              selectedOptionLabel: `${it.quantity || 1} ${it.unit || 'unit'}`,
              unitPrice: Number(it.unitPrice || 0),
              quantity: Number(it.quantity || 1),
              image: resolveMaterialImage({
                name: it.name,
                category: it.category,
                image: it.image,
              }),
            })),
          }));

          // Replace deliveries completely with current user's backend orders (NEVER merge with prev of prior user)
          setDeliveries(backendMapped);
          try {
            safeStorage.setItem(`urbanico_user_orders_${cleanPhone}`, JSON.stringify(backendMapped));
          } catch {}
        }
      })
      .catch(() => {});
  }, [isLoggedIn, user?.phone]);

  const addOrder = useCallback(
    (newOrder: ActivityDelivery) => {
      const sanitizedOrder: ActivityDelivery = {
        ...newOrder,
        siteAddress: formatSiteAddress(newOrder.siteAddress),
      };

      const cleanPhone = (user?.phone || sanitizedOrder.siteSupervisorPhone || '').replace(/[^0-9]/g, '').slice(-10);

      setDeliveries((prev) => {
        // Filter out any stale orders not belonging to this phone number
        const strictlyMine = prev.filter((d) => {
          const dPhone = (d.siteSupervisorPhone || (d as any).customerPhone || '').replace(/[^0-9]/g, '');
          return !cleanPhone || !dPhone || dPhone.includes(cleanPhone);
        });
        const updated = [sanitizedOrder, ...strictlyMine.filter((d) => d.orderNumber !== sanitizedOrder.orderNumber)];
        try {
          if (cleanPhone) {
            safeStorage.setItem(
              `urbanico_user_orders_${cleanPhone}`,
              JSON.stringify(updated)
            );
          }
        } catch {
          // ignore
        }
        return updated;
      });

      return sanitizedOrder;
    },
    [user?.phone]
  );

  const loadOrdersForPhone = useCallback((phone: string) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone) {
      setDeliveries([]);
      return;
    }

    // Clear state immediately to avoid cross-user flashing
    setDeliveries([]);

    try {
      const userOrdersRaw = safeStorage.getItem(`urbanico_user_orders_${cleanPhone}`);
      if (userOrdersRaw) {
        const parsed = JSON.parse(userOrdersRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed
            .filter((d: any) => {
              const dPhone = (d.customerPhone || d.siteSupervisorPhone || '').replace(/[^0-9]/g, '');
              return !dPhone || dPhone.includes(cleanPhone);
            })
            .map((d) => ({
              ...d,
              siteAddress: formatSiteAddress(d.siteAddress),
            }));
          setDeliveries(sanitized);
          return;
        }
      }
      // If no orders exist for this phone number, strictly set to empty array
      setDeliveries([]);
    } catch {
      setDeliveries([]);
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
          deliveryOtp: Math.floor(100000 + Math.random() * 900000).toString(),
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
