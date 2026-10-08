import { Router } from 'express';
import { paymentRouter } from './paymentRouter';
import { orderRouter } from './orderRouter';
import { materialRouter } from './materialRouter';
import { serviceRouter } from './serviceRouter';
import { userRouter } from './userRouter';
import { deliveryRouter } from './deliveryRouter';
import { adminRouter } from './adminRouter';
import { PaymentController } from '../controllers/paymentController';
import { getDBStatus } from '../config/db';
import { requireAdminSecret } from '../middleware/auth';

const apiRouter = Router();

// Modular Sub-routers
apiRouter.use('/razorpay', paymentRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/materials', materialRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/user', userRouter);
apiRouter.use('/deliveries', deliveryRouter);
apiRouter.use('/admin', adminRouter);

// Administrative Purge & Clean Slate API (Protected by requireAdminSecret)
apiRouter.post('/purge-all-data', requireAdminSecret, async (req, res) => {
  try {
    const { UserService } = await import('../services/userService');
    const { OrderService } = await import('../services/orderService');
    const { DeliveryService } = await import('../services/deliveryService');

    await UserService.purgeAllUsers();
    await OrderService.purgeAllOrders();
    await DeliveryService.purgeAllDeliveries();

    return res.json({
      success: true,
      message: 'All user profiles, order histories, and deliveries have been purged cleanly. Ready for real users.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to purge data: ' + (err?.message || err),
    });
  }
});
apiRouter.post('/admin/purge', requireAdminSecret, async (req, res) => {
  const { UserService } = await import('../services/userService');
  const { OrderService } = await import('../services/orderService');
  const { DeliveryService } = await import('../services/deliveryService');

  await UserService.purgeAllUsers();
  await OrderService.purgeAllOrders();
  await DeliveryService.purgeAllDeliveries();

  return res.json({
    success: true,
    message: 'System purged successfully.',
  });
});

// Flat aliases for backwards compatibility with existing frontend calls
apiRouter.get('/razorpay-config', PaymentController.getConfig);
apiRouter.get('/config', PaymentController.getConfig);
apiRouter.post('/create-order', PaymentController.createOrder);
apiRouter.post('/verify-payment', PaymentController.verifyPayment);
apiRouter.post('/penny-drop-verify', PaymentController.pennyDropVerifyAndRefund);
apiRouter.post('/refund', PaymentController.processRefund);
apiRouter.get('/order-status/:order_id', PaymentController.getOrderStatus);
apiRouter.get('/order-status', PaymentController.getOrderStatus);
apiRouter.post('/check-status', PaymentController.getOrderStatus);

// Resend Invoice Dispatch API (/api/send-invoice)
const sendInvoiceHandler = async (req: any, res: any) => {
  try {
    const { sendInvoiceMail } = await import('../lib/mailer');
    const {
      to,
      recipientEmail,
      customerName,
      customerBusinessName,
      customerGstin,
      invoiceNumber,
      amount,
      totalAmount,
      items,
      html,
      notes,
      paymentStatus,
    } = req.body;

    const targetEmail = recipientEmail || (Array.isArray(to) ? to[0] : to);
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const result = await sendInvoiceMail({
      to: targetEmail,
      customerName: customerBusinessName || customerName || 'Valued Client',
      customerGstin,
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      amount: Number(totalAmount || amount || 0),
      items: Array.isArray(items) ? items : [],
      notes,
      paymentStatus: paymentStatus || 'PAID',
    });

    return res.json({
      success: true,
      messageId: result.messageId,
      mode: result.mode,
      trackingId: `TRK-INV-${Date.now().toString().slice(-6)}`,
      message: `Tax Invoice successfully emailed to ${targetEmail}`,
    });
  } catch (err: any) {
    console.error('[API send-invoice error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch invoice: ' + (err?.message || err),
    });
  }
};

apiRouter.post('/send-invoice', sendInvoiceHandler);
apiRouter.post('/email-invoice', sendInvoiceHandler);

// MSG91 OTP API (/api/otp/send & /api/otp/verify)
apiRouter.post('/otp/send', async (req, res) => {
  try {
    const { OtpBackendService } = await import('../services/otpService');
    const { phone } = req.body;
    const result = await OtpBackendService.sendOtp(phone);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err?.message || 'Failed to send OTP',
    });
  }
});

apiRouter.post('/otp/verify', async (req, res) => {
  try {
    const { OtpBackendService } = await import('../services/otpService');
    const { UserService } = await import('../services/userService');
    const { generateAuthToken } = await import('../middleware/auth');
    const { phone, otp } = req.body;
    const result = await OtpBackendService.verifyOtp(phone, otp);

    if (result.verified) {
      const user = await UserService.findOrCreateUser(result.phone);
      const token = generateAuthToken(user);
      return res.json({
        ...result,
        token,
        user,
      });
    }

    return res.status(401).json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      verified: false,
      message: err?.message || 'Verification failed',
    });
  }
});

// Database & Backend System Health check
apiRouter.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'ok',
    service: 'Urbanico Express Backend',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    architecture: {
      framework: 'Express.js',
      orm: 'Mongoose',
      modularSubdirectories: ['controllers', 'services', 'models', 'routers', 'config'],
    },
  });
});

export { apiRouter };
export default apiRouter;
