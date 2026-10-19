import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { adminMutationRateLimiter } from '../middleware/rateLimiter';
import {
  validateAdminBody,
  createMaterialSchema,
  updateMaterialSchema,
  createServiceSchema,
  updateServiceSchema,
} from '../validators/adminValidator';
import { AuditService } from '../services/auditService';
import { asyncHandler, sendSuccess } from '../utils/apiResponse';

const adminRouter = Router();

// Strictly authenticate and authorize all administrative endpoints via JWT allowlist
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

// ==========================================
// 1. MATERIALS CRUD
// ==========================================
adminRouter.post(
  '/materials',
  adminMutationRateLimiter,
  validateAdminBody(createMaterialSchema),
  AdminController.createMaterial
);
adminRouter.put(
  '/materials/:id',
  adminMutationRateLimiter,
  validateAdminBody(updateMaterialSchema),
  AdminController.updateMaterial
);
adminRouter.delete('/materials/:id', adminMutationRateLimiter, AdminController.deleteMaterial);

// ==========================================
// 2. SERVICES CRUD
// ==========================================
adminRouter.post(
  '/services',
  adminMutationRateLimiter,
  validateAdminBody(createServiceSchema),
  AdminController.createService
);
adminRouter.put(
  '/services/:id',
  adminMutationRateLimiter,
  validateAdminBody(updateServiceSchema),
  AdminController.updateService
);
adminRouter.delete('/services/:id', adminMutationRateLimiter, AdminController.deleteService);

// ==========================================
// 3. USERS MANAGEMENT
// ==========================================
adminRouter.get('/users', AdminController.getUsers);
adminRouter.put('/users/:id/role', adminMutationRateLimiter, AdminController.updateUserRole);
adminRouter.delete('/users/:id', adminMutationRateLimiter, AdminController.deleteUser);

// ==========================================
// 4. ORDERS MANAGEMENT
// ==========================================
adminRouter.get('/orders', AdminController.getOrders);
adminRouter.put('/orders/:id/status', adminMutationRateLimiter, AdminController.updateOrderStatus);
adminRouter.put('/orders/:id/dispatch', adminMutationRateLimiter, AdminController.updateOrderDispatch);

// ==========================================
// 5. ANALYTICS & METRICS
// ==========================================
adminRouter.get('/metrics', AdminController.getMetrics);

// ==========================================
// 6. AUDIT TRAIL & HISTORY
// ==========================================
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
