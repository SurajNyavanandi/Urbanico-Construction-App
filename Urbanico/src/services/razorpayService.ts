export interface CreateOrderParams {
  amount: number; // in Rupees or Paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  isPaise?: boolean;
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: string;
  id?: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
  key_id?: string;
  order?: any;
  error?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verified?: boolean;
  message?: string;
  error?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  verified_at?: string;
}

export interface RazorpayCheckoutOptions {
  amount: number; // in Rupees
  orderDescription?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  precreatedOrderId?: string;
  preferredMethod?: 'upi' | 'card' | 'netbanking' | 'wallet';
  onSuccess: (paymentResult: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    amount: number;
    method?: string;
  }) => void;
  onFailure?: (error: string) => void;
  onDismiss?: () => void;
}

// 1. Ensure Razorpay Script is injected into window
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }
    if ((window as any).Razorpay) {
      return resolve(true);
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// 2. Call backend /api/create-order
export async function createRazorpayOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  const amountInPaise = params.isPaise ? Math.round(params.amount) : Math.round(params.amount * 100);

  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt || `rcpt_${Date.now()}`,
        notes: params.notes || { app: 'Urbanico Construction App' },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create Razorpay order');
    }

    return {
      success: true,
      order_id: data.order_id || data.id,
      id: data.order_id || data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      status: data.status,
      key_id: data.key_id,
      order: data.order,
    };
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    throw err;
  }
}

// 3. Call backend /api/verify-payment
export async function verifyRazorpayPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        verified: false,
        error: data.error || data.message || 'Payment signature verification failed',
      };
    }

    return {
      success: true,
      verified: true,
      message: data.message,
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      verified_at: data.verified_at,
    };
  } catch (err: any) {
    console.error('Error verifying Razorpay payment:', err);
    return {
      success: false,
      verified: false,
      error: err.message || 'Network error verifying payment',
    };
  }
}

// 4. Open Standard Razorpay Web Checkout Modal
export async function openRazorpayStandardCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || typeof (window as any).Razorpay === 'undefined') {
    if (options.onFailure) {
      options.onFailure('Razorpay Checkout SDK failed to load. Please check your internet connection.');
    }
    return;
  }

  try {
    // 1. Create order or use precreated
    let orderId = options.precreatedOrderId;
    let orderAmountPaise = Math.round(options.amount * 100);

    let orderKeyId = '';

    if (!orderId) {
      const orderRes = await createRazorpayOrder({
        amount: options.amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });
      orderId = orderRes.order_id;
      if (orderRes.amount) {
        orderAmountPaise = orderRes.amount;
      }
      if (orderRes.key_id) {
        orderKeyId = orderRes.key_id;
      }
    }

    const keyId =
      orderKeyId ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RAZORPAY_KEY_ID) ||
      (typeof process !== 'undefined' &&
        process.env &&
        (process.env.VITE_RAZORPAY_KEY_ID ||
          process.env.RAZORPAY_KEY_ID ||
          process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID)) ||
      '';

    if (!keyId) {
      const msg = 'Razorpay Key ID is not configured. Please define RAZORPAY_KEY_ID or VITE_RAZORPAY_KEY_ID in the environment settings.';
      console.error(msg);
      if (options.onFailure) {
        options.onFailure(msg);
      }
      return;
    }

    const rzpOptions: any = {
      key: keyId,
      amount: orderAmountPaise,
      currency: 'INR',
      name: 'Urbanico Construction App',
      description: options.orderDescription || 'Building Materials & Quarry Dispatch',
      image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786515724/Gemini_Generated_Image_h44ohmh44ohmh44o_jsrc6g.png',
      order_id: orderId,
      prefill: {
        name: options.userName || 'Rajesh Kumar',
        email: options.userEmail || 'rajesh.m@urbanico.in',
        contact: options.userPhone || '9876543210',
      },
      notes: {
        site: 'Miyapur Site, Phase 2, Hyderabad',
        app: 'Urbanico Direct',
      },
      theme: {
        color: '#111111',
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        // Automatically verify signature with server
        try {
          const verifyResult = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResult.success) {
            options.onSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: options.amount,
              method: 'RAZORPAY_STANDARD',
            });
          } else {
            if (options.onFailure) {
              options.onFailure(verifyResult.error || 'Payment signature verification failed.');
            }
          }
        } catch (err: any) {
          if (options.onFailure) {
            options.onFailure(err.message || 'Error communicating with verification endpoint.');
          }
        }
      },
      modal: {
        ondismiss: function () {
          if (options.onDismiss) {
            options.onDismiss();
          }
        },
      },
    };

    const razorpayInstance = new (window as any).Razorpay(rzpOptions);

    razorpayInstance.on('payment.failed', function (failureResponse: any) {
      console.error('Razorpay Payment Failed Event:', failureResponse);
      const errMsg = failureResponse.error?.description || failureResponse.error?.reason || 'Transaction declined or failed';
      if (options.onFailure) {
        options.onFailure(errMsg);
      }
    });

    razorpayInstance.open();
  } catch (error: any) {
    console.error('Failed to open Razorpay Checkout:', error);
    if (options.onFailure) {
      options.onFailure(error.message || 'Could not initialize payment session');
    }
  }
}
