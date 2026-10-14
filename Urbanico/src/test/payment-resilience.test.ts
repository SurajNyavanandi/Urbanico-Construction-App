import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  verifyRazorpayPayment,
  savePendingPaymentHandshake,
  clearPendingPaymentHandshake,
  getPendingPaymentHandshakes,
  reconcilePendingPaymentsAndOrders,
  sanitizePaymentPayload,
} from '../services/razorpayService';
import { safeStorage } from '../utils/safeStorage';
import { apiService } from '../services/apiService';

describe('Payment & Resilience Module', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Payload Sanitization & Exact Gateway Keys', () => {
    it('sanitizes and preserves exact Razorpay gateway response keys', () => {
      const gatewayResponse = {
        razorpay_order_id: '  order_DA2910AKLZ  ',
        razorpay_payment_id: '\u0000pay_9988776655\u001F',
        razorpay_signature: '  9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d  ',
      };

      const sanitized = sanitizePaymentPayload(gatewayResponse);

      expect(sanitized.razorpay_order_id).toBe('order_DA2910AKLZ');
      expect(sanitized.razorpay_payment_id).toBe('pay_9988776655');
      expect(sanitized.razorpay_signature).toBe('9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d');
    });
  });

  describe('Payment Verification Handshake & Headers', () => {
    it('passes Authorization Bearer token and Idempotency-Key headers during payment verification', async () => {
      // Set auth token in storage
      safeStorage.setItem('urbanico_auth_token', 'test_jwt_session_token_xyz');

      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: {
            verified: true,
            razorpay_order_id: 'order_test_123',
            razorpay_payment_id: 'pay_test_456',
            message: 'Signature verified successfully',
          },
        }),
      } as any);

      const verificationResult = await verifyRazorpayPayment({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'signature_hash_valid_789',
      });

      expect(verificationResult.success).toBe(true);
      expect(verificationResult.verified).toBe(true);
      expect(mockFetch).toHaveBeenCalled();

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1]?.headers as Record<string, string>;

      expect(headers['Authorization']).toBe('Bearer test_jwt_session_token_xyz');
      expect(headers['Idempotency-Key']).toBe('pay_test_456');
    });

    it('handles 429 Rate Limit from payment verification endpoint and emits rate-limited event', async () => {
      let eventFired = false;
      let eventDetail: any = null;
      window.addEventListener('urbanico:rate-limited', (e: any) => {
        eventFired = true;
        eventDetail = e.detail;
      });

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '30' }),
        json: async () => ({ success: false, message: 'Too many verification attempts' }),
      } as any));

      await verifyRazorpayPayment({
        razorpay_order_id: 'order_rate_limited',
        razorpay_payment_id: 'pay_rate_limited',
        razorpay_signature: 'sig_rate_limited',
      });

      expect(eventFired).toBe(true);
      expect(eventDetail?.retryAfter).toBe(30);
    });
  });

  describe('Offline Queue & Safe Storage Handshakes', () => {
    it('saves, retrieves, and clears pending payment handshakes', () => {
      const sampleHandshake = {
        id: 'pay_offline_1',
        orderNumber: 'ORD-90210',
        razorpay_order_id: 'order_rzp_1',
        razorpay_payment_id: 'pay_offline_1',
        razorpay_signature: 'sig_offline_abc',
        amount: 2500,
        timestamp: Date.now(),
        orderPayload: { customerName: 'Rohan', customerPhone: '9876543210' },
      };

      savePendingPaymentHandshake(sampleHandshake);

      let stored = getPendingPaymentHandshakes();
      expect(stored).toHaveLength(1);
      expect(stored[0].razorpay_payment_id).toBe('pay_offline_1');

      // Clear by payment id
      clearPendingPaymentHandshake('pay_offline_1');
      stored = getPendingPaymentHandshakes();
      expect(stored).toHaveLength(0);
    });
  });

  describe('Network Reconnect & Resume Reconciliation', () => {
    it('reconciles pending handshakes on resume, verifies signature, places order, and clears queue', async () => {
      // 1. Save an orphaned handshake created when network dropped after gateway success
      const orphanedHandshake = {
        id: 'pay_reconcile_999',
        orderNumber: 'ORD-RECON-1',
        razorpay_order_id: 'order_rzp_999',
        razorpay_payment_id: 'pay_reconcile_999',
        razorpay_signature: 'sig_reconcile_xyz',
        amount: 3200,
        timestamp: Date.now(),
        orderPayload: {
          customerName: 'Priya Sharma',
          customerPhone: '9812345678',
          items: [{ materialId: 'cement-1', name: 'Cement', quantity: 8, unit: 'bag', price: 400 }],
        },
      };

      savePendingPaymentHandshake(orphanedHandshake);
      expect(getPendingPaymentHandshakes()).toHaveLength(1);

      // 2. Mock verification response & order status response
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('verify')) {
          return {
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              success: true,
              data: { verified: true, razorpay_payment_id: 'pay_reconcile_999' },
            }),
          } as any;
        }
        if (urlStr.includes('order-status') || urlStr.includes('orders/status')) {
          return {
            ok: true,
            json: async () => ({ success: true, paid: true, status: 'paid' }),
          } as any;
        }
        return {
          ok: true,
          json: async () => ({ success: true, data: {} }),
        } as any;
      });

      // 3. Spy on apiService.createOrder
      const createOrderSpy = vi.spyOn(apiService, 'createOrder').mockResolvedValueOnce({
        success: true,
        order: {
          _id: 'ord_created_recon',
          orderNumber: 'ORD-RECON-1',
          totalAmount: 3200,
          orderStatus: 'confirmed',
        },
        authoritative: true,
      });

      // 4. Run reconciliation
      let eventDetail: any = null;
      window.addEventListener('urbanico:payment-reconciled', (e: any) => {
        eventDetail = e.detail;
      });

      const reconResult = await reconcilePendingPaymentsAndOrders();

      expect(reconResult.reconciled).toBe(1);
      expect(reconResult.remaining).toBe(0);

      // Verify createOrder was invoked with reconciled payment details
      expect(createOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: 'paid',
          paymentDetails: expect.objectContaining({
            razorpay_payment_id: 'pay_reconcile_999',
            status: 'verified_reconciled',
          }),
        })
      );

      // Verify pending queue is cleaned up
      expect(getPendingPaymentHandshakes()).toHaveLength(0);

      // Verify custom event was emitted for UI synchronization
      expect(eventDetail?.paymentId).toBe('pay_reconcile_999');
    });
  });
});
