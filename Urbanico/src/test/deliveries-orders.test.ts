import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../services/apiService';
import { syncManager } from '../utils/syncManager';
import { safeStorage } from '../utils/safeStorage';
import { renderHook, act } from '@testing-library/react';
import { useOrderManager } from '../hooks/useOrderManager';
import { UserProfile, ActivityDelivery } from '../types';

describe('Deliveries & Orders Module', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    syncManager.clearOfflineQueue();
    vi.restoreAllMocks();
  });

  const mockUser: UserProfile = {
    name: 'Sunil Reddy',
    phone: '9848012345',
    email: 'sunil@reddybuilders.in',
    role: 'contractor',
    companyName: 'Reddy Builders',
    siteLocation: 'HITEC City, Hyderabad',
    avatarUrl: '',
    isVerified: true,
    activeOrdersCount: 0,
    creditLimit: 500000,
    usedCredit: 0,
    rewardPoints: 250,
  };

  describe('Order Creation API & Idempotency', () => {
    it('creates order via apiService with valid payload and returns authoritative order', async () => {
      const mockBackendOrder = {
        _id: 'ord_mongo_789',
        orderNumber: 'ORD-HYD-5501',
        customerName: 'Sunil Reddy',
        customerPhone: '9848012345',
        totalAmount: 18500,
        subtotal: 15000,
        taxAmount: 2700,
        deliveryCharges: 800,
        orderStatus: 'confirmed',
        createdAt: new Date().toISOString(),
        items: [
          {
            materialId: 'mat-cement-ultratech',
            name: 'UltraTech Cement 53G',
            category: 'cement',
            quantity: 40,
            unit: 'bag',
            unitPrice: 375,
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { order: mockBackendOrder },
        }),
      } as any);

      const created = await apiService.createOrder({
        customerName: 'Sunil Reddy',
        customerPhone: '9848012345',
        siteAddress: { siteName: 'Site 1', street: 'Phase 2, HITEC City', pincode: '500081' },
        items: [
          {
            materialId: 'mat-cement-ultratech',
            name: 'UltraTech Cement 53G',
            category: 'cement',
            quantity: 40,
            unit: 'bag',
            unitPrice: 375,
          },
        ],
        paymentStatus: 'paid',
      });

      expect(created.success).toBe(true);
      expect(created.order.orderNumber).toBe('ORD-HYD-5501');
      expect(created.order.totalAmount).toBe(18500);

      const requestHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
      expect(requestHeaders['Idempotency-Key']).toBeDefined();
    });
  });

  describe('Order Tracking Status Updates & useOrderManager', () => {
    it('loads and maps backend orders to ActivityDelivery models', async () => {
      const backendOrderList = [
        {
          _id: 'bo_1',
          orderNumber: 'UB-9911',
          customerName: 'Sunil Reddy',
          customerPhone: '9848012345',
          orderStatus: 'in_transit',
          totalAmount: 12500,
          driverName: 'Mohd Arif',
          driverPhone: '9876500001',
          vehicleNumber: 'TS 09 UB 5120',
          vehicleType: '10-Ton Tipper',
          estimatedArrival: '20 mins',
          deliveryOtp: '481920',
          eWayBillNo: 'EWB-TS-2026-9921',
          items: [{ materialId: 'sand-1', name: 'River Sand', quantity: 2, unit: 'ton', unitPrice: 6250 }],
          siteAddress: { street: 'Site 4, Financial District' },
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'bo_2',
          orderNumber: 'UB-9912',
          customerName: 'Sunil Reddy',
          customerPhone: '9848012345',
          orderStatus: 'delivered',
          totalAmount: 4500,
          items: [{ materialId: 'bricks-1', name: 'Fly Ash Bricks', quantity: 1000, unit: 'pcs', unitPrice: 4.5 }],
          siteAddress: { street: 'Site 4, Financial District' },
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(apiService, 'getOrders').mockResolvedValueOnce(backendOrderList as any);

      const { result } = renderHook(() =>
        useOrderManager({
          user: mockUser,
          isLoggedIn: true,
        })
      );

      // Wait for useEffect fetch to resolve
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(result.current.deliveries).toHaveLength(2);

      const activeDelivery = result.current.deliveries[0];
      expect(activeDelivery.orderNumber).toBe('UB-9911');
      expect(activeDelivery.status).toBe('En Route');
      expect(activeDelivery.driverName).toBe('Mohd Arif');
      expect(activeDelivery.vehicleNumber).toBe('TS 09 UB 5120');
      expect(activeDelivery.deliveryOtp).toBe('481920');
      expect(activeDelivery.ewayBillNumber).toBe('EWB-TS-2026-9921');

      const completedDelivery = result.current.deliveries[1];
      expect(completedDelivery.orderNumber).toBe('UB-9912');
      expect(completedDelivery.status).toBe('Delivered');
    });

    it('adds new delivery locally and isolates deliveries strictly by user phone', () => {
      const { result } = renderHook(() =>
        useOrderManager({
          user: mockUser,
          isLoggedIn: true,
        })
      );

      const newOrder: ActivityDelivery = {
        id: 'del-local-1',
        orderNumber: 'UB-LOCAL-100',
        materialName: 'Stone Aggregates 20mm',
        quantity: '5 Tons',
        driverName: 'Kishore Kumar',
        driverPhone: '9848099999',
        vehicleType: 'Heavy Tipper',
        vehicleNumber: 'TS 07 TR 4411',
        estimatedArrival: '15 mins',
        status: 'En Route',
        siteAddress: 'Road No 12, Banjara Hills',
        siteSupervisorName: 'Sunil Reddy',
        siteSupervisorPhone: '9848012345',
        timestamp: 'Oct 12',
        totalAmount: 9500,
        deliveryOtp: '772183',
        ewayBillNumber: 'EWB-TS-4411',
      };

      act(() => {
        result.current.addOrder(newOrder);
      });

      expect(result.current.deliveries).toHaveLength(1);
      expect(result.current.deliveries[0].orderNumber).toBe('UB-LOCAL-100');

      // Verify cached strictly in phone-scoped storage
      const cached = JSON.parse(
        safeStorage.getItem('urbanico_user_orders_9848012345') || '[]'
      );
      expect(cached).toHaveLength(1);
      expect(cached[0].orderNumber).toBe('UB-LOCAL-100');
    });
  });

  describe('Offline Sync Broadcast (syncManager)', () => {
    it('broadcasts messages to subscribers across instances', () => {
      const receivedMessages: any[] = [];
      const unsubscribe = syncManager.subscribe((msg) => {
        receivedMessages.push(msg);
      });

      syncManager.broadcast('CART_UPDATED', { itemCount: 3, subtotal: 4500 });

      // Verify that local safeStorage backup event was written
      const syncEvent = JSON.parse(safeStorage.getItem('urbanico_sync_event') || '{}');
      expect(syncEvent.type).toBe('CART_UPDATED');
      expect(syncEvent.payload.itemCount).toBe(3);

      unsubscribe();
    });

    it('manages offline mutation queue (enqueue, read, clear)', () => {
      expect(syncManager.getOfflineQueue()).toHaveLength(0);

      syncManager.enqueueMutation('CREATE_ORDER', {
        orderNumber: 'OFFLINE-ORD-1',
        amount: 5200,
      });
      syncManager.enqueueMutation('UPDATE_CART', {
        itemId: 'mat-123',
        quantity: 5,
      });

      const queue = syncManager.getOfflineQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].action).toBe('CREATE_ORDER');
      expect(queue[0].data.orderNumber).toBe('OFFLINE-ORD-1');
      expect(queue[1].action).toBe('UPDATE_CART');

      syncManager.clearOfflineQueue();
      expect(syncManager.getOfflineQueue()).toHaveLength(0);
    });

    it('calculates stock reservation timer countdown correctly', () => {
      const now = Date.now();
      // Cart created 2 minutes ago (120 seconds ago)
      const twoMinutesAgo = now - 2 * 60 * 1000;
      const remainingSeconds = syncManager.getStockReservationRemainingSeconds(twoMinutesAgo);

      // Remaining should be approximately 8 minutes (480 seconds)
      expect(remainingSeconds).toBeGreaterThanOrEqual(478);
      expect(remainingSeconds).toBeLessThanOrEqual(481);

      // Cart created 11 minutes ago (expired)
      const elevenMinutesAgo = now - 11 * 60 * 1000;
      expect(syncManager.getStockReservationRemainingSeconds(elevenMinutesAgo)).toBe(0);
    });
  });
});
