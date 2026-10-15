import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { authenticateToken, requireAdminOrSecret } from '../middleware/auth';

const router = Router();

// Public Read Operations
router.get('/', ServiceController.getServices);
router.get('/:id', ServiceController.getServiceById);

// Protected Mutation Operations (Authorized Admin only)
router.post('/seed', authenticateToken, requireAdminOrSecret, ServiceController.seedServices);
router.post('/', authenticateToken, requireAdminOrSecret, ServiceController.createService);
router.put('/:id', authenticateToken, requireAdminOrSecret, ServiceController.updateService);
router.delete('/:id', authenticateToken, requireAdminOrSecret, ServiceController.deleteService);

export const serviceRouter = router;
export default serviceRouter;
