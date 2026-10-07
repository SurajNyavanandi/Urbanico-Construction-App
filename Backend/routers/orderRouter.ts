import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticateToken, requireAuth, requireAdminSecret } from '../middleware/auth';

const router = Router();

// Order CRUD & state transitions with optional/required authorization
router.use(authenticateToken);
router.get('/', requireAuth, OrderController.getOrders);
router.post('/', OrderController.createOrder);
router.delete('/', requireAdminSecret, OrderController.deleteAllOrders);
router.post('/email-invoice', OrderController.emailInvoice);
router.get('/:id', requireAuth, OrderController.getOrderById);
router.get('/number/:orderNumber', requireAuth, OrderController.getOrderByOrderNumber);
router.patch('/:id/status', requireAuth, OrderController.updateStatus);

export const orderRouter = router;
