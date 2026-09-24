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
    .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
    .spinner { width: 44px; height: 44px; border: 3.5px solid rgba(245, 158, 11, 0.2); border-top-color: #F59E0B; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { font-size: 15px; font-weight: 600; color: #94A3B8; letter-spacing: -0.2px; }
  </style>
</head>
<body>
  <div class="loader-container">
    <div class="spinner"></div>
    <p class="loading-text">Loading Payment Options...</p>
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
      readonly: {
        contact: true,
        email: true,
        name: true
      },
      config: {
        display: {
          preferences: {
            show_default_blocks: true
          },
          sequence: ["block.upi", "block.cards", "block.netbanking", "block.wallets"]
        }
      },
      display: {
        preferences: {
          show_default_blocks: true
        },
        sequence: ["block.upi", "block.cards", "block.netbanking", "block.wallets"]
      },
      notes: {
        platform: "urbanico_mobile_app"
      },
      theme: {
        color: "#111111"
      },
      modal: {
        ondismiss: function() {
          if (window.history.length > 1) {
            window.history.back();
          }
        }
      },
      handler: function(response) {
        var btn = document.getElementById('btn-text');
        if (btn) btn.innerText = 'Verifying Payment...';
        var loadingText = document.querySelector('.loading-text');
        if (loadingText) loadingText.innerText = 'Verifying Payment...';
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
            document.body.innerHTML = '<div style="background:#1E293B;border-radius:16px;padding:32px;text-align:center;max-width:380px;border:1px solid #334155;"><h1 style="color:#10B981;font-size:22px;margin-bottom:8px;">Payment Successful!</h1><p style="color:#94A3B8;font-size:14px;">Payment ID: ' + response.razorpay_payment_id + '</p></div>';
          }
        })
        .catch(function(err) {
          console.error('Payment verification error: ', err);
          var lt = document.querySelector('.loading-text');
          if (lt) lt.innerText = 'Payment received. Redirecting...';
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
      launchRazorpay();
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

  // ============================================================================
  // RAZORPAY TOKENIZATION & ONE-TAP CHECKOUT CONTROLLER ENDPOINTS
  // ============================================================================

  // POST /api/razorpay/customer
  public static getOrCreateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, contact, phone, notes } = req.body;
    const cleanPhone = (contact || phone || '').replace(/[^0-9]/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return sendError(res, 'Valid 10-digit mobile number required for customer record', 400);
    }

    const customer = await RazorpayBackendService.getOrCreateCustomer({
      name: name || 'Urbanico Customer',
      email: email || `${cleanPhone}@urbanico.in`,
      contact: cleanPhone,
      notes,
    });

    return sendSuccess(res, { customer });
  });

  // GET /api/razorpay/tokens
  public static getCustomerTokens = asyncHandler(async (req: Request, res: Response) => {
    const customerId = (req.query.customerId as string) || (req.query.customer_id as string) || '';
    const phone = (req.query.phone as string) || '';

    if (!customerId && !phone) {
      return sendError(res, 'Customer ID or phone number required to retrieve saved card tokens', 400);
    }

    const tokens = await RazorpayBackendService.fetchCustomerTokens(customerId, phone);
    return sendSuccess(res, { tokens, count: tokens.length });
  });

  // POST /api/razorpay/tokenize-card
  public static tokenizeCard = asyncHandler(async (req: Request, res: Response) => {
    const { customerId, phone, cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = req.body;

    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      return sendError(res, 'Missing card details for tokenization', 400);
    }

    const cleanNum = String(cardNumber).replace(/\D/g, '');
    if (cleanNum.length < 15 || cleanNum.length > 19) {
      return sendError(res, 'Invalid card number length', 400);
    }

    let activeCustId = customerId;
    if (!activeCustId && phone) {
      const cust = await RazorpayBackendService.getOrCreateCustomer({
        name: cardHolder,
        email: `${phone.replace(/\D/g, '')}@urbanico.in`,
        contact: phone,
      });
      activeCustId = cust.id;
    }

    const tokenRecord = await RazorpayBackendService.tokenizeCard({
      customerId: activeCustId || `cust_${Date.now()}`,
      phone: phone || '',
      cardNumber: cleanNum,
      cardHolder: String(cardHolder).trim(),
      expiryMonth,
      expiryYear,
      cvv: String(cvv).trim(),
    });

    return sendSuccess(res, {
      token: tokenRecord,
      message: 'Card securely tokenized per RBI guidelines (Razorpay CoFT)',
    });
  });

  // DELETE /api/razorpay/tokens/:tokenId
  public static deleteToken = asyncHandler(async (req: Request, res: Response) => {
    const tokenId = Array.isArray(req.params.tokenId) ? req.params.tokenId[0] : (req.params.tokenId || '');
    const customerId = (req.query.customerId as string) || '';
    const phone = (req.query.phone as string) || '';

    if (!tokenId) {
      return sendError(res, 'Token ID required', 400);
    }

    await RazorpayBackendService.deleteCustomerToken(customerId, tokenId, phone);
    return sendSuccess(res, { success: true, message: 'Card token successfully removed' });
  });

  // POST /api/razorpay/one-tap-order
  public static createOneTapOrder = asyncHandler(async (req: Request, res: Response) => {
    const { customerId, tokenId, phone, name, email, notes } = req.body;
    const amountInPaise = parsePaiseAmount(req.body);

    if (amountInPaise < 100) {
      return sendError(res, 'Minimum amount is ₹1.00 (100 paise)', 400);
    }

    if (!tokenId) {
      return sendError(res, 'Saved card token ID is required for one-tap checkout', 400);
    }

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    let activeCustId = customerId;
    if (!activeCustId && cleanPhone) {
      const cust = await RazorpayBackendService.getOrCreateCustomer({
        name: name || 'Customer',
        email: email || `${cleanPhone}@urbanico.in`,
        contact: cleanPhone,
      });
      activeCustId = cust.id;
    }

    const orderResult = await RazorpayBackendService.createOrder({
      amountInPaise,
      currency: 'INR',
      receipt: `1tap_${Date.now().toString().slice(-6)}`,
      notes: {
        ...(notes || {}),
        oneTapPayment: 'true',
        tokenId,
        customerId: activeCustId,
      },
    });

    return sendSuccess(res, {
      order: orderResult,
      order_id: orderResult.order_id || orderResult.id,
      amount: orderResult.amount,
      customerId: activeCustId,
      tokenId,
      key_id: RazorpayBackendService.getKeyId(),
    });
  });
}
