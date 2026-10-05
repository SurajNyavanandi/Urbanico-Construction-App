import { Delivery, IDelivery } from '../models/Delivery';
import mongoose from 'mongoose';

const inMemoryDeliveries: any[] = [];

export class DeliveryService {
  public static async getDeliveryByOrderId(orderId: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbDelivery = await Delivery.findOne({ orderId }).exec();
        if (dbDelivery) return dbDelivery;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryDeliveries.find((d) => d.orderId === orderId || String(d.orderId) === orderId) || null;
  }

  public static async getDeliveryByOrderNumber(orderNumber: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbDelivery = await Delivery.findOne({ orderNumber }).exec();
        if (dbDelivery) return dbDelivery;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryDeliveries.find((d) => d.orderNumber === orderNumber) || null;
  }

  public static async getAllDeliveries() {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbDeliveries = await Delivery.find().sort({ createdAt: -1 }).exec();
        if (dbDeliveries && dbDeliveries.length > 0) return dbDeliveries;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryDeliveries;
  }

  public static async updateDeliveryLocation(
    id: string,
    location: { latitude: number; longitude: number; speedKmH?: number }
  ) {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbDelivery = await Delivery.findByIdAndUpdate(
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
        if (dbDelivery) return dbDelivery;
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryDeliveries.findIndex((d) => d._id === id || String(d._id) === id || d.deliveryNumber === id || d.orderNumber === id);
    if (idx !== -1) {
      inMemoryDeliveries[idx] = {
        ...inMemoryDeliveries[idx],
        currentLocation: {
          ...location,
          lastUpdated: new Date(),
        },
      };
      return inMemoryDeliveries[idx];
    }
    return null;
  }

  public static async registerDelivery(deliveryPayload: any) {
    let saved: any = null;
    try {
      if (mongoose.connection.readyState === 1) {
        const delivery = new Delivery(deliveryPayload);
        saved = await delivery.save();
      }
    } catch (err) {
      console.warn('[DeliveryService] Could not save delivery to MongoDB:', err);
    }

    const memoryItem = saved ? (saved.toObject ? saved.toObject() : saved) : { _id: `del_${Date.now()}`, ...deliveryPayload };
    inMemoryDeliveries.unshift(memoryItem);
    return memoryItem;
  }

  public static async syncDeliveryDispatch(orderNumber: string, updateData: Partial<IDelivery> | any) {
    try {
      if (mongoose.connection.readyState === 1) {
        await Delivery.findOneAndUpdate(
          { orderNumber },
          { $set: { ...updateData, updatedAt: new Date() } },
          { new: true, upsert: false }
        ).exec();
      }
    } catch (err) {
      console.warn('[DeliveryService] Error syncing delivery dispatch:', err);
    }

    const idx = inMemoryDeliveries.findIndex((d) => d.orderNumber === orderNumber);
    if (idx !== -1) {
      inMemoryDeliveries[idx] = {
        ...inMemoryDeliveries[idx],
        ...updateData,
        updatedAt: new Date(),
      };
    }
  }

  public static async verifyDeliveryOtp(orderNumber: string, otp: string) {
    const cleanOtp = String(otp || '').trim();
    const isDevOtp = cleanOtp === '123456';

    let deliveryRecord: any = null;
    let orderRecord: any = null;

    try {
      if (mongoose.connection.readyState === 1) {
        deliveryRecord = await Delivery.findOne({ orderNumber }).exec();
        const OrderModel = mongoose.models.Order;
        if (OrderModel) {
          orderRecord = await OrderModel.findOne({ orderNumber }).exec();
        }
      }
    } catch (err) {
      // fallback
    }

    if (!deliveryRecord) {
      deliveryRecord = inMemoryDeliveries.find((d) => d.orderNumber === orderNumber);
    }

    const validOtps = [
      deliveryRecord?.otp,
      orderRecord?.deliveryOtp,
    ].filter(Boolean);

    const isMatch = isDevOtp || validOtps.includes(cleanOtp);

    if (!isMatch) {
      return {
        success: false,
        message: 'Invalid OTP code. Please enter the valid OTP provided on your order screen, or dev OTP 123456.',
      };
    }

    if (deliveryRecord) {
      deliveryRecord.isOtpVerified = true;
      deliveryRecord.status = 'delivered';
      if (mongoose.connection.readyState === 1 && typeof deliveryRecord.save === 'function') {
        await deliveryRecord.save();
      }
    }

    const memIdx = inMemoryDeliveries.findIndex((d) => d.orderNumber === orderNumber);
    if (memIdx !== -1) {
      inMemoryDeliveries[memIdx].isOtpVerified = true;
      inMemoryDeliveries[memIdx].status = 'delivered';
    }

    try {
      if (mongoose.connection.readyState === 1) {
        const OrderModel = mongoose.models.Order;
        if (OrderModel) {
          await OrderModel.findOneAndUpdate(
            { orderNumber },
            { $set: { orderStatus: 'delivered', deliveryDate: new Date(), updatedAt: new Date() } }
          ).exec();
        }
      }
      const { OrderService } = await import('./orderService');
      await OrderService.updateOrderStatus(orderNumber, 'delivered', {
        deliveryDate: new Date(),
      });
    } catch (err) {}

    return {
      success: true,
      message: 'Delivery verified successfully and marked as delivered',
      delivery: deliveryRecord,
    };
  }

  public static async purgeAllDeliveries() {
    try {
      if (mongoose.connection.readyState === 1) {
        await Delivery.deleteMany({}).exec();
      }
    } catch (err) {
      console.warn('[Delivery] Purge database error:', err);
    }
    inMemoryDeliveries.length = 0;
    return { success: true, message: 'All deliveries wiped completely' };
  }
}

