import { Order, IOrder } from '../models/Order';
import { Delivery, IDelivery } from '../models/Delivery';
import mongoose from 'mongoose';

// In-memory store for instant zero-latency realtime operations & offline/local fallback
const inMemoryOrders: any[] = [];

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

    const generatedOrderNumber = orderData.orderNumber || `URB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const orderPayload = {
      ...orderData,
      orderNumber: generatedOrderNumber,
      subtotal,
      taxAmount: Math.round(taxAmount),
      deliveryCharges,
      unloadingCharges,
      totalAmount: orderData.totalAmount || totalAmount,
      orderStatus: orderData.orderStatus || 'confirmed',
      paymentStatus: orderData.paymentStatus || 'paid',
      eWayBillNo: orderData.eWayBillNo || `EWB-TS-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let savedOrder: any = null;

    try {
      if (mongoose.connection.readyState === 1) {
        const newOrder = new Order(orderPayload);
        savedOrder = await newOrder.save();
      }
    } catch (dbErr) {
      console.warn('MongoDB not available for order creation, persisting to in-memory store:', dbErr);
    }

    if (!savedOrder) {
      savedOrder = {
        _id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...orderPayload,
      };
    }

    // Always maintain in-memory cache
    inMemoryOrders.unshift(savedOrder);

    // Auto-create initial dispatch delivery tracking record
    try {
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const deliveryPayload = {
        deliveryNumber: `DEL-${Date.now().toString().slice(-5)}`,
        orderId: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        vehicleNumber: savedOrder.vehicleNumber || 'TS09-UA-8821 (10-Tyre Tipper)',
        driverName: savedOrder.driverName || 'Ramesh Goud',
        driverPhone: savedOrder.driverPhone || '+91 98480 22341',
        sourceQuarry: {
          name: 'Urbanico Central Crushed Stone & Sand Quarry Hub',
          location: 'Patancheru Outskirts, Hyderabad',
          gatePassNo: `GP-${Math.floor(10000 + Math.random() * 90000)}`,
        },
        destinationSite: {
          name: savedOrder.siteAddress?.siteName || 'Construction Site',
          address: savedOrder.siteAddress?.street || 'Site Location, Hyderabad',
          pincode: savedOrder.siteAddress?.pincode || '500049',
          contactPerson: savedOrder.customerName || 'Site Supervisor',
          contactPhone: savedOrder.customerPhone || '+91 96666 35009',
        },
        currentLocation: {
          latitude: 17.4933,
          longitude: 78.3914,
          speedKmH: 34,
          lastUpdated: new Date(),
        },
        status: 'in_transit' as const,
        otp: otpCode,
        isOtpVerified: false,
        estimatedArrivalTime: new Date(Date.now() + 35 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (mongoose.connection.readyState === 1) {
        const delivery = new Delivery(deliveryPayload);
        await delivery.save();
      }
    } catch (deliveryErr) {
      console.warn('Could not auto-create delivery doc:', deliveryErr);
    }

    return savedOrder;
  }

  public static async getAllOrders(query: { status?: string; search?: string; phone?: string } = {}) {
    try {
      if (mongoose.connection.readyState === 1) {
        const filter: Record<string, any> = {};
        if (query.status && query.status !== 'all') {
          filter.orderStatus = query.status;
        }
        if (query.phone) {
          filter.customerPhone = query.phone;
        }
        if (query.search) {
          filter.$or = [
            { orderNumber: { $regex: query.search, $options: 'i' } },
            { customerName: { $regex: query.search, $options: 'i' } },
            { customerPhone: { $regex: query.search, $options: 'i' } },
          ];
        }
        const dbOrders = await Order.find(filter).sort({ createdAt: -1 }).exec();
        if (dbOrders && dbOrders.length > 0) {
          return dbOrders;
        }
      }
    } catch (err) {
      console.warn('Error reading from MongoDB, returning in-memory orders:', err);
    }

    // Filter in-memory orders
    return inMemoryOrders.filter((o) => {
      if (query.status && query.status !== 'all' && o.orderStatus !== query.status) return false;
      if (query.phone && o.customerPhone && !o.customerPhone.includes(query.phone)) return false;
      if (query.search) {
        const s = query.search.toLowerCase();
        const matchNum = o.orderNumber?.toLowerCase().includes(s);
        const matchCust = o.customerName?.toLowerCase().includes(s);
        const matchPhone = o.customerPhone?.toLowerCase().includes(s);
        if (!matchNum && !matchCust && !matchPhone) return false;
      }
      return true;
    });
  }

  public static async getOrderById(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbOrder = await Order.findById(id).exec();
        if (dbOrder) return dbOrder;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryOrders.find((o) => o._id === id || String(o._id) === id) || null;
  }

  public static async getOrderByOrderNumber(orderNumber: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbOrder = await Order.findOne({ orderNumber }).exec();
        if (dbOrder) return dbOrder;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryOrders.find((o) => o.orderNumber === orderNumber) || null;
  }

  public static async updateOrderStatus(
    id: string,
    status: IOrder['orderStatus'],
    extraFields: Partial<IOrder> = {}
  ) {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbOrder = await Order.findByIdAndUpdate(
          id,
          { $set: { orderStatus: status, ...extraFields, updatedAt: new Date() } },
          { new: true }
        ).exec();
        if (dbOrder) return dbOrder;
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryOrders.findIndex((o) => o._id === id || String(o._id) === id || o.orderNumber === id);
    if (idx !== -1) {
      inMemoryOrders[idx] = {
        ...inMemoryOrders[idx],
        orderStatus: status,
        ...extraFields,
        updatedAt: new Date(),
      };
      return inMemoryOrders[idx];
    }
    return null;
  }

  public static async updatePaymentStatus(
    id: string,
    paymentStatus: IOrder['paymentStatus'],
    paymentDetails: IOrder['paymentDetails']
  ) {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbOrder = await Order.findByIdAndUpdate(
          id,
          {
            $set: {
              paymentStatus,
              paymentDetails,
              orderStatus: paymentStatus === 'paid' ? 'confirmed' : 'received',
              updatedAt: new Date(),
            },
          },
          { new: true }
        ).exec();
        if (dbOrder) return dbOrder;
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryOrders.findIndex((o) => o._id === id || String(o._id) === id || o.orderNumber === id);
    if (idx !== -1) {
      inMemoryOrders[idx] = {
        ...inMemoryOrders[idx],
        paymentStatus,
        paymentDetails,
        orderStatus: paymentStatus === 'paid' ? 'confirmed' : 'received',
        updatedAt: new Date(),
      };
      return inMemoryOrders[idx];
    }
    return null;
  }
}

