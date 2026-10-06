import { Order, IOrder } from '../models/Order';
import { Delivery, IDelivery } from '../models/Delivery';
import { DeliveryService } from './deliveryService';
import { generateRandomOtp } from '../utils/otpHelper';
import mongoose from 'mongoose';

// In-memory store for instant zero-latency realtime operations & offline/local fallback
const inMemoryOrders: any[] = [
  {
    _id: 'ord_sample_101',
    orderNumber: 'URB-892104-712',
    customerName: 'Commercial Site Supervisor',
    customerPhone: '9848012345',
    customerEmail: 'site.procurement@urbanico.in',
    gstin: '36AAACU9821M1Z5',
    siteAddress: {
      siteName: 'Urbanico High-Rise Tower Site B',
      street: 'Plot 42, Financial District, Nanakramguda',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500032',
      coordinates: { lat: 17.4156, lng: 78.3489 },
    },
    items: [
      {
        name: 'UltraTech Super Cement (53 Grade OPC)',
        category: 'cement',
        quantity: 50,
        unit: '50kg Bag',
        unitPrice: 385,
        totalPrice: 19250,
        gstAmount: 0.18,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
      },
      {
        name: 'Tata Tiscon Fe550D TMT Steel Rebars (12mm)',
        category: 'iron_bars',
        quantity: 500,
        unit: 'kg',
        unitPrice: 68,
        totalPrice: 34000,
        gstAmount: 0.18,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
      },
    ],
    subtotal: 53250,
    taxAmount: 9585,
    deliveryCharges: 0,
    unloadingCharges: 800,
    totalAmount: 63635,
    paymentStatus: 'paid',
    paymentMethod: 'UPI / NetBanking',
    orderStatus: 'in_transit',
    eWayBillNo: 'EWB-TS-2026-88192301',
    vehicleNumber: 'TS 09 UB 5120',
    driverName: 'Ramesh Kumar (Fleet Dispatch)',
    driverPhone: '+91 98490 55120',
    deliveryOtp: '749182',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(),
  },
  {
    _id: 'ord_sample_102',
    orderNumber: 'URB-764319-481',
    customerName: 'Kavitha Infra Projects',
    customerPhone: '9848012345',
    customerEmail: 'procure@kavithainfra.com',
    gstin: '36AABCK7812L1ZX',
    siteAddress: {
      siteName: 'Villa Enclave Project - Block C',
      street: 'Sy No. 120, Kokapet SEZ Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500075',
    },
    items: [
      {
        name: 'Robo Sand Triple Washed Plastering M-Sand',
        category: 'sand',
        quantity: 3,
        unit: 'Brass / Unit',
        unitPrice: 8500,
        totalPrice: 25500,
        gstAmount: 0.05,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/sand2_wj9sly.jpg',
      },
      {
        name: 'Kiln Fired High-Strength Red Clay Bricks',
        category: 'bricks',
        quantity: 2500,
        unit: 'Pieces',
        unitPrice: 9.5,
        totalPrice: 23750,
        gstAmount: 0.12,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614403/brick2_gjzbjh.jpg',
      },
    ],
    subtotal: 49250,
    taxAmount: 4125,
    deliveryCharges: 1500,
    unloadingCharges: 1200,
    totalAmount: 56075,
    paymentStatus: 'paid',
    paymentMethod: 'Razorpay Corporate Netbanking',
    orderStatus: 'delivered',
    eWayBillNo: 'EWB-TS-2026-44781290',
    vehicleNumber: 'TS 08 UB 3891',
    driverName: 'Suresh Varma',
    driverPhone: '+91 97001 88391',
    deliveryOtp: '392815',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
  },
  {
    _id: 'ord_sample_103',
    orderNumber: 'URB-631024-915',
    customerName: 'Sri Sai Constructions',
    customerPhone: '9848012345',
    siteAddress: {
      siteName: 'G+4 Commercial Complex',
      street: 'Near Metro Station, Miyapur Main Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500049',
    },
    items: [
      {
        name: 'ACC Gold Water Shield Cement (PPC)',
        category: 'cement',
        quantity: 30,
        unit: '50kg Bag',
        unitPrice: 395,
        totalPrice: 11850,
        gstAmount: 0.18,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
      },
      {
        name: '20mm Blue Metal Granite Stone Aggregates',
        category: 'stone',
        quantity: 2,
        unit: 'Brass / Unit',
        unitPrice: 6200,
        totalPrice: 12400,
        gstAmount: 0.05,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/stones2_i0cjzq.jpg',
      },
    ],
    subtotal: 24250,
    taxAmount: 2753,
    deliveryCharges: 1800,
    unloadingCharges: 600,
    totalAmount: 29403,
    paymentStatus: 'paid',
    paymentMethod: 'UPI Direct (GPay)',
    orderStatus: 'delivered',
    eWayBillNo: 'EWB-TS-2026-31890241',
    vehicleNumber: 'TS 09 UB 7104',
    driverName: 'Mallesh Yadav',
    driverPhone: '+91 94401 22910',
    deliveryOtp: '841029',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

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
      deliveryOtp: orderData.deliveryOtp && orderData.deliveryOtp !== '123456' ? orderData.deliveryOtp : generateRandomOtp(),
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
      const otpCode = savedOrder.deliveryOtp || generateRandomOtp();
      const isServiceOrder = savedOrder.items?.every(
        (i: any) =>
          (i.category || '').toLowerCase().includes('service') ||
          (i.name || '').toLowerCase().includes('visit') ||
          (i.name || '').toLowerCase().includes('consult')
      );
      const totalQuantity = savedOrder.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1;
      const hasBulkMaterials = savedOrder.items?.some(
        (i: any) =>
          (i.name || '').toLowerCase().includes('sand') ||
          (i.name || '').toLowerCase().includes('aggregate') ||
          (i.name || '').toLowerCase().includes('gravel') ||
          (i.name || '').toLowerCase().includes('ton')
      );

      const dynamicVehicleNumber = savedOrder.vehicleNumber || (
        isServiceOrder
          ? 'Trade Inspection Vehicle'
          : (!hasBulkMaterials && totalQuantity <= 3)
          ? `TS 09 UB ${Math.floor(1000 + Math.random() * 9000)} (Cargo Tempo)`
          : `TS 08 UB ${Math.floor(1000 + Math.random() * 9000)} (Commercial Fleet)`
      );

      const dynamicDriverName = savedOrder.driverName || (
        isServiceOrder ? 'Assigned Field Specialist' : 'Assigned Fleet Partner'
      );

      const deliveryPayload = {
        deliveryNumber: `DEL-${Date.now().toString().slice(-5)}`,
        orderId: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        vehicleNumber: dynamicVehicleNumber,
        driverName: dynamicDriverName,
        driverPhone: savedOrder.driverPhone || 'Logistics Dispatch Support',
        sourceQuarry: {
          name: hasBulkMaterials
            ? 'Urbanico Central Crushed Stone & Sand Quarry Hub'
            : 'Urbanico Central Fulfillment Hub',
          location: 'Hyderabad Logistics Corridor',
          gatePassNo: `GP-${Math.floor(10000 + Math.random() * 90000)}`,
        },
        destinationSite: {
          name: savedOrder.siteAddress?.siteName || 'Construction Site',
          address: savedOrder.siteAddress?.street || 'Site Location, Hyderabad',
          pincode: savedOrder.siteAddress?.pincode || '500049',
          contactPerson: savedOrder.customerName || 'Site Supervisor',
          contactPhone: savedOrder.customerPhone || 'Site Contact',
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

      await DeliveryService.registerDelivery(deliveryPayload);
    } catch (deliveryErr) {
      console.warn('Could not auto-create delivery doc:', deliveryErr);
    }

    return savedOrder;
  }

  public static async getAllOrders(query: { status?: string; search?: string; phone?: string; email?: string } = {}) {
    const cleanPhoneDigits = query.phone ? query.phone.replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = query.email ? query.email.trim().toLowerCase() : '';

    try {
      if (mongoose.connection.readyState === 1) {
        const filter: Record<string, any> = {};
        if (query.status && query.status !== 'all') {
          filter.orderStatus = query.status;
        }
        if (cleanPhoneDigits) {
          filter.customerPhone = { $regex: cleanPhoneDigits };
        } else if (cleanEmail) {
          filter.customerEmail = { $regex: cleanEmail, $options: 'i' };
        }
        if (query.search) {
          filter.$or = [
            { orderNumber: { $regex: query.search, $options: 'i' } },
            { customerName: { $regex: query.search, $options: 'i' } },
            { customerPhone: { $regex: query.search, $options: 'i' } },
          ];
        }
        const dbOrders = await Order.find(filter).sort({ createdAt: -1 }).exec();
        return dbOrders;
      }
    } catch (err) {
      console.warn('Error reading from MongoDB, returning in-memory orders fallback:', err);
    }

    // Filter in-memory orders
    return inMemoryOrders.filter((o) => {
      if (query.status && query.status !== 'all' && o.orderStatus !== query.status) return false;
      if (cleanPhoneDigits) {
        const oDigits = (o.customerPhone || '').replace(/\D/g, '');
        if (!oDigits.includes(cleanPhoneDigits)) return false;
      } else if (cleanEmail) {
        const oEmail = (o.customerEmail || '').trim().toLowerCase();
        if (oEmail !== cleanEmail) return false;
      }
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
    // If order is being cancelled, process automated refund if payment was settled
    let refundInfo: any = {};
    if (status === 'cancelled') {
      try {
        const existing = await this.getOrderById(id);
        const paymentId = existing?.paymentDetails?.razorpay_payment_id || (existing as any)?.razorpayPaymentId;
        const totalAmt = existing?.totalAmount || 0;
        if (paymentId && totalAmt > 0) {
          const { RazorpayBackendService } = await import('./razorpayService');
          const refundRes = await RazorpayBackendService.processRefund({
            paymentId,
            amountInPaise: Math.round(totalAmt * 100),
            notes: {
              reason: 'Customer initiated order cancellation',
              orderNumber: existing.orderNumber || id,
            },
          });
          refundInfo = {
            paymentStatus: 'refunded',
            refundId: refundRes.refundId || `rfnd_${Date.now()}`,
            refundAmount: totalAmt,
            refundStatus: refundRes.status || 'processed',
            refundProcessedAt: new Date().toISOString(),
          };
          console.log(`[Order Refund] Automated refund executed for order #${existing.orderNumber || id}: Refund ID ${refundInfo.refundId}`);
        } else if (existing?.paymentStatus === 'paid') {
          refundInfo = {
            paymentStatus: 'refunded',
            refundId: `rfnd_auto_${Date.now()}`,
            refundAmount: totalAmt,
            refundStatus: 'processed',
            refundProcessedAt: new Date().toISOString(),
          };
        }
      } catch (refundErr: any) {
        console.warn('[Order Refund] Automatic gateway refund notification:', refundErr?.message || refundErr);
      }
    }

    const mergedFields = { ...extraFields, ...refundInfo };

    try {
      if (mongoose.connection.readyState === 1) {
        let dbOrder = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          dbOrder = await Order.findByIdAndUpdate(
            id,
            { $set: { orderStatus: status, ...mergedFields, updatedAt: new Date() } },
            { new: true }
          ).exec();
        } else {
          dbOrder = await Order.findOneAndUpdate(
            { orderNumber: id },
            { $set: { orderStatus: status, ...mergedFields, updatedAt: new Date() } },
            { new: true }
          ).exec();
        }
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
        ...mergedFields,
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

  public static async purgeAllOrders() {
    try {
      if (mongoose.connection.readyState === 1) {
        await Order.deleteMany({}).exec();
      }
    } catch (err) {
      console.warn('[Order] Purge database error:', err);
    }
    inMemoryOrders.length = 0;
    return { success: true, message: 'All orders wiped completely' };
  }

  /**
   * Synchronize all orders to MongoDB Atlas collection
   */
  public static async syncToAtlas() {
    if (mongoose.connection.readyState !== 1 || inMemoryOrders.length === 0) return;
    try {
      console.log(`[Order] Syncing ${inMemoryOrders.length} orders to MongoDB Atlas...`);
      for (const ord of inMemoryOrders) {
        if (!ord.orderNumber) continue;
        const existing = await Order.findOne({ orderNumber: ord.orderNumber }).exec();
        if (!existing) {
          const newDoc = new Order({
            orderNumber: ord.orderNumber,
            customerName: ord.customerName || 'Valued Customer',
            customerPhone: ord.customerPhone || '9848012345',
            customerEmail: ord.customerEmail || '',
            businessName: ord.businessName || '',
            gstin: ord.gstin || '',
            siteAddress: ord.siteAddress || {
              siteName: 'Construction Site',
              street: 'Site Address',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500032',
            },
            items: ord.items || [],
            subtotal: ord.subtotal || 0,
            taxAmount: ord.taxAmount || 0,
            deliveryCharges: ord.deliveryCharges || 0,
            unloadingCharges: ord.unloadingCharges || 0,
            totalAmount: ord.totalAmount || 0,
            paymentStatus: ord.paymentStatus || 'paid',
            paymentMethod: ord.paymentMethod || 'UPI',
            orderStatus: ord.orderStatus || 'confirmed',
            eWayBillNo: ord.eWayBillNo,
            vehicleNumber: ord.vehicleNumber,
            driverName: ord.driverName,
            driverPhone: ord.driverPhone,
            deliveryOtp: ord.deliveryOtp || generateRandomOtp(),
          });
          await newDoc.save();
        }
      }
      console.log('[Order] 🟢 All orders synced to MongoDB Atlas successfully.');
    } catch (err: any) {
      console.warn('[Order] Error syncing orders to Atlas:', err?.message || err);
    }
  }
}

