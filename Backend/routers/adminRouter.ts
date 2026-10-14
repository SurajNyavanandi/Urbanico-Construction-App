import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken, requireAdminOrSecret } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { asyncHandler, sendSuccess } from '../utils/apiResponse';

const adminRouter = Router();

// Strictly authenticate and authorize all administrative endpoints
adminRouter.use(authenticateToken);
adminRouter.use(requireAdminOrSecret);

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

// 5. Audit Trail
adminRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const action = req.query.action as string;
    const limit = Number(req.query.limit) || 50;
    const page = Number(req.query.page) || 1;
    const data = await AuditService.getLogs({ action, limit, page });
    return sendSuccess(res, data, 'Audit logs retrieved');
  })
);

export { adminRouter };
export default adminRouter;
