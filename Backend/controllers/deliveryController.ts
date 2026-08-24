import { Request, Response } from 'express';
import { DeliveryService } from '../services/deliveryService';

export class DeliveryController {
  public static async getDeliveryByOrder(req: Request, res: Response) {
    try {
      const orderNumber = String(req.params.orderNumber);
      const delivery = await DeliveryService.getDeliveryByOrderNumber(orderNumber);
      if (!delivery) {
        return res.status(404).json({ success: false, error: 'Delivery tracking record not found' });
      }
      return res.status(200).json({ success: true, delivery });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async verifyOtp(req: Request, res: Response) {
    try {
      const orderNumber = String(req.params.orderNumber);
      const { otp } = req.body;
      if (!otp) {
        return res.status(400).json({ success: false, error: 'Delivery confirmation OTP is required' });
      }
      const result = await DeliveryService.verifyDeliveryOtp(orderNumber, otp);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async updateLocation(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { latitude, longitude, speedKmH } = req.body;
      const delivery = await DeliveryService.updateDeliveryLocation(id, {
        latitude: Number(latitude),
        longitude: Number(longitude),
        speedKmH: Number(speedKmH || 0),
      });
      return res.status(200).json({ success: true, delivery });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
