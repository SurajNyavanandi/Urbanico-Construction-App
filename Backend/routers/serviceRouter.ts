import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';

const router = Router();

router.post('/seed', ServiceController.seedServices);
router.get('/seed', ServiceController.seedServices);

router.get('/', ServiceController.getServices);
router.get('/:id', ServiceController.getServiceById);
router.post('/', ServiceController.createService);
router.put('/:id', ServiceController.updateService);
router.delete('/:id', ServiceController.deleteService);

export const serviceRouter = router;
