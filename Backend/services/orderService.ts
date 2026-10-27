import { Order, IOrder } from '../models/Order';
import { Delivery } from '../models/Delivery';
import { DeliveryService } from './deliveryService';
import { generateRandomOtp } from '../utils/otpHelper';
import { sanitizeText, sanitizeName, sanitizeAddressField, sanitizePhone } from '../utils/sanitizer';
import { MASTER_SAMPLE_ORDERS } from '../data/seedData';
import mongoose from 'mongoose';

// In-memory store initialized from unified master seed data
const inMemoryOrders: any[] = [...MASTER_SAMPLE_ORDERS];

export class OrderService {
  public static async createOrder(orderData: Partial<IOrder>) {
    // 0. Idempotency & Concurrency Guard: Check for duplicate order submission within last 30 seconds
    const idempotencyKey = (orderData as any).idempotencyKey || (orderData as any).receiptNumber || (orderData as any).receipt;
    const customerPhoneDigits = sanitizePhone(orderData.customerPhone);

    if (idempotencyKey) {
      const existingByIdempotency = inMemoryOrders.find(
        (o) => (o as any).idempotencyKey === idempotencyKey || o.paymentDetails?.receiptNumber === idempotencyKey
      );
      if (existingByIdempotency) {
        console.log(`[OrderService] Idempotent hit: Returning existing order #${existingByIdempotency.orderNumber} for key ${idempotencyKey}`);
        return existingByIdempotency;
      }
    }

    if (customerPhoneDigits && orderData.items && orderData.items.length > 0) {
      const recentDuplicate = inMemoryOrders.find((o) => {
        const oPhone = sanitizePhone(o.customerPhone);
        const ageMs = Date.now() - new Date(o.createdAt).getTime();
        return (
          oPhone === customerPhoneDigits &&
          ageMs < 15000 && // Within 15 seconds
          Math.abs(Number(o.totalAmount || 0) - Number(orderData.totalAmount || 0)) <= 2 &&
          o.items?.length === orderData.items?.length
        );
      });
      if (recentDuplicate) {
        console.log(`[OrderService] Concurrent double-tap detected! Returning existing order #${recentDuplicate.orderNumber}`);
        return recentDuplicate;
      }
    }

    // 1. Calculate financial sums
    const items = orderData.items || [];
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const itemTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      item.totalPrice = itemTotal;
      const isService = (item.category || '').toLowerCase().includes('service') || (item.name || '').toLowerCase().includes('consult');
      let gst = 0;
      if (item.gstAmount !== undefined && item.gstAmount !== null) {
        // If frontend already provided calculated rupee tax (e.g. > 1), use it directly; if fractional rate (<= 1), multiply
        if (item.gstAmount > 1) {
          gst = Math.round(item.gstAmount);
        } else {
          gst = Math.round(itemTotal * item.gstAmount);
        }
      } else {
        gst = isService ? 0 : Math.round(itemTotal * 0.18);
      }
      taxAmount += gst;
      subtotal += itemTotal;
    });

    const deliveryCharges = orderData.deliveryCharges ?? (subtotal > 50000 ? 0 : 2500);
    const unloadingCharges = orderData.unloadingCharges ?? 0;
    const couponDiscount = Math.round(Number(orderData.couponDiscount || 0));
    const serverCalculatedTotal = Math.max(0, Math.round(subtotal + taxAmount + deliveryCharges + unloadingCharges - couponDiscount));

    // Enforce server-authoritative total amount to prevent client-side price tampering
    let finalTotalAmount = serverCalculatedTotal;
    if (orderData.totalAmount !== undefined && orderData.totalAmount !== null) {
      const clientTotal = Math.round(Number(orderData.totalAmount));
      // Allow minor deviation up to ₹5 for rounding or verified discount
      if (clientTotal > 0 && Math.abs(clientTotal - serverCalculatedTotal) <= 5) {
        finalTotalAmount = clientTotal;
      } else if (clientTotal > 0 && couponDiscount > 0 && Math.abs(clientTotal - serverCalculatedTotal) <= 10) {
        finalTotalAmount = clientTotal;
      } else if (clientTotal > 0 && orderData.notes && clientTotal <= serverCalculatedTotal) {
        finalTotalAmount = clientTotal;
      } else {
        console.warn(`[OrderService] Client totalAmount (₹${clientTotal}) differed from server computed (₹${serverCalculatedTotal}). Enforcing server-authoritative total.`);
        finalTotalAmount = serverCalculatedTotal;
      }
    }

    // 2. Database-Backed Credit / BNPL Limit Verification
    const isBnpl = (orderData.paymentMethod || '').toLowerCase().includes('credit') ||
                   (orderData.paymentMethod || '').toLowerCase().includes('later') ||
                   (orderData.paymentMethod || '').toLowerCase().includes('bnpl');

    if (isBnpl && customerPhoneDigits) {
      const { UserService } = await import('./userService');
      const user = await UserService.getUserByPhone(customerPhoneDigits);
      if (user) {
        const creditLimit = Number(user.creditLimit) || 500000;
        const currentUsed = Number(user.usedCredit) || 0;
        if (currentUsed + finalTotalAmount > creditLimit) {
          const avail = Math.max(0, creditLimit - currentUsed);
          throw new Error(`Urbanico Credit limit exceeded. Order total ₹${finalTotalAmount.toLocaleString('en-IN')} exceeds your available BNPL credit limit of ₹${avail.toLocaleString('en-IN')} (Credit Limit: ₹${creditLimit.toLocaleString('en-IN')}).`);
        }
        // Update usedCredit balance on user record
        const newUsed = currentUsed + finalTotalAmount;
        const newAvail = Math.max(0, creditLimit - newUsed);
        await UserService.updateUser(user.phone, {
          usedCredit: newUsed,
          availableCredit: newAvail,
        });
      }
    }

    const generatedOrderNumber = orderData.orderNumber || `URB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const effectivePaymentStatus = orderData.paymentStatus || (orderData.paymentMethod?.toLowerCase().includes('site') || orderData.paymentMethod?.toLowerCase().includes('pod') ? 'pending_site_verification' : 'paid');

    const rawPayment = (orderData.paymentDetails || {}) as any;
    const normalizedPaymentDetails = {
      razorpay_payment_id: rawPayment.razorpay_payment_id || rawPayment.razorpayPaymentId,
      razorpay_order_id: rawPayment.razorpay_order_id || rawPayment.razorpayOrderId,
      razorpayPaymentId: rawPayment.razorpay_payment_id || rawPayment.razorpayPaymentId,
      razorpayOrderId: rawPayment.razorpay_order_id || rawPayment.razorpayOrderId,
      razorpay_signature: rawPayment.razorpay_signature || rawPayment.razorpaySignature,
      paymentMethod: rawPayment.paymentMethod || orderData.paymentMethod,
      amount: rawPayment.amount || finalTotalAmount,
      paidAt: rawPayment.paidAt || (effectivePaymentStatus === 'paid' ? new Date() : undefined),
      receiptNumber: rawPayment.receiptNumber,
      timestamp: rawPayment.timestamp || new Date().toISOString(),
    };

    const normalizedItems = (orderData.items || []).map((item: any) => ({
      name: item.name || 'Construction Material',
      category: item.category || 'general',
      quantity: Math.max(1, Number(item.quantity) || 1),
      unit: item.unit || 'Ton',
      unitPrice: Number(item.unitPrice) || 0,
      totalPrice: Number(item.totalPrice) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)),
      gstAmount: Number(item.gstAmount) || 0,
      image: item.image || '',
      materialId: item.materialId || item.id || undefined,
    }));

    const orderPayload = {
      ...orderData,
      items: normalizedItems,
      customerName: sanitizeName(orderData.customerName || 'Valued Customer', 60),
      notes: orderData.notes ? sanitizeText(orderData.notes, 500) : '',
      businessName: orderData.businessName ? sanitizeText(orderData.businessName, 100) : '',
      siteAddress: orderData.siteAddress ? {
        ...orderData.siteAddress,
        siteName: sanitizeText(orderData.siteAddress.siteName || 'Construction Site', 80),
        street: sanitizeAddressField(orderData.siteAddress.street || '', 200),
        city: sanitizeName(orderData.siteAddress.city || 'Hyderabad', 50),
        state: sanitizeName(orderData.siteAddress.state || 'Telangana', 50),
        pincode: String(orderData.siteAddress.pincode || '').replace(/\D/g, '').slice(0, 6),
      } : {
        siteName: 'Construction Site',
        street: 'Site Address',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
      },
      orderNumber: generatedOrderNumber,
      subtotal,
      taxAmount: Math.round(taxAmount),
      deliveryCharges,
      unloadingCharges,
      couponDiscount,
      totalAmount: finalTotalAmount,
      paymentDetails: normalizedPaymentDetails,
      orderStatus: orderData.orderStatus || (effectivePaymentStatus === 'paid' ? 'confirmed' : 'received'),
      paymentStatus: effectivePaymentStatus,
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

    // Atomically decrement material stock quantities to prevent overselling
    try {
      const { MaterialService } = await import('./materialService');
      await MaterialService.decrementStockForItems(savedOrder.items || []);
    } catch (stockErr) {
      console.warn('[OrderService] Material stock decrement log:', stockErr);
    }

    // Auto-create initial dispatch delivery tracking record only when payment is confirmed or Pay-on-Delivery opted
    const isReadyForDispatch =
      savedOrder.paymentStatus === 'paid' ||
      savedOrder.paymentStatus === 'authorized' ||
      savedOrder.paymentMethod?.toLowerCase().includes('site') ||
      savedOrder.paymentMethod?.toLowerCase().includes('pod') ||
      savedOrder.orderStatus === 'confirmed';

    if (isReadyForDispatch) {
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
    }

    return savedOrder;
  }

  public static async getAllOrders(query: { status?: string; search?: string; phone?: string; email?: string; limit?: number; page?: number } = {}) {
    const cleanPhoneDigits = query.phone ? query.phone.replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = query.email ? query.email.trim().toLowerCase() : '';
    const safeLimit = Math.min(100, Math.max(1, Number(query.limit) || 100));
    const safePage = Math.max(1, Number(query.page) || 1);
    const skip = (safePage - 1) * safeLimit;

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
        const dbOrders = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).exec();
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
        const pDetails = (existing?.paymentDetails || {}) as any;
        const paymentId =
          pDetails.razorpay_payment_id ||
          pDetails.razorpayPaymentId ||
          (existing as any)?.razorpayPaymentId ||
          (existing as any)?.razorpay_payment_id;
        const totalAmt = existing?.totalAmount || 0;

        if (paymentId && totalAmt > 0) {
          const { RazorpayBackendService } = await import('./razorpayService');
          const refundRes = await RazorpayBackendService.processRefund({
            paymentId,
            amountInPaise: Math.round(totalAmt * 100),
            notes: {
              reason: extraFields?.notes || (extraFields as any)?.cancellationReason || 'Customer initiated order cancellation',
              orderNumber: existing?.orderNumber || id,
            },
          });
          refundInfo = {
            paymentStatus: 'refunded',
            refundId: refundRes.refundId || `rfnd_${Date.now()}`,
            refundAmount: totalAmt,
            refundStatus: refundRes.status || 'processed',
            refundProcessedAt: new Date().toISOString(),
          };
          console.log(`[Order Refund] Automated gateway refund executed for order #${existing?.orderNumber || id}: Refund ID ${refundInfo.refundId}`);
        } else if (existing?.paymentStatus === 'paid') {
          console.warn(`[Order Refund] Order #${existing?.orderNumber || id} marked cancelled without direct gateway payment ID.`);
          refundInfo = {
            paymentStatus: 'refunded',
            refundId: `rfnd_manual_${Date.now()}`,
            refundAmount: totalAmt,
            refundStatus: 'pending_manual_review',
            refundProcessedAt: new Date().toISOString(),
          };
        }
      } catch (refundErr: any) {
        console.error('[Order Refund] Automatic gateway refund failed:', refundErr?.message || refundErr);
        throw new Error(`Order cancellation refund failed: ${refundErr?.message || 'Gateway communication failure'}`);
      }
    }

    const mergedFields = { ...extraFields, ...refundInfo };

    // Cascading update to delivery tracking record to maintain data consistency
    try {
      const { Delivery } = await import('../models/Delivery');
      const targetOrder = await this.getOrderById(id);
      const activeOrderNum = targetOrder?.orderNumber || id;
      if (status === 'cancelled') {
        if (mongoose.connection.readyState === 1) {
          await Delivery.updateMany({ orderNumber: activeOrderNum }, { $set: { status: 'cancelled' } }).exec();
        }
      } else if (status === 'delivered') {
        if (mongoose.connection.readyState === 1) {
          await Delivery.updateMany({ orderNumber: activeOrderNum }, { $set: { status: 'delivered', isOtpVerified: true } }).exec();
        }
      }
    } catch (delSyncErr) {
      console.warn('[OrderService] Cascading delivery sync notice:', delSyncErr);
    }

    try {
      if (mongoose.connection.readyState === 1) {
        let dbOrder: any = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          dbOrder = await Order.findByIdAndUpdate(
            id,
            { $set: { orderStatus: status, ...mergedFields, updatedAt: new Date() } },
            { returnDocument: 'after' }
          ).exec();
        } else {
          dbOrder = await Order.findOneAndUpdate(
            { orderNumber: id },
            { $set: { orderStatus: status, ...mergedFields, updatedAt: new Date() } },
            { returnDocument: 'after' }
          ).exec();
        }
        if (dbOrder) {
          const idx = inMemoryOrders.findIndex((o) => o._id === id || String(o._id) === id || o.orderNumber === id);
          if (idx !== -1) {
            inMemoryOrders[idx] = {
              ...inMemoryOrders[idx],
              orderStatus: status,
              ...mergedFields,
              updatedAt: new Date(),
            };
          }
          return dbOrder;
        }
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
        const query = mongoose.Types.ObjectId.isValid(id)
          ? { $or: [{ _id: id }, { orderNumber: id }, { 'paymentDetails.razorpay_order_id': id }] }
          : { $or: [{ orderNumber: id }, { 'paymentDetails.razorpay_order_id': id }] };

        const dbOrder = await Order.findOneAndUpdate(
          query,
          {
            $set: {
              paymentStatus,
              paymentDetails,
              orderStatus: paymentStatus === 'paid' ? 'confirmed' : (paymentStatus === 'failed' ? 'received' : 'processing'),
              updatedAt: new Date(),
            },
          },
          { returnDocument: 'after' }
        ).exec();
        if (dbOrder) {
          const idx = inMemoryOrders.findIndex(
            (o) => o._id === id || String(o._id) === id || o.orderNumber === id || o.paymentDetails?.razorpay_order_id === id
          );
          if (idx !== -1) {
            inMemoryOrders[idx] = {
              ...inMemoryOrders[idx],
              paymentStatus,
              paymentDetails,
              orderStatus: paymentStatus === 'paid' ? 'confirmed' : inMemoryOrders[idx].orderStatus,
              updatedAt: new Date(),
            };
          }

          // If confirmed paid, ensure delivery dispatch record is registered
          if (paymentStatus === 'paid') {
            try {
              const { DeliveryService } = await import('./deliveryService');
              const existingDel = await DeliveryService.getDeliveryByOrderNumber(dbOrder.orderNumber);
              if (!existingDel) {
                const otpCode = dbOrder.deliveryOtp || generateRandomOtp();
                await DeliveryService.registerDelivery({
                  deliveryNumber: `DEL-${Date.now().toString().slice(-5)}`,
                  orderId: dbOrder._id,
                  orderNumber: dbOrder.orderNumber,
                  vehicleNumber: dbOrder.vehicleNumber || `TS 08 UB ${Math.floor(1000 + Math.random() * 9000)} (Commercial Fleet)`,
                  driverName: dbOrder.driverName || 'Assigned Fleet Partner',
                  driverPhone: dbOrder.driverPhone || 'Logistics Dispatch Support',
                  sourceQuarry: {
                    name: 'Urbanico Central Fulfillment Hub',
                    location: 'Hyderabad Logistics Corridor',
                  },
                  destinationSite: {
                    name: dbOrder.siteAddress?.siteName || 'Construction Site',
                    address: dbOrder.siteAddress?.street || 'Site Location, Hyderabad',
                    pincode: dbOrder.siteAddress?.pincode || '500049',
                    contactPerson: dbOrder.customerName || 'Site Supervisor',
                    contactPhone: dbOrder.customerPhone || 'Site Contact',
                  },
                  status: 'in_transit' as const,
                  otp: otpCode,
                  isOtpVerified: false,
                  estimatedArrivalTime: new Date(Date.now() + 35 * 60 * 1000),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            } catch (delErr) {
              console.warn('[OrderService] Delivery tracking registration notice:', delErr);
            }
          }

          return dbOrder;
        }
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryOrders.findIndex(
      (o) => o._id === id || String(o._id) === id || o.orderNumber === id || o.paymentDetails?.razorpay_order_id === id
    );
    if (idx !== -1) {
      inMemoryOrders[idx] = {
        ...inMemoryOrders[idx],
        paymentStatus,
        paymentDetails,
        orderStatus: paymentStatus === 'paid' ? 'confirmed' : inMemoryOrders[idx].orderStatus,
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
   * Synchronize all orders to MongoDB Atlas collection with bidirectional reconciliation
   */
  public static async syncToAtlas() {
    if (mongoose.connection.readyState !== 1) return;
    try {
      console.log(`[Order] Reconciling ${inMemoryOrders.length} in-memory orders with MongoDB Atlas...`);
      for (const ord of inMemoryOrders) {
        if (!ord.orderNumber) continue;
        await Order.findOneAndUpdate(
          { orderNumber: ord.orderNumber },
          {
            $set: {
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
              paymentDetails: ord.paymentDetails,
              orderStatus: ord.orderStatus || 'confirmed',
              eWayBillNo: ord.eWayBillNo,
              vehicleNumber: ord.vehicleNumber,
              driverName: ord.driverName,
              driverPhone: ord.driverPhone,
              deliveryOtp: ord.deliveryOtp || generateRandomOtp(),
              updatedAt: ord.updatedAt || new Date(),
            },
            $setOnInsert: {
              orderNumber: ord.orderNumber,
              createdAt: ord.createdAt || new Date(),
            },
          },
          { upsert: true, returnDocument: 'after' }
        ).exec();
      }

      // Reconcile missing orders from Atlas back into inMemoryOrders
      const atlasOrders = await Order.find({}).sort({ createdAt: -1 }).limit(100).exec();
      for (const aOrd of atlasOrders) {
        const foundIdx = inMemoryOrders.findIndex(
          (o) => o.orderNumber === aOrd.orderNumber || String(o._id) === String(aOrd._id)
        );
        if (foundIdx === -1) {
          inMemoryOrders.push(aOrd.toObject());
        }
      }

      console.log('[Order] 🟢 All orders reconciled with MongoDB Atlas successfully.');
    } catch (err: any) {
      console.warn('[Order] Error reconciling orders with Atlas:', err?.message || err);
    }
  }
}

