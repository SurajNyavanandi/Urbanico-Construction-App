import { Router } from 'express';
import { MaterialController } from '../controllers/materialController';

const router = Router();

// Material Catalogue & Inventory
router.get('/', MaterialController.getMaterials);
router.get('/:id', MaterialController.getMaterialById);
router.post('/', MaterialController.createMaterial);

export const materialRouter = router;
