import { Order, IOrder } from '../models/Order';
import { Delivery } from '../models/Delivery';

export class OrderService {
  public static async createOrder(orderData: Partial<IOrder>) {
    // 1. Calculate financial sums
    const items = orderData.items || [];
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      item.totalPrice = itemTotal;
      const gst = itemTotal * (item.gstAmount || 0.18);
      taxAmount += gst;
      subtotal += itemTotal;
    });

    const deliveryCharges = orderData.deliveryCharges ?? (subtotal > 50000 ? 0 : 2500);
    const unloadingCharges = orderData.unloadingCharges ?? 800;
    const totalAmount = Math.round(subtotal + taxAmount + deliveryCharges + unloadingCharges);

    const newOrder = new Order({
      ...orderData,
      subtotal,
      taxAmount: Math.round(taxAmount),
      deliveryCharges,
      unloadingCharges,
      totalAmount,
      orderStatus: orderData.orderStatus || 'received',
      paymentStatus: orderData.paymentStatus || 'pending',
    });

    const savedOrder = await newOrder.save();

    // Auto-create initial dispatch delivery tracking record
    try {
      const delivery = new Delivery({
        orderId: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        vehicleNumber: savedOrder.vehicleNumber || 'TS09-UA-8821 (10-Tyre Tipper)',
        driverName: savedOrder.driverName || 'Venkatesh Rao',
        driverPhone: savedOrder.driverPhone || '+91 94401 23456',
        destinationSite: {
          name: savedOrder.siteAddress?.siteName || 'Construction Site',
          address: savedOrder.siteAddress?.street || 'Site Location',
          pincode: savedOrder.siteAddress?.pincode || '500049',
          contactPerson: savedOrder.customerName,
          contactPhone: savedOrder.customerPhone,
        },
        currentLocation: {
          latitude: 17.4933,
          longitude: 78.3914,
          speedKmH: 0,
          lastUpdated: new Date(),
        },
        status: 'loading',
      });
      await delivery.save();
    } catch (deliveryErr) {
      console.warn('Could not auto-create delivery doc:', deliveryErr);
    }

    return savedOrder;
  }

  public static async getAllOrders(query: { status?: string; search?: string } = {}) {
    const filter: Record<string, any> = {};
    if (query.status && query.status !== 'all') {
      filter.orderStatus = query.status;
    }
    if (query.search) {
      filter.$or = [
        { orderNumber: { $regex: query.search, $options: 'i' } },
        { customerName: { $regex: query.search, $options: 'i' } },
        { customerPhone: { $regex: query.search, $options: 'i' } },
      ];
    }
    return await Order.find(filter).sort({ createdAt: -1 }).exec();
  }

  public static async getOrderById(id: string) {
    return await Order.findById(id).exec();
  }

  public static async getOrderByOrderNumber(orderNumber: string) {
    return await Order.findOne({ orderNumber }).exec();
  }

  public static async updateOrderStatus(
    id: string,
    status: IOrder['orderStatus'],
    extraFields: Partial<IOrder> = {}
  ) {
    return await Order.findByIdAndUpdate(
      id,
      { $set: { orderStatus: status, ...extraFields } },
      { new: true }
    ).exec();
  }

  public static async updatePaymentStatus(
    id: string,
    paymentStatus: IOrder['paymentStatus'],
    paymentDetails: IOrder['paymentDetails']
  ) {
    return await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          paymentStatus,
          paymentDetails,
          orderStatus: paymentStatus === 'paid' ? 'confirmed' : 'received',
        },
      },
      { new: true }
    ).exec();
  }
}
