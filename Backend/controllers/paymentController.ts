// ==============================================================================
// PAYMENT CONTROLLER
// POST /api/razorpay/create-order  -> Initiates order (Amount in paise or INR)
// POST /api/razorpay/verify-payment -> Verifies HMAC-SHA256 signature
// Port: 3000 (Local VSC: http://localhost:3000 | Render: https://urbanico.onrender.com)
// ==============================================================================

import { Request, Response } from 'express';
import { RazorpayBackendService } from '../services/razorpayService';
import { OrderService } from '../services/orderService';

export class PaymentController {
  // GET /api/razorpay/config (or /razorpay/config)
  public static async getConfig(req: Request, res: Response) {
    try {
      const key_id = RazorpayBackendService.getKeyId();
      const mode = RazorpayBackendService.getKeyMode();
      const isConfigured = RazorpayBackendService.isConfigured();
      const maskedKey = RazorpayBackendService.getMaskedKey();

      console.log(`[Payment Backend] Config requested: Key=${maskedKey} | Mode=${mode} | Configured=${isConfigured}`);

      return res.status(200).json({
        success: true,
        key_id,
        mode,
        isConfigured,
        currency: 'INR',
      });
    } catch (err: any) {
      console.error('[Payment Backend] Get Config Error:', err?.message || err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to get payment config' });
    }
  }

  // POST /api/razorpay/create-order (or /api/create-order)
  public static async createOrder(req: Request, res: Response) {
    try {
      const { amount, currency = 'INR', receipt, notes, amountInRupees } = req.body;

      if (amount === undefined && amountInRupees === undefined) {
        return res.status(400).json({ success: false, error: 'Amount is required' });
      }

      // Convert to paise
      let amountInPaise = amount ? Number(amount) : Number(amountInRupees) * 100;
      if (amountInRupees) {
        amountInPaise = Math.round(Number(amountInRupees) * 100);
      } else {
        amountInPaise = Math.round(Number(amount));
      }

      if (amountInPaise < 100) {
        return res.status(400).json({ success: false, error: 'Minimum amount is ₹1.00 (100 paise)' });
      }

      console.log(`[Payment Backend] Incoming create-order: ₹${(amountInPaise / 100).toFixed(2)} (${amountInPaise} paise)`);

      const result = await RazorpayBackendService.createOrder({
        amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
      });

      console.log(`[Payment Backend] Order created successfully:`, {
        order_id: result.order_id || result.id,
        isReal: result.isRealRazorpayOrder,
        mode: result.mode,
      });

      const statusCode = result.success ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('[Payment Backend] Create Order Error:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to create payment order',
      });
    }
  }

  // POST /api/razorpay/verify-payment (or /api/verify-payment)
  public static async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature.',
        });
      }

      console.log(`[Payment Backend] Incoming verify-payment: payment_id=${razorpay_payment_id}, order_id=${razorpay_order_id}`);

      const { isValid, mode, expectedSignature, reason } = RazorpayBackendService.verifySignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        console.warn(`[Payment Backend] Signature verification FAILED for payment: ${razorpay_payment_id}`);
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Payment verification failed: signature mismatch',
          mode,
        });
      }

      console.log(`[Payment Backend] Signature verification SUCCESSFUL for payment: ${razorpay_payment_id}`);

      // Link and update order in DB if orderId provided
      if (orderId) {
        try {
          await OrderService.updatePaymentStatus(orderId, 'paid', {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paidAt: new Date(),
            receiptNumber: `RCPT-${Date.now().toString().slice(-6)}`,
          });
        } catch {
          // In-memory fallback
        }
      }

      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Payment signature verified successfully',
        razorpay_order_id,
        razorpay_payment_id,
        mode,
        reason,
        verified_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[Payment] Verify Error:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error during verification',
      });
    }
  }
}
