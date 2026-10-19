import { Router } from 'express';
import { MaterialController } from '../controllers/materialController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { adminMutationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Read Operations (Customers, Contractors, Guests)
router.get('/categories', MaterialController.getCategories);
router.get('/bundles', MaterialController.getProjectBundles);
router.get('/', MaterialController.getMaterials);
router.get('/:id', MaterialController.getMaterialById);

// Protected Mutation Operations (Authorized Admin only, RBAC enforced)
router.post('/categories', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.createCategory);
router.put('/categories/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.updateCategory);
router.delete('/categories/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.deleteCategory);

router.post('/bundles', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.createProjectBundle);
router.put('/bundles/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.updateProjectBundle);
router.delete('/bundles/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.deleteProjectBundle);

router.post('/', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.createMaterial);
router.put('/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.updateMaterial);
router.delete('/:id', authenticateToken, requireAdmin, adminMutationRateLimiter, MaterialController.deleteMaterial);

export const materialRouter = router;
export default materialRouter;
