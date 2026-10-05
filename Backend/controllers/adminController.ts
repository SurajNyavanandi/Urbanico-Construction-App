import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { OrderService } from '../services/orderService';
import { MaterialService } from '../services/materialService';
import { DeliveryService } from '../services/deliveryService';
import { generateRandomOtp } from '../utils/otpHelper';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Material } from '../models/Material';
import mongoose from 'mongoose';

export class AdminController {
  // ==========================================
  // 1. USER MANAGEMENT
  // ==========================================
  public static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { role, search } = req.query;
    const filter: Record<string, any> = {};

    if (role && role !== 'all') {
      filter.role = role;
    }
    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await UserService.getAllUsers(filter);
    return sendSuccess(res, {
      total: users.length,
      users,
    });
  });

  public static updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { role } = req.body;

    if (!role) {
      return sendError(res, 'Role is required (contractor, engineer, supervisor, client, user, admin)', 400);
    }

    const validRoles = ['contractor', 'engineer', 'supervisor', 'client', 'user', 'admin'];
    if (!validRoles.includes(role)) {
      return sendError(res, `Invalid role. Allowed values: ${validRoles.join(', ')}`, 400);
    }

    const updatedUser = await UserService.updateUser(id, { role: role as any });
    if (!updatedUser) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      message: `User role updated successfully to ${role}`,
      user: updatedUser,
    });
  });

  public static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const deleted = await UserService.deleteUser(id);
    if (!deleted) {
      return sendError(res, 'User not found or already deleted', 404);
    }
    return sendSuccess(res, {
      message: 'User removed successfully from database',
      deleted,
    });
  });

  // ==========================================
  // 2. ORDER MANAGEMENT
  // ==========================================
  public static getOrders = asyncHandler(async (req: Request, res: Response) => {
    const { status, search, phone } = req.query;
    const orders = await OrderService.getAllOrders({
      status: status as string,
      search: search as string,
      phone: phone as string,
    });

    return sendSuccess(res, {
      total: orders.length,
      orders,
    });
  });

  public static updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { status, notes, eWayBillNo } = req.body;

    if (!status) {
      return sendError(res, 'Order status is required', 400);
    }

    const validStatuses = ['received', 'confirmed', 'processing', 'dispatched', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Allowed values: ${validStatuses.join(', ')}`, 400);
    }

    const extraFields: Record<string, any> = {};
    if (notes) extraFields.notes = notes;
    if (eWayBillNo) extraFields.eWayBillNo = eWayBillNo;
    if (status === 'delivered') extraFields.deliveryDate = new Date();

    const updatedOrder = await OrderService.updateOrderStatus(id, status, extraFields);
    if (!updatedOrder) {
      return sendError(res, 'Order not found', 404);
    }

    return sendSuccess(res, {
      message: `Order #${updatedOrder.orderNumber} status changed to ${status}`,
      order: updatedOrder,
    });
  });

  public static updateOrderDispatch = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { vehicleNumber, driverName, driverPhone, estimatedArrival, deliveryOtp } = req.body;

    const currentOrder: any = await OrderService.getOrderById(id);
    const resolvedOtp = deliveryOtp || currentOrder?.deliveryOtp || generateRandomOtp();

    const extraFields: Record<string, any> = {
      deliveryOtp: resolvedOtp,
    };
    if (vehicleNumber) extraFields.vehicleNumber = vehicleNumber;
    if (driverName) extraFields.driverName = driverName;
    if (driverPhone) extraFields.driverPhone = driverPhone;
    if (estimatedArrival) extraFields.estimatedArrival = estimatedArrival;

    const updatedOrder: any = await OrderService.updateOrderStatus(id, 'in_transit', extraFields);
    if (!updatedOrder) {
      return sendError(res, 'Order not found', 404);
    }

    // Sync with Delivery tracking record for Driver app and customer tracking
    await DeliveryService.syncDeliveryDispatch(updatedOrder.orderNumber, {
      vehicleNumber: updatedOrder.vehicleNumber,
      driverName: updatedOrder.driverName,
      driverPhone: updatedOrder.driverPhone,
      otp: resolvedOtp,
      status: 'in_transit',
    });

    return sendSuccess(res, {
      message: `Consignment #${updatedOrder.orderNumber} dispatch fleet details updated`,
      order: updatedOrder,
    });
  });

  // ==========================================
  // 3. INVENTORY & MATERIAL MANAGEMENT
  // ==========================================
  public static createMaterial = asyncHandler(async (req: Request, res: Response) => {
    const { name, category, categoryId, defaultPrice, unit, stockQuantity } = req.body;

    if (!name || (!defaultPrice && defaultPrice !== 0)) {
      return sendError(res, 'Material name and defaultPrice are required', 400);
    }

    const newMaterial = await MaterialService.createMaterial({
      name,
      category: category || 'Materials',
      categoryId: categoryId || (category || 'materials').toLowerCase(),
      defaultPrice: Number(defaultPrice),
      basePrice: Number(defaultPrice),
      unit: unit || 'Unit',
      stockQuantity: stockQuantity ? Number(stockQuantity) : 1000,
      inStock: true,
      ...req.body,
    });

    return sendSuccess(
      res,
      {
        message: 'New construction material added to catalog',
        material: newMaterial,
      },
      undefined,
      201
    );
  });

  public static updateMaterial = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const updated = await MaterialService.updateMaterial(id, req.body);
    if (!updated) {
      return sendError(res, 'Material not found', 404);
    }

    return sendSuccess(res, {
      message: 'Material updated successfully in catalog',
      material: updated,
    });
  });

  public static deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const deleted = await MaterialService.deleteMaterial(id);
    if (!deleted) {
      return sendError(res, 'Material not found or already deleted', 404);
    }

    return sendSuccess(res, {
      message: 'Material removed from catalog',
      deleted,
    });
  });

  // ==========================================
  // 4. METRICS & ANALYTICS DASHBOARD
  // ==========================================
  public static getMetrics = asyncHandler(async (req: Request, res: Response) => {
    let totalUsers = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    let activeShipments = 0;
    let deliveredOrders = 0;
    let totalMaterials = 0;

    try {
      if (mongoose.connection.readyState === 1) {
        totalUsers = await User.countDocuments();
        totalOrders = await Order.countDocuments();
        totalMaterials = await Material.countDocuments();

        const revenueAgg = await Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        totalRevenue = revenueAgg[0]?.total || 0;

        activeShipments = await Order.countDocuments({
          orderStatus: { $in: ['processing', 'dispatched', 'in_transit'] },
        });

        deliveredOrders = await Order.countDocuments({
          orderStatus: 'delivered',
        });
      }
    } catch (err) {
      console.warn('[Admin] Metrics DB fallback:', err);
    }

    // If DB has 0 or is offline, calculate from service caches
    if (totalOrders === 0) {
      const orders = await OrderService.getAllOrders();
      totalOrders = orders.length;
      totalRevenue = orders.reduce((acc: number, curr: any) => acc + (Number(curr.totalAmount) || 0), 0);
      activeShipments = orders.filter((o: any) => ['processing', 'dispatched', 'in_transit'].includes(o.orderStatus)).length;
      deliveredOrders = orders.filter((o: any) => o.orderStatus === 'delivered').length;
      totalUsers = (await UserService.getAllUsers()).length;
      totalMaterials = (await MaterialService.getAllMaterials()).length;
    }

    return sendSuccess(res, {
      metrics: {
        totalRevenue,
        totalOrders,
        activeShipments,
        deliveredOrders,
        totalUsers,
        totalMaterials,
        currency: 'INR',
        formattedRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
        systemStatus: 'healthy',
        databaseConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString(),
      },
    });
  });
}
