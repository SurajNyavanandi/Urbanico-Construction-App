import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { adminMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Read Operations (Customers, Contractors, Guests)
router.get('/', ServiceController.getServices);
router.get('/:id', ServiceController.getServiceById);

// Protected Mutation Operations (Authorized Admin only, RBAC enforced)
router.post('/seed', authenticateToken, requireAdmin, adminMutationRateLimiter, ServiceController.seedServices);
router.post('/', authenticateToken, requireAdmin, adminMutationRateLimiter, ServiceController.createService);
router.put('/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, ServiceController.updateService);
router.delete('/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, ServiceController.deleteService);

export const serviceRouter = router;
export default serviceRouter;
