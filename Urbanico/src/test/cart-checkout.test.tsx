import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { calculateCartTotals } from '../utils/cartCalculations';
import { apiService } from '../services/apiService';
import { MaterialItem, UnitOption } from '../types';

describe('Cart & Checkout Module', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const sampleOption: UnitOption = {
    id: 'opt-1',
    label: '50kg Bag',
    price: 380,
    type: 'stepper',
  };

  const sampleMaterial: MaterialItem = {
    id: 'mat-cement-53',
    name: 'OPC 53 Grade Cement',
    categoryId: 'cement',
    defaultPrice: 380,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12',
    actionType: 'add_to_cart',
    options: [sampleOption],
  };

  const sampleServiceOption: UnitOption = {
    id: 'opt-service',
    label: 'Expert Site Visit',
    price: 99,
    type: 'radio',
  };

  const sampleService: MaterialItem = {
    id: 'service-expert-mason',
    name: 'Master Mason Site Consultation',
    categoryId: 'services',
    defaultPrice: 99,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
    actionType: 'add_to_cart',
    options: [sampleServiceOption],
  };

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <CartProvider>{children}</CartProvider>
  );

  describe('Adding & Removing Items in CartContext', () => {
    it('adds physical materials and calculates correct line totals', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(sampleMaterial, sampleMaterial.options[0], 5, 380);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].itemName).toBe('OPC 53 Grade Cement');
      expect(result.current.cartItems[0].quantity).toBe(5);
      expect(result.current.cartItems[0].unitPrice).toBe(380);
      expect(result.current.totals.materialsSubtotal).toBe(1900);
    });

    it('updates quantity and removes item when quantity reaches zero', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(sampleMaterial, sampleMaterial.options[0], 2, 380);
      });

      const itemId = result.current.cartItems[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 10);
      });
      expect(result.current.cartItems[0].quantity).toBe(10);
      expect(result.current.totals.materialsSubtotal).toBe(3800);

      act(() => {
        result.current.updateQuantity(itemId, 0);
      });
      expect(result.current.cartItems).toHaveLength(0);
    });

    it('supports addBundleToCart for multi-item construction kits', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addBundleToCart([
          {
            itemId: 'mat-sand-1',
            itemName: 'River Sand',
            categoryName: 'aggregates',
            optionLabel: '1 Ton',
            unitPrice: 1200,
            quantity: 2,
            image: '',
          },
          {
            itemId: 'mat-bricks-1',
            itemName: 'Red Clay Bricks',
            categoryName: 'bricks',
            optionLabel: '500 Pcs',
            unitPrice: 3500,
            quantity: 1,
            image: '',
          },
        ]);
      });

      expect(result.current.cartItems).toHaveLength(2);
      expect(result.current.totals.subtotal).toBe(5900); // 2400 + 3500
    });
  });

  describe('Coupon Application & Edge Cases', () => {
    it('applies percentage-based coupon URBAN10 on eligible material cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(sampleMaterial, sampleMaterial.options[0], 10, 380); // 3800
      });

      let couponRes: any;
      act(() => {
        couponRes = result.current.applyCoupon('URBAN10');
      });

      expect(couponRes.success).toBe(true);
      expect(result.current.appliedCoupon).toBe('URBAN10');
      expect(result.current.couponDiscount).toBe(380); // 10% of 3800
    });

    it('rejects coupon application on empty cart or service-only carts', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      let emptyRes: any;
      act(() => {
        emptyRes = result.current.applyCoupon('URBAN10');
      });
      expect(emptyRes.success).toBe(false);

      act(() => {
        result.current.addToCart(sampleService, sampleService.options[0], 1, 99);
      });

      let serviceRes: any;
      act(() => {
        serviceRes = result.current.applyCoupon('URBAN10');
      });
      expect(serviceRes.success).toBe(false);
      expect(serviceRes.message).toMatch(/not applicable on trade service/i);
    });

    it('rejects SITE500 if order subtotal is below minimum threshold of ₹2,000', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(sampleMaterial, sampleMaterial.options[0], 2, 380); // 760
      });

      let res: any;
      act(() => {
        res = result.current.applyCoupon('SITE500');
      });

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Minimum order value of ₹2,000 required/i);
    });

    it('auto-revokes coupon when cart items are reduced below eligibility', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(sampleMaterial, sampleMaterial.options[0], 6, 380); // 2280
      });

      act(() => {
        result.current.applyCoupon('SITE500');
      });
      expect(result.current.couponDiscount).toBe(500);

      // Reduce quantity to 1 bag (380 subtotal < 2000 threshold)
      const itemId = result.current.cartItems[0].id;
      act(() => {
        result.current.updateQuantity(itemId, 1);
      });

      expect(result.current.appliedCoupon).toBeNull();
      expect(result.current.couponDiscount).toBe(0);
    });
  });

  describe('Server-Authoritative Pricing Calculations (calculateCartTotals)', () => {
    it('applies statutory 18% GST tax strictly to materials, exempting services', () => {
      const mixedCart: any[] = [
        {
          id: '1',
          itemId: 'mat-1',
          itemName: 'Steel Rebar TMT 500D',
          categoryName: 'steel',
          unitPrice: 5000,
          quantity: 2, // 10000
        },
        {
          id: '2',
          itemId: 'service-1',
          itemName: 'Structural Engineer Site Visit',
          categoryName: 'services',
          unitPrice: 500,
          quantity: 1, // 500
        },
      ];

      const totals = calculateCartTotals(mixedCart, 0, 10);
      expect(totals.materialsSubtotal).toBe(10000);
      expect(totals.servicesSubtotal).toBe(500);
      expect(totals.subtotal).toBe(10500);
      expect(totals.gstTax).toBe(1800); // 18% of 10,000 only
    });

    it('sets delivery charges and unloading charges to 0 for service-only orders', () => {
      const servicesCart: any[] = [
        {
          id: 'svc-1',
          itemId: 'service-mason',
          itemName: 'Mason Site Visit',
          categoryName: 'services',
          unitPrice: 99,
          quantity: 1,
        },
      ];

      const totals = calculateCartTotals(servicesCart, 0, 25, 300, 150);
      expect(totals.isServicesOnly).toBe(true);
      expect(totals.deliveryCharge).toBe(0);
      expect(totals.unloadingCharge).toBe(0);
      expect(totals.gstTax).toBe(0);
      expect(totals.grandTotal).toBe(99);
    });

    it('calculates distance-based delivery fee for materials with custom unloading assistance', () => {
      const materialsCart: any[] = [
        {
          id: 'mat-1',
          itemId: 'cement',
          itemName: 'Cement Bags',
          categoryName: 'cement',
          unitPrice: 400,
          quantity: 10, // 4000
        },
      ];

      // 20 km distance => 20 * 5 = 100
      const totals = calculateCartTotals(materialsCart, 200, 20, undefined, 250);
      expect(totals.subtotal).toBe(4000);
      expect(totals.gstTax).toBe(720); // 18% of 4000
      expect(totals.deliveryCharge).toBe(100); // 20 * 5
      expect(totals.unloadingCharge).toBe(250);
      expect(totals.couponDiscount).toBe(200);
      // 4000 + 720 + 100 + 250 - 200 = 4870
      expect(totals.grandTotal).toBe(4870);
    });
  });

  describe('Checkout Payload Hygiene & Server Breakdown Reflection', () => {
    it('sanitizes item payloads, stripping disallowed keys before sending to server', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            order: {
              _id: 'ord_backend_123',
              orderNumber: 'ORD-998877',
              totalAmount: 4870,
              subtotal: 4000,
              taxAmount: 720,
              deliveryCharges: 100,
              unloadingCharges: 250,
              orderStatus: 'confirmed',
            },
          },
        }),
      } as any);

      const rawItemsWithExtraProps: any[] = [
        {
          materialId: 'mat-steel-12',
          name: 'TMT Steel 12mm',
          category: 'steel',
          quantity: 5,
          unit: 'bundle',
          unitPrice: 800,
          // Extra disallowed properties:
          itemTotal: 4000,
          calculatedTax: 720,
          deliveryFee: 100,
          clientTamperedTotal: 99,
          internalDebugFlag: true,
        },
      ];

      const res = await apiService.createOrder({
        customerName: 'Aarav Patel',
        customerPhone: '9876543210',
        siteAddress: { siteName: 'Site 1', street: 'Plot 45, Jubilee Hills', city: 'Hyderabad', pincode: '500033' },
        items: rawItemsWithExtraProps,
        paymentStatus: 'paid',
      });

      expect(mockFetch).toHaveBeenCalled();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);

      // Verify the sent item only includes valid schema properties
      const sentItem = callBody.items[0];
      expect(sentItem.materialId).toBe('mat-steel-12');
      expect(sentItem.name).toBe('TMT Steel 12mm');
      expect(sentItem.quantity).toBe(5);
      expect(sentItem.unitPrice).toBe(800);

      // Verify stripped disallowed keys
      expect(sentItem.itemTotal).toBeUndefined();
      expect(sentItem.calculatedTax).toBeUndefined();
      expect(sentItem.deliveryFee).toBeUndefined();
      expect(sentItem.clientTamperedTotal).toBeUndefined();
      expect(sentItem.internalDebugFlag).toBeUndefined();

      // Verify server authoritative returned breakdown is reflected
      expect(res.success).toBe(true);
      expect(res.order.orderNumber).toBe('ORD-998877');
      expect(res.order.totalAmount).toBe(4870);
      expect(res.order.taxAmount).toBe(720);
    });
  });
});
