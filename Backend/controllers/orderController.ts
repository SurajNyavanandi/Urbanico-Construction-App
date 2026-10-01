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
    const { status, search, phone } = req.query;
    const orders = await OrderService.getAllOrders({
      status: status as string,
      search: search as string,
      phone: phone as string,
    });
    return sendSuccess(res, { orders, count: orders.length });
  });

  public static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await OrderService.getOrderById(String(id));
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    return sendSuccess(res, { order });
  });

  public static getOrderByOrderNumber = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const order = await OrderService.getOrderByOrderNumber(String(orderNumber));
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    return sendSuccess(res, { order });
  });

  public static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, extraFields } = req.body;
    const updatedOrder = await OrderService.updateOrderStatus(String(id), status, extraFields);
    if (!updatedOrder) {
      return sendError(res, 'Order not found', 404);
    }
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

    // Dispatch via reusable mailer library (SMTP or clean dev preview)
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

  public static deleteAllOrders = asyncHandler(async (_req: Request, res: Response) => {
    await OrderService.purgeAllOrders();
    const { DeliveryService } = await import('../services/deliveryService');
    await DeliveryService.purgeAllDeliveries();
    return sendSuccess(res, { count: 0 }, 'All orders and delivery tracking records wiped successfully');
  });
}

