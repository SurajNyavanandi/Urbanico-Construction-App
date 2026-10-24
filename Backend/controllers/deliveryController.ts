import { Request, Response } from 'express';
import { DeliveryService } from '../services/deliveryService';
import { asyncHandler, sendSuccess, sendError, parsePagination } from '../utils/apiResponse';
import { sanitizePhone } from '../utils/sanitizer';

export class DeliveryController {
  public static getDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const { limit, page } = parsePagination(req.query);

    const result = await DeliveryService.getAllDeliveries({ limit, page });

    // Standard users only see deliveries corresponding to their registered phone number
    if (authUser && authUser.role !== 'admin' && authUser.role !== 'supervisor' && authUser.role !== 'driver') {
      const userPhoneDigits = sanitizePhone(authUser.phone);
      const filtered = result.deliveries.filter((d: any) => {
        const custDigits = sanitizePhone(d.customerPhone || d.siteSupervisorPhone);
        return custDigits && custDigits === userPhoneDigits;
      });
      return sendSuccess(res, {
        deliveries: filtered,
        total: filtered.length,
        count: filtered.length,
        limit,
        page,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      });
    }

    return sendSuccess(res, {
      deliveries: result.deliveries,
      total: result.total,
      count: result.deliveries.length,
      limit,
      page,
      totalPages: result.totalPages,
    });
  });

  public static getDeliveryByOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const authUser = (req as any).user;
    const delivery = await DeliveryService.getDeliveryByOrderNumber(String(orderNumber));
    if (!delivery) {
      return sendError(res, 'Delivery tracking record not found', 404);
    }

    if (authUser && authUser.role !== 'admin' && authUser.role !== 'supervisor' && authUser.role !== 'driver') {
      const userPhoneDigits = sanitizePhone(authUser.phone);
      const custDigits = sanitizePhone((delivery as any).customerPhone || (delivery as any).siteSupervisorPhone);
      if (userPhoneDigits && custDigits && userPhoneDigits !== custDigits) {
        return sendError(res, 'Access denied: You are not authorized to track this consignment.', 403);
      }
    }

    return sendSuccess(res, { delivery });
  });

  public static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { otp } = req.body;
    if (!otp) {
      return sendError(res, 'Delivery confirmation OTP is required', 400);
    }
    const result = await DeliveryService.verifyDeliveryOtp(String(orderNumber), String(otp).trim());
    if (!result.success) {
      return sendError(res, result.message || 'OTP verification failed', 400, result);
    }
    return sendSuccess(res, result, result.message || 'Delivery OTP verified successfully');
  });

  public static updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { latitude, longitude, speedKmH } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return sendError(
        res,
        'Valid coordinates (latitude between -90 and 90, longitude between -180 and 180) are required',
        400
      );
    }

    const delivery = await DeliveryService.updateDeliveryLocation(String(id), {
      latitude: lat,
      longitude: lng,
      speedKmH: Math.max(0, Number(speedKmH || 0)),
    });
    if (!delivery) {
      return sendError(res, 'Delivery record not found', 404);
    }
    return sendSuccess(res, { delivery }, 'Delivery vehicle GPS location updated');
  });
}
