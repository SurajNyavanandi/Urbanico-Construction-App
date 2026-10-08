import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';
import { sendInvoiceMail, InvoiceItem } from '../lib/mailer';

export class OrderController {
  public static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await OrderService.createOrder(req.body);
    return sendSuccess(res, { order }, 'Order placed successfully in Urbanico system', 201);
  });

  public static getOrders = asyncHandler(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const { status, search, phone, email } = req.query;

    const filterPhone = authUser && authUser.role === 'admin'
      ? (phone as string)
      : authUser?.phone || (phone as string);

    const orders = await OrderService.getAllOrders({
      status: status as string,
      search: search as string,
      phone: filterPhone,
      email: authUser && authUser.role === 'admin' ? (email as string) : authUser?.email,
    });
    return sendSuccess(res, { orders, count: orders.length });
  });

  public static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const authUser = (req as any).user;
    const order = await OrderService.getOrderById(String(id));
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (authUser && authUser.role !== 'admin' && authUser.role !== 'supervisor') {
      const userPhoneDigits = (authUser.phone || '').replace(/\D/g, '').slice(-10);
      const orderPhoneDigits = (order.customerPhone || '').replace(/\D/g, '').slice(-10);
      if (userPhoneDigits && orderPhoneDigits && userPhoneDigits !== orderPhoneDigits) {
        return sendError(res, 'Access denied: You do not own this order record.', 403);
      }
    }

    return sendSuccess(res, { order });
  });

  public static getOrderByOrderNumber = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const authUser = (req as any).user;
    const order = await OrderService.getOrderByOrderNumber(String(orderNumber));
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (authUser && authUser.role !== 'admin' && authUser.role !== 'supervisor') {
      const userPhoneDigits = (authUser.phone || '').replace(/\D/g, '').slice(-10);
      const orderPhoneDigits = (order.customerPhone || '').replace(/\D/g, '').slice(-10);
      if (userPhoneDigits && orderPhoneDigits && userPhoneDigits !== orderPhoneDigits) {
        return sendError(res, 'Access denied: You do not own this order record.', 403);
      }
    }

    return sendSuccess(res, { order });
  });

  public static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, extraFields } = req.body;
    const authUser = (req as any).user;

    const existingOrder = await OrderService.getOrderById(String(id));
    if (!existingOrder) {
      return sendError(res, 'Order not found', 404);
    }

    const isAdminOrStaff = authUser && (authUser.role === 'admin' || authUser.role === 'supervisor' || authUser.role === 'driver');
    const userPhoneDigits = (authUser?.phone || '').replace(/\D/g, '').slice(-10);
    const orderPhoneDigits = (existingOrder.customerPhone || '').replace(/\D/g, '').slice(-10);
    const isOwner = Boolean(userPhoneDigits && orderPhoneDigits && userPhoneDigits === orderPhoneDigits);

    if (status === 'cancelled') {
      if (!isOwner && !isAdminOrStaff) {
        return sendError(res, 'Access denied: You can only cancel your own orders.', 403);
      }
    } else {
      // Dispatched, en_route, delivered, confirmed transitions require operational staff
      if (!isAdminOrStaff) {
        return sendError(res, `Forbidden: Status '${status}' can only be transitioned by logistics operations.`, 403);
      }
    }

    // Whitelist extraFields to prevent malicious overwrites of financial/item amounts
    const sanitizedExtraFields: any = {};
    if (extraFields?.cancellationReason) sanitizedExtraFields.cancellationReason = String(extraFields.cancellationReason).slice(0, 200);
    if (extraFields?.notes) sanitizedExtraFields.notes = String(extraFields.notes).slice(0, 500);
    if (extraFields?.cancelledAt) sanitizedExtraFields.cancelledAt = extraFields.cancelledAt;

    const updatedOrder = await OrderService.updateOrderStatus(String(id), status, sanitizedExtraFields);
    return sendSuccess(res, { order: updatedOrder });
  });

  public static emailInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber, invoiceNumber, recipientEmail, recipientName, recipientBusinessName, recipientGstin, totalAmount, items: reqItems } = req.body;
    if (!recipientEmail) {
      return sendError(res, 'Recipient email is required', 400);
    }

    const activeInvoiceNo = invoiceNumber || orderNumber || `INV-${Date.now().toString().slice(-6)}`;
    const customerDisplayName = recipientBusinessName || recipientName || 'Valued Client';
    console.log(`[Invoice Dispatch] Sending Tax Invoice #${activeInvoiceNo} to ${recipientEmail} for ${customerDisplayName}`);

    let invoiceItems: InvoiceItem[] = Array.isArray(reqItems) ? reqItems : [];
    let calculatedAmount = Number(totalAmount || 0);

    // If items not directly supplied, attempt to enrich from order record
    if (orderNumber && invoiceItems.length === 0) {
      try {
        const order = await OrderService.getOrderById(String(orderNumber));
        if (order) {
          calculatedAmount = calculatedAmount || Number(order.totalAmount || 0);
          if (Array.isArray(order.items)) {
            invoiceItems = order.items.map((i: any) => ({
              name: i.title || i.name || 'Catalog Item',
              quantity: Number(i.quantity || 1),
              unitPrice: Number(i.price || (i.total ? i.total / (i.quantity || 1) : 0)),
              total: Number(i.total || ((i.price || 0) * (i.quantity || 1))),
              unit: i.unit || 'unit',
            }));
          }
        }
      } catch (err) {
        console.warn('[Invoice Dispatch] Could not fetch order items for invoice enrichment:', err);
      }
    }

    const trackingId = `TRK-INV-${Date.now().toString().slice(-6)}`;

    // Dispatch via reusable mailer library (Resend or clean dev preview)
    const mailResult = await sendInvoiceMail({
      to: recipientEmail,
      customerName: customerDisplayName,
      invoiceNumber: activeInvoiceNo,
      amount: calculatedAmount,
      customerGstin: recipientGstin,
      companyName: 'Urbanico Direct Materials & Services',
      items: invoiceItems,
      paymentStatus: 'PAID',
    });

    return sendSuccess(
      res,
      {
        trackingId,
        dispatchedAt: new Date().toISOString(),
        orderNumber,
        invoiceNumber: activeInvoiceNo,
        recipientEmail,
        recipientBusinessName,
        recipientGstin,
        totalAmount: calculatedAmount,
        mailDelivery: {
          success: mailResult.success,
          mode: mailResult.mode,
          messageId: mailResult.messageId,
        },
      },
      `Tax Invoice successfully generated and emailed to ${recipientEmail}`
    );
  });

  public static deleteAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const secretHeader = (req.headers['x-admin-secret'] as string) || (req.query.admin_secret as string);
    const configuredSecret = process.env.ADMIN_API_SECRET;
    if (process.env.NODE_ENV === 'production' && (!configuredSecret || secretHeader !== configuredSecret)) {
      return sendError(res, 'Purge operation forbidden in production mode.', 403);
    }

    await OrderService.purgeAllOrders();
    const { DeliveryService } = await import('../services/deliveryService');
    await DeliveryService.purgeAllDeliveries();
    return sendSuccess(res, { count: 0 }, 'All orders and delivery tracking records wiped successfully');
  });
}

