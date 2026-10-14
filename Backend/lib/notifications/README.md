# Reusable Notification Library (`Backend/lib/notifications`)

A lightweight, zero-coupling, standalone Notification Library for Node.js and TypeScript backends.

## Key Features

1. **Multi-Channel Delivery (100% Free)**:
   - **In-App Real-Time Events**: In-memory pub/sub EventEmitter for Server-Sent Events (SSE) and WebSockets.
   - **Email Notifications**: Seamless integration with `Backend/lib/mailer` using Resend (`RESEND_API_KEY` & `RESEND_FROM_EMAIL`).
   - **Web Push (VAPID)**: Standard browser push notification payload formatting with no external subscriptions.
   - **Terminal / Console Fallback**: Clean visual previews for local development and testing.

2. **Pre-Built Construction Lifecycle Templates**:
   - `sendOrderConfirmed()`: Order placement & booking confirmation.
   - `sendTruckDispatched()`: Live consignment dispatch alert with driver & vehicle numbers.
   - `sendGateOtpAlert()`: Gate handover OTP (`261125`) alert on truck arrival.
   - `sendOrderDelivered()`: Material delivery sign-off & invoice access.
   - `sendPaymentUpdate()`: Payment authorization or balance update.

3. **In-Memory History & Read Receipts**:
   - `getHistory({ recipientPhone, unreadOnly, category })`
   - `getUnreadCount(recipientId)`
   - `markAsRead(notificationId)`
   - `markAllAsRead(recipientId)`
   - `subscribe(recipientId, callback)`

---

## Installation in Future Projects

Copy the `Backend/lib/notifications/` folder into your project:

```bash
cp -r Backend/lib/notifications /path/to/your/project/src/lib/
```

### Dependencies:
Only standard Node.js built-in modules (`events`, `crypto`) are required.

---

## Quick Start Examples

### 1. Basic Usage:

```typescript
import { notificationManager } from './lib/notifications';

// Send a custom notification
await notificationManager.sendNotification({
  recipientPhone: '9848012345',
  recipientEmail: 'client@example.com',
  title: 'Order Confirmed',
  message: 'Your construction materials order #URB-892104 has been booked.',
  category: 'order',
  channels: ['in_app', 'email', 'console'],
});
```

### 2. Construction Lifecycle Alert:

```typescript
// 1. Alert when truck is dispatched
await notificationManager.sendTruckDispatched({
  orderNumber: 'URB-892104',
  vehicleNumber: 'TS 09 UB 5120',
  driverName: 'Ramesh Kumar',
  destinationSite: 'Financial District Site B',
  recipientPhone: '9848012345',
  recipientEmail: 'site.supervisor@example.com',
});

// 2. Alert with Gate OTP on arrival
await notificationManager.sendGateOtpAlert({
  orderNumber: 'URB-892104',
  otpCode: '261125',
  vehicleNumber: 'TS 09 UB 5120',
  driverName: 'Ramesh Kumar',
  recipientPhone: '9848012345',
});
```

### 3. Real-Time Server-Sent Events (SSE) Route in Express:

```typescript
import express from 'express';
import { notificationManager } from './lib/notifications';

const router = express.Router();

router.get('/api/notifications/stream', (req, res) => {
  const phone = req.query.phone as string;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const unsubscribe = notificationManager.subscribe(phone, (notification) => {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});
```
