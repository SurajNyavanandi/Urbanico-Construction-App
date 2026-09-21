import { Router } from 'express';
import { paymentRouter } from './paymentRouter';
import { orderRouter } from './orderRouter';
import { materialRouter } from './materialRouter';
import { serviceRouter } from './serviceRouter';
import { userRouter } from './userRouter';
import { deliveryRouter } from './deliveryRouter';
import { PaymentController } from '../controllers/paymentController';
import { getDBStatus } from '../config/db';

const apiRouter = Router();

// Modular Sub-routers
apiRouter.use('/razorpay', paymentRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/materials', materialRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/deliveries', deliveryRouter);

// Flat aliases for backwards compatibility with existing frontend calls
apiRouter.get('/razorpay-config', PaymentController.getConfig);
apiRouter.get('/config', PaymentController.getConfig);
apiRouter.post('/create-order', PaymentController.createOrder);
apiRouter.post('/verify-payment', PaymentController.verifyPayment);

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
