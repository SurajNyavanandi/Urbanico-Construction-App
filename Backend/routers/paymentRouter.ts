import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();

// Order creation & payment verification
router.get('/config', PaymentController.getConfig);
router.post('/create-order', PaymentController.createOrder);
router.post('/verify-payment', PaymentController.verifyPayment);
router.all('/callback', PaymentController.handleCallback);
router.get('/checkout-page', PaymentController.renderCheckoutPage);

// Razorpay Tokenization & 1-Tap Payment routes
router.post('/customer', PaymentController.getOrCreateCustomer);
router.get('/tokens', PaymentController.getCustomerTokens);
router.post('/tokenize-card', PaymentController.tokenizeCard);
router.delete('/tokens/:tokenId', PaymentController.deleteToken);
router.post('/one-tap-order', PaymentController.createOneTapOrder);

export const paymentRouter = router;
