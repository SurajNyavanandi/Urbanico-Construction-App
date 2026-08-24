import { Delivery, IDelivery } from '../models/Delivery';

export class DeliveryService {
  public static async getDeliveryByOrderId(orderId: string) {
    return await Delivery.findOne({ orderId }).exec();
  }

  public static async getDeliveryByOrderNumber(orderNumber: string) {
    return await Delivery.findOne({ orderNumber }).exec();
  }

  public static async updateDeliveryLocation(
    id: string,
    location: { latitude: number; longitude: number; speedKmH?: number }
  ) {
    return await Delivery.findByIdAndUpdate(
      id,
      {
        $set: {
          currentLocation: {
            ...location,
            lastUpdated: new Date(),
          },
        },
      },
      { new: true }
    ).exec();
  }

  public static async verifyDeliveryOtp(orderNumber: string, otp: string) {
    const delivery = await Delivery.findOne({ orderNumber }).exec();
    if (!delivery) {
      return { success: false, message: 'Delivery record not found' };
    }
    if (delivery.otp !== otp) {
      return { success: false, message: 'Invalid OTP code. Please enter the 6-digit site confirmation OTP.' };
    }
    delivery.isOtpVerified = true;
    delivery.status = 'delivered';
    await delivery.save();
    return { success: true, message: 'Delivery verified successfully and marked as delivered', delivery };
  }
}
