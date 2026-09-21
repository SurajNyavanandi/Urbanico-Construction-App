import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();

// Order creation & payment verification
router.get('/config', PaymentController.getConfig);
router.post('/create-order', PaymentController.createOrder);
router.post('/verify-payment', PaymentController.verifyPayment);

export const paymentRouter = router;
