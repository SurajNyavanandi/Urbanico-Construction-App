import { Router } from 'express';
import { MaterialController } from '../controllers/materialController';
import { authenticateToken, requireAdminOrSecret } from '../middleware/auth';

const router = Router();

// Public Read Operations
router.get('/categories', MaterialController.getCategories);
router.get('/bundles', MaterialController.getProjectBundles);
router.get('/', MaterialController.getMaterials);
router.get('/:id', MaterialController.getMaterialById);

// Protected Mutation Operations (Authorized Admin / Operations only)
router.post('/categories', authenticateToken, requireAdminOrSecret, MaterialController.createCategory);
router.put('/categories/:id', authenticateToken, requireAdminOrSecret, MaterialController.updateCategory);
router.delete('/categories/:id', authenticateToken, requireAdminOrSecret, MaterialController.deleteCategory);

router.post('/bundles', authenticateToken, requireAdminOrSecret, MaterialController.createProjectBundle);
router.put('/bundles/:id', authenticateToken, requireAdminOrSecret, MaterialController.updateProjectBundle);
router.delete('/bundles/:id', authenticateToken, requireAdminOrSecret, MaterialController.deleteProjectBundle);

router.post('/', authenticateToken, requireAdminOrSecret, MaterialController.createMaterial);
router.put('/:id', authenticateToken, requireAdminOrSecret, MaterialController.updateMaterial);
router.delete('/:id', authenticateToken, requireAdminOrSecret, MaterialController.deleteMaterial);

export const materialRouter = router;
export default materialRouter;
