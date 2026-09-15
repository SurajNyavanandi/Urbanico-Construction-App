import { Router } from 'express';
import { MaterialController } from '../controllers/materialController';

const router = Router();

// Specific sub-routes first before parameterized /:id
router.get('/categories', MaterialController.getCategories);
router.post('/categories', MaterialController.createCategory);
router.put('/categories/:id', MaterialController.updateCategory);
router.delete('/categories/:id', MaterialController.deleteCategory);

router.get('/bundles', MaterialController.getProjectBundles);
router.post('/bundles', MaterialController.createProjectBundle);
router.put('/bundles/:id', MaterialController.updateProjectBundle);
router.delete('/bundles/:id', MaterialController.deleteProjectBundle);

// Material Catalogue & Inventory
router.get('/', MaterialController.getMaterials);
router.get('/:id', MaterialController.getMaterialById);
router.post('/', MaterialController.createMaterial);
router.put('/:id', MaterialController.updateMaterial);
router.delete('/:id', MaterialController.deleteMaterial);

export const materialRouter = router;
