// ==============================================================================
// PAYMENT CONTROLLER
// POST /api/razorpay/create-order  -> Initiates order (Amount in paise or INR)
// POST /api/razorpay/verify-payment -> Verifies HMAC-SHA256 signature
// Port: 3000 (Local VSC: http://localhost:3000 | Render: https://urbanico.onrender.com)
// ==============================================================================

import { Request, Response } from 'express';
import { RazorpayBackendService } from '../services/razorpayService';
import { OrderService } from '../services/orderService';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';

/**
 * Reusable helper to safely parse and validate amount in paise from diverse request bodies.
 */
function parsePaiseAmount(body: any): number {
  const { amount, amountInRupees } = body || {};
  if (amountInRupees !== undefined && amountInRupees !== null) {
    return Math.round(Number(amountInRupees) * 100);
  }
  if (amount !== undefined && amount !== null) {
    return Math.round(Number(amount));
  }
  return 0;
}

export class PaymentController {
  // GET /api/razorpay/config (or /razorpay/config)
  public static getConfig = asyncHandler(async (req: Request, res: Response) => {
    const key_id = RazorpayBackendService.getKeyId();
    const mode = RazorpayBackendService.getKeyMode();
    const isConfigured = RazorpayBackendService.isConfigured();
    const maskedKey = RazorpayBackendService.getMaskedKey();

    console.log(`[Payment Backend] Config requested: Key=${maskedKey} | Mode=${mode} | Configured=${isConfigured}`);

    return sendSuccess(res, {
      key_id,
      mode,
      isConfigured,
      currency: 'INR',
    });
  });

  // POST /api/razorpay/create-order (or /api/create-order)
  public static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const { currency = 'INR', receipt, notes } = req.body;
    const amountInPaise = parsePaiseAmount(req.body);

