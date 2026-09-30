# Reusable Backend Libraries (`Backend/lib/`)

This directory contains standalone, 100% portable libraries with **zero coupling** to Urbanico or any specific domain. You can copy `Backend/lib/` into any Node.js/TypeScript backend project (Express, Fastify, NestJS, Next.js API, etc.).

---

## 1. Razorpay Toolkit (`Backend/lib/razorpay/index.ts`)

Provides automated mode detection (`LIVE` vs `TEST`), order creation with automatic fallback in sandbox mode, cryptographic HMAC-SHA256 signature verification, payment link generation, and refunds.

### Installation in another project:
```bash
npm install razorpay
npm install -D @types/node
```

### Usage Examples:

```typescript
import {
  razorpayClient,
  createRazorpayClient,
  detectKeyMode,
  verifyRazorpaySignature,
} from './lib/razorpay';

// 1. Check Key Mode
const mode = razorpayClient.getKeyMode(); // 'LIVE' | 'TEST'

// 2. Create Order (automatic sandbox order generation when in test mode)
const order = await razorpayClient.createOrder({
  amountInPaise: 49900, // ₹499.00
  currency: 'INR',
  receipt: 'rcpt_1001',
  notes: { customerId: 'cust_123' },
});

// 3. Cryptographically Verify Signature (HMAC-SHA256)
const verification = razorpayClient.verifySignature({
  order_id: 'order_test_...',
  payment_id: 'pay_test_...',
  signature: 'sig_test_...',
});
if (verification.isValid) {
  console.log('Payment authentic and verified!');
}

// 4. Create Payment Link
const link = await razorpayClient.createPaymentLink({
  amountInPaise: 25000,
  description: 'Pro Subscription',
  userName: 'Rajesh Kumar',
  userPhone: '9848012345',
});

// 5. Process Refund
const refund = await razorpayClient.processRefund({
  paymentId: 'pay_1234567890',
  amountInPaise: 100, // ₹1.00
});
```

---

## 2. Mailer Service (`Backend/lib/mailer/index.ts`)

Provides Nodemailer email delivery supporting standard SMTP, Gmail, SendGrid, and Resend, with **clean dev console preview fallback** when no SMTP credentials are provided (preventing development crashes). Includes a responsive, inline-styled tax invoice HTML email template generator.

### Installation in another project:
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### Usage Examples:

```typescript
import { sendMail, sendInvoiceMail, mailer } from './lib/mailer';

// 1. Send General Email
await sendMail({
  to: 'user@example.com',
  subject: 'Welcome to our platform!',
  text: 'Hi there, thank you for joining us.',
  html: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
});

// 2. Send Beautiful Tax Invoice Email
await sendInvoiceMail({
  to: 'client@company.com',
  customerName: 'Aarav Patel',
  invoiceNumber: 'INV-2026-001',
  amount: 14500,
  currency: 'INR',
  paymentStatus: 'PAID',
  items: [
    { name: 'UltraTech Cement 50kg Bags', quantity: 20, unitPrice: 380, total: 7600, unit: 'bags' },
    { name: 'TMT Steel Fe 550D Rebars', quantity: 100, unitPrice: 69, total: 6900, unit: 'kg' },
  ],
  notes: 'Goods dispatched via express carrier.',
  pdfBuffer: invoicePdfBuffer, // optional PDF attachment
});
```

### Environment Variables:
All SMTP hosts, ports, SSL, and sender defaults are built into the library. You only need:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-google-app-password
```
*(Defaults directly to Gmail service. If credentials are omitted, emails log cleanly to the terminal in development without throwing errors)*
