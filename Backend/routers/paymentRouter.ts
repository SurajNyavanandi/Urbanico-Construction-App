import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();

// Order creation & payment verification
router.post('/create-order', PaymentController.createOrder);
router.post('/verify-payment', PaymentController.verifyPayment);

export const paymentRouter = router;
