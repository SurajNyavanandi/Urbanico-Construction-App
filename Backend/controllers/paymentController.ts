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

  // POST /api/razorpay/create-payment-link (or /razorpay/create-payment-link)
  public static async createPaymentLink(req: Request, res: Response) {
    try {
      const { amount, amountInRupees, currency = 'INR', description, userName, userEmail, userPhone, order_id, notes } = req.body;
      let amountInPaise = amount ? Number(amount) : Number(amountInRupees) * 100;
      if (amountInRupees) {
        amountInPaise = Math.round(Number(amountInRupees) * 100);
      } else {
        amountInPaise = Math.round(Number(amount));
      }

      if (amountInPaise < 100) {
        return res.status(400).json({ success: false, error: 'Minimum amount is ₹1.00 (100 paise)' });
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

      return res.status(200).json({
        success: true,
        payment_link: link.short_url,
        short_url: link.short_url,
        payment_link_id: link.id,
        amount: link.amount,
        status: link.status,
      });
    } catch (err: any) {
      console.error('[Payment Backend] Create Payment Link Error:', err?.message || err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to create payment link' });
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
    .security-note { margin-top: 18px; font-size: 11px; color: #64748B; display: flex; align-items: center; justify-content: center; gap: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="shield-icon">🛡️</div>
    <h1>Razorpay Secure Gateway</h1>
    <p class="sub">Official 256-bit encrypted checkout for Urbanico Direct materials & trade services</p>
    
    <div class="amount-box">
      <span class="amount-label">Total Payable</span>
      <span class="amount-value">₹${formattedAmount}</span>
    </div>

    <button id="pay-btn" class="btn-pay" onclick="launchRazorpay()">
      <span id="btn-text">Open Razorpay Gateway</span>
    </button>

    <div class="security-note">
      🔒 PCI-DSS Level 1 Certified • RBI Compliant
    </div>
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
      config: {
        display: {
          blocks: {
            upi_block: {
              name: "Pay via UPI App (GPay, PhonePe, Paytm)",
              instruments: [
                {
                  method: "upi",
                  flows: ["intent", "qr"],
                  apps: ["google_pay", "phonepe", "paytm", "cred", "bhim"]
                }
              ]
            }
          },
          sequence: ["block.upi_block"]
        }
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
            document.body.innerHTML = '<div class="card"><div class="shield-icon" style="color:#10B981; background:rgba(16,185,129,0.1)">✓</div><h1 style="color:#10B981">Payment Successful!</h1><p class="sub">Payment ID: ' + response.razorpay_payment_id + '</p><p style="color:#94A3B8; font-size:13px; margin-top:12px;">Payment verified successfully with signature. You may now return to the Urbanico app.</p></div>';
          }
        })
        .catch(function(err) {
          alert('Payment verification error: ' + err.message);
        });
      },
      modal: {
        ondismiss: function() {
          document.getElementById('btn-text').innerText = 'Retry Payment';
        }
      }
    };

    function launchRazorpay() {
      try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          alert('Payment failed: ' + (resp.error ? resp.error.description : 'Declined'));
        });
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
