import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController';
import { authenticateToken, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Fleet tracking routes with authentication and role-based access control
router.use(authenticateToken);
router.get('/', requireAuth, DeliveryController.getDeliveries);
router.get('/:orderNumber', DeliveryController.getDeliveryByOrder);
router.post('/:orderNumber/verify-otp', requireAuth, DeliveryController.verifyOtp);
router.patch('/:id/location', requireAuth, requireRole(['driver', 'admin', 'supervisor']), DeliveryController.updateLocation);

export const deliveryRouter = router;

