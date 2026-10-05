import { Router } from 'express';
import { AdminController } from '../controllers/adminController';

const adminRouter = Router();

// 1. Users Management
adminRouter.get('/users', AdminController.getUsers);
adminRouter.put('/users/:id/role', AdminController.updateUserRole);
adminRouter.delete('/users/:id', AdminController.deleteUser);

// 2. Orders Management
adminRouter.get('/orders', AdminController.getOrders);
adminRouter.put('/orders/:id/status', AdminController.updateOrderStatus);
adminRouter.put('/orders/:id/dispatch', AdminController.updateOrderDispatch);

// 3. Materials / Inventory Management
adminRouter.post('/materials', AdminController.createMaterial);
adminRouter.put('/materials/:id', AdminController.updateMaterial);
adminRouter.delete('/materials/:id', AdminController.deleteMaterial);

// 4. Analytics & Metrics
adminRouter.get('/metrics', AdminController.getMetrics);

export { adminRouter };
export default adminRouter;
