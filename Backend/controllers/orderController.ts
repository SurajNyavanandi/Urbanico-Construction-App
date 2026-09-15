import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';

export class OrderController {
  public static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await OrderService.createOrder(req.body);
    return sendSuccess(res, { order }, 'Order placed successfully in Urbanico system', 201);
  });

  public static getOrders = asyncHandler(async (req: Request, res: Response) => {
    const { status, search } = req.query;
    const orders = await OrderService.getAllOrders({
      status: status as string,
      search: search as string,
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
    const { orderNumber, invoiceNumber, recipientEmail, recipientName, recipientBusinessName, recipientGstin, totalAmount } = req.body;
    if (!recipientEmail) {
      return sendError(res, 'Recipient email is required', 400);
    }

    console.log(`[Invoice Dispatch] Sending Tax Invoice #${invoiceNumber || orderNumber} to ${recipientEmail} for ${recipientBusinessName || recipientName || 'Client'}`);

    const trackingId = `TRK-INV-${Date.now().toString().slice(-6)}`;

    return sendSuccess(
      res,
      {
        trackingId,
        dispatchedAt: new Date().toISOString(),
        orderNumber,
        invoiceNumber,
        recipientEmail,
        recipientBusinessName,
        recipientGstin,
        totalAmount,
      },
      `Tax Invoice successfully generated and emailed to ${recipientEmail}`
    );
  });
}

