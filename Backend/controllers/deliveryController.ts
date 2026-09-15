import { Request, Response } from 'express';
import { DeliveryService } from '../services/deliveryService';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';

export class DeliveryController {
  public static getDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const deliveries = await DeliveryService.getAllDeliveries();
    return sendSuccess(res, { deliveries, count: deliveries.length });
  });

  public static getDeliveryByOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const delivery = await DeliveryService.getDeliveryByOrderNumber(String(orderNumber));
    if (!delivery) {
      return sendError(res, 'Delivery tracking record not found', 404);
    }
    return sendSuccess(res, { delivery });
  });

  public static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { otp } = req.body;
    if (!otp) {
      return sendError(res, 'Delivery confirmation OTP is required', 400);
    }
    const result = await DeliveryService.verifyDeliveryOtp(String(orderNumber), otp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return sendSuccess(res, result);
  });

  public static updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { latitude, longitude, speedKmH } = req.body;
    const delivery = await DeliveryService.updateDeliveryLocation(String(id), {
      latitude: Number(latitude),
      longitude: Number(longitude),
      speedKmH: Number(speedKmH || 0),
    });
    return sendSuccess(res, { delivery });
  });
}

