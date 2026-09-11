import { Router } from 'express';
import { OrderController } from '../controllers/orderController';

const router = Router();

// Order CRUD & state transitions
router.get('/', OrderController.getOrders);
router.post('/', OrderController.createOrder);
router.post('/email-invoice', OrderController.emailInvoice);
router.get('/:id', OrderController.getOrderById);
router.get('/number/:orderNumber', OrderController.getOrderByOrderNumber);
router.patch('/:id/status', OrderController.updateStatus);

export const orderRouter = router;
