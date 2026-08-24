import Razorpay from 'razorpay';
import crypto from 'crypto';

export class RazorpayBackendService {
  private static getKeyId(): string {
    return (
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      'rzp_test_TTVQamdDG0CpiN'
    );
  }

  private static getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET || 'ARw9MNW4uyOBGv9Xfs6w5rJu';
  }

  public static getClient(): Razorpay {
    const key_id = this.getKeyId();
    const key_secret = this.getKeySecret();
    return new Razorpay({ key_id, key_secret });
  }

  public static async createOrder(options: {
    amountInPaise: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }) {
    const key_id = this.getKeyId();
    const razorpay = this.getClient();

    const orderPayload = {
      amount: options.amountInPaise,
      currency: (options.currency || 'INR').toUpperCase(),
      receipt: (options.receipt || `rcpt_${Date.now()}`).slice(0, 40),
      notes: {
        app: 'Urbanico Construction App',
        ...options.notes,
      },
    };

    const order = await razorpay.orders.create(orderPayload);
    return {
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      key_id,
      order,
    };
  }

  public static verifySignature(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): { isValid: boolean; expectedSignature: string } {
    const keySecret = this.getKeySecret();
    const payload = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    return {
      isValid: expectedSignature === params.razorpay_signature,
      expectedSignature,
    };
  }
}