    if (amountInPaise < 100) {
      return sendError(res, 'Minimum amount is ₹1.00 (100 paise)', 400);
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
  });

  // POST /api/razorpay/create-payment-link (or /razorpay/create-payment-link)
  public static createPaymentLink = asyncHandler(async (req: Request, res: Response) => {
    const { currency = 'INR', description, userName, userEmail, userPhone, order_id, notes } = req.body;
    const amountInPaise = parsePaiseAmount(req.body);

    if (amountInPaise < 100) {
      return sendError(res, 'Minimum amount is ₹1.00 (100 paise)', 400);
    }

    const link = await RazorpayBackendService.createPaymentLink({
      amountInPaise,
      currency,
      description,
      order_id,
      userName,
      userEmail,
      userPhone,
      notes,
    });

    return sendSuccess(res, {
      payment_link: link.short_url,
      short_url: link.short_url,
      payment_link_id: link.id,
      amount: link.amount,
      status: link.status,
    });
  });

  // POST /api/razorpay/verify-payment (or /api/verify-payment)
  public static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature.', 400);
    }

    console.log(`[Payment Backend] Incoming verify-payment: payment_id=${razorpay_payment_id}, order_id=${razorpay_order_id}`);

    const { isValid, mode, reason } = RazorpayBackendService.verifySignature({
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

    return sendSuccess(res, {
      verified: true,
      razorpay_order_id,
      razorpay_payment_id,
      mode,
      reason,
      verified_at: new Date().toISOString(),
    }, 'Payment signature verified successfully');
  });

  // POST & GET /api/razorpay/callback -> Native Web Redirection Callback
  public static async handleCallback(req: Request, res: Response) {
    try {
      const body = req.method === 'POST' ? req.body : req.query;
      const razorpay_order_id = body.razorpay_order_id || req.query.razorpay_order_id || '';
      const razorpay_payment_id = body.razorpay_payment_id || req.query.razorpay_payment_id || '';
      const razorpay_signature = body.razorpay_signature || req.query.razorpay_signature || '';
      const origin = (req.query.origin as string) || (body.origin as string) || 'https://urbanico.vercel.app';
      const amount = req.query.amount || body.amount || '';
      const customOrderId = req.query.order_id || body.order_id || '';

      console.log('[Payment Backend] Native callback received:', {
        razorpay_payment_id,
        razorpay_order_id,
        has_signature: Boolean(razorpay_signature),
        origin,
      });

      if (!razorpay_payment_id) {
        // Payment was cancelled or rejected by user
        const targetUrl = new URL(origin);
        targetUrl.searchParams.set('payment_status', 'cancelled');
        return res.redirect(targetUrl.toString());
      }

      // Verify HMAC-SHA256 signature
      const { isValid } = RazorpayBackendService.verifySignature({
        razorpay_order_id: String(razorpay_order_id),
        razorpay_payment_id: String(razorpay_payment_id),
        razorpay_signature: String(razorpay_signature),
      });

      if (isValid && (customOrderId || razorpay_order_id)) {
        try {
          await OrderService.updatePaymentStatus(String(customOrderId || razorpay_order_id), 'paid', {
            razorpay_order_id: String(razorpay_order_id),
            razorpay_payment_id: String(razorpay_payment_id),
            razorpay_signature: String(razorpay_signature),
            paidAt: new Date(),
          });
        } catch {}
      }

      const targetUrl = new URL(origin);
      targetUrl.searchParams.set('payment_status', isValid ? 'success' : 'failed');
      targetUrl.searchParams.set('razorpay_payment_id', String(razorpay_payment_id));
      targetUrl.searchParams.set('razorpay_order_id', String(razorpay_order_id));
      targetUrl.searchParams.set('razorpay_signature', String(razorpay_signature));
      if (amount) targetUrl.searchParams.set('amount', String(amount));
      if (customOrderId) targetUrl.searchParams.set('order_id', String(customOrderId));

      console.log(`[Payment Backend] Redirecting to frontend URL: ${targetUrl.toString()}`);
      return res.redirect(targetUrl.toString());
    } catch (err: any) {
      console.error('[Payment Backend] Callback error:', err?.message || err);
      return res.redirect('https://urbanico.vercel.app/?payment_status=error');
    }
  }

  // GET /api/razorpay/checkout-page (or /razorpay/checkout-page)
  public static async renderCheckoutPage(req: Request, res: Response) {
    try {
      const order_id = (req.query.order_id as string) || '';
      const amount = Number(req.query.amount || 0);
      const key_id = (req.query.key_id as string) || RazorpayBackendService.getKeyId();
      const name = (req.query.name as string) || 'Urbanico Customer';
      const email = (req.query.email as string) || 'customer@urbanico.in';
      const phone = (req.query.phone as string) || '';
      const description = (req.query.description as string) || 'Urbanico Materials Dispatch';
      const callback_url = (req.query.callback_url as string) || '';

      const formattedAmount = (amount > 0 ? amount / 100 : 99).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Razorpay Secure Checkout | Urbanico</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0B0F19; color: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #131B2E; border: 1px solid #1E293B; border-radius: 20px; max-width: 420px; width: 100%; padding: 28px 24px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .shield-icon { width: 56px; height: 56px; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #38BDF8; font-size: 24px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 6px; color: #FFFFFF; }
    .sub { font-size: 13px; color: #94A3B8; margin-bottom: 24px; line-height: 1.4; }
    .amount-box { background: #1E293B; border-radius: 12px; padding: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-size: 12px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
    .amount-value { font-size: 22px; font-weight: 800; color: #F59E0B; }
    .btn-pay { background: #F59E0B; color: #000000; border: none; border-radius: 12px; width: 100%; padding: 15px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; }
    .btn-pay:hover { background: #D97706; }
    .btn-pay:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Payment</h1>
    <p class="sub">Urbanico Direct materials & trade services</p>
    
    <div class="amount-box">
      <span class="amount-label">Total Payable</span>
      <span class="amount-value">₹${formattedAmount}</span>
    </div>

    <button id="pay-btn" class="btn-pay" onclick="launchRazorpay()">
      <span id="btn-text">Open Razorpay Gateway</span>
    </button>
  </div>

  <script>
    const options = {
      key: ${JSON.stringify(key_id)},
      amount: ${amount},
      currency: "INR",
      name: "Urbanico Direct",
      description: ${JSON.stringify(description)},
      image: "https://res.cloudinary.com/dfr0zghtc/image/upload/v1785931560/Cement_Bag_u0w3w9.png",
      order_id: ${order_id ? JSON.stringify(order_id) : 'undefined'},
      prefill: {
        name: ${JSON.stringify(name)},
        email: ${JSON.stringify(email)},
        contact: ${JSON.stringify(phone)}
      },
      notes: {
        platform: "urbanico_mobile_app"
      },
      theme: {
        color: "#111111"
      },
      handler: function(response) {
        document.getElementById('btn-text').innerText = 'Verifying Payment...';
        fetch('/api/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          const callback = ${JSON.stringify(callback_url)};
          if (callback) {
            const separator = callback.includes('?') ? '&' : '?';
            window.location.href = callback + separator + 'razorpay_payment_id=' + response.razorpay_payment_id + '&razorpay_order_id=' + response.razorpay_order_id + '&razorpay_signature=' + response.razorpay_signature + '&status=success';
          } else {
            document.body.innerHTML = '<div class="card"><h1 style="color:#10B981">Payment Successful!</h1><p class="sub">Payment ID: ' + response.razorpay_payment_id + '</p></div>';
          }
        })
        .catch(function(err) {
          alert('Payment verification error: ' + err.message);
        });
      }
    };

    function launchRazorpay() {
      try {
        const rzp = new Razorpay(options);
        rzp.open();
      } catch (err) {
        alert('Could not launch Razorpay: ' + err.message);
      }
    }

    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(launchRazorpay, 300);
    });
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err: any) {
      return res.status(500).send('<h1>Checkout Error</h1><p>' + (err?.message || 'Server error') + '</p>');
    }
  }
}
