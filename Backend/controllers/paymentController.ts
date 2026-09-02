import { Request, Response } from 'express';
import { RazorpayBackendService } from '../services/razorpayService';
import { OrderService } from '../services/orderService';

export class PaymentController {
  // POST /api/create-order or /api/razorpay/create-order
  public static async createOrder(req: Request, res: Response) {
    console.log(`[PaymentController.createOrder] Received request body:`, JSON.stringify(req.body));
    try {
      const { amount, currency = 'INR', receipt, notes, amountInRupees } = req.body;

      if (amount === undefined && amountInRupees === undefined) {
        console.warn(`[PaymentController.createOrder] ❌ Rejected: Amount parameter missing`);
        return res.status(400).json({
          success: false,
          error: 'Amount parameter is required',
        });
      }

      // If amount passed in rupees (like 500 for ₹500) vs already paise
      let amountInPaise = amount ? Number(amount) : Number(amountInRupees) * 100;
      if (amountInRupees) {
        amountInPaise = Math.round(Number(amountInRupees) * 100);
      } else {
        amountInPaise = Math.round(Number(amount));
      }

      if (amountInPaise < 100) {
        console.warn(`[PaymentController.createOrder] ❌ Rejected: Amount ₹${(amountInPaise / 100).toFixed(2)} is less than minimum ₹1.00`);
        return res.status(400).json({
          success: false,
          error: 'Amount must be at least ₹1.00 (100 paise)',
        });
      }

      const result = await RazorpayBackendService.createOrder({
        amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
      });

      console.log(`[PaymentController.createOrder] Sending response to client:`, {
        success: result.success,
        order_id: result.order_id,
        mode: (result as any).mode,
        isLive: (result as any).isLive,
      });

      const statusCode = result.success ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('[PaymentController.createOrder] ❌ Unhandled Exception:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to create payment order',
      });
    }
  }

  // POST /api/verify-payment or /api/razorpay/verify-payment
  public static async verifyPayment(req: Request, res: Response) {
    console.log(`[PaymentController.verifyPayment] Received request body:`, JSON.stringify(req.body));
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.warn(`[PaymentController.verifyPayment] ❌ Rejected: Missing required payment verification parameters`);
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
        });
      }

      const { isValid, mode, expectedSignature, reason } = RazorpayBackendService.verifySignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        console.error(`[PaymentController.verifyPayment] ❌ HMAC Signature Verification Mismatch:`, {
          expected: expectedSignature,
          received: razorpay_signature,
        });
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Payment verification failed: Invalid HMAC-SHA256 signature hash mismatch',
          error: 'Signature mismatch',
          mode,
        });
      }

      console.log(`[PaymentController.verifyPayment] ✅ Signature successfully verified in ${mode} mode.`);

      // If an existing order ID or orderNumber is linked, update it in MongoDB
      if (orderId) {
        try {
          console.log(`[PaymentController.verifyPayment] Updating DB order ${orderId} payment status to 'paid'...`);
          await OrderService.updatePaymentStatus(orderId, 'paid', {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paidAt: new Date(),
            receiptNumber: `RCPT-${Date.now().toString().slice(-6)}`,
          });
          console.log(`[PaymentController.verifyPayment] ✅ DB Order ${orderId} updated to 'paid'.`);
        } catch (dbErr) {
          console.warn('[PaymentController.verifyPayment] Notice: Could not update order payment status in DB:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Razorpay payment signature verified successfully',
        razorpay_order_id,
        razorpay_payment_id,
        mode,
        reason,
        verified_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[PaymentController.verifyPayment] ❌ Unhandled Exception:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error during verification',
      });
    }
  }
}
