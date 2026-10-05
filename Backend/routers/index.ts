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

// Administrative Purge & Clean Slate API
apiRouter.post('/purge-all-data', async (req, res) => {
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
apiRouter.post('/admin/purge', async (req, res) => {
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
