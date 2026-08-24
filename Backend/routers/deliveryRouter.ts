import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController';

const router = Router();

router.get('/:orderNumber', DeliveryController.getDeliveryByOrder);
router.post('/:orderNumber/verify-otp', DeliveryController.verifyOtp);
router.patch('/:id/location', DeliveryController.updateLocation);

export const deliveryRouter = router;
