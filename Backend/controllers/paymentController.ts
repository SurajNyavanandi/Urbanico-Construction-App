import { Request, Response } from 'express';
import { RazorpayBackendService } from '../services/razorpayService';
import { OrderService } from '../services/orderService';

export class PaymentController {
  // POST /api/create-order or /api/razorpay/create-order
  public static async createOrder(req: Request, res: Response) {
    try {
      const { amount, currency = 'INR', receipt, notes, amountInRupees } = req.body;

      if (amount === undefined && amountInRupees === undefined) {
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

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('Error in PaymentController.createOrder:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to create payment order',
      });
    }
  }

  // POST /api/verify-payment or /api/razorpay/verify-payment
  public static async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
        });
      }

      const { isValid } = RazorpayBackendService.verifySignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Payment verification failed: Invalid HMAC-SHA256 signature hash mismatch',
          error: 'Signature mismatch',
        });
      }

      // If an existing order ID or orderNumber is linked, update it in MongoDB
      if (orderId) {
        try {
          await OrderService.updatePaymentStatus(orderId, 'paid', {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paidAt: new Date(),
            receiptNumber: `RCPT-${Date.now().toString().slice(-6)}`,
          });
        } catch (dbErr) {
          console.warn('Could not update order payment status in DB:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Razorpay payment signature verified successfully',
        razorpay_order_id,
        razorpay_payment_id,
        verified_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in PaymentController.verifyPayment:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error during verification',
      });
    }
  }
}
