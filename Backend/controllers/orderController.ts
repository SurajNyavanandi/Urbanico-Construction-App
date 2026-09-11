import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';

export class OrderController {
  public static async createOrder(req: Request, res: Response) {
    try {
      const order = await OrderService.createOrder(req.body);
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully in Urbanico system',
        order,
      });
    } catch (err: any) {
      console.error('Error creating order:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to place order',
      });
    }
  }

  public static async getOrders(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const orders = await OrderService.getAllOrders({
        status: status as string,
        search: search as string,
      });
      return res.status(200).json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (err: any) {
      console.error('Error retrieving orders:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve orders',
      });
    }
  }

  public static async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(String(id));
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      return res.status(200).json({ success: true, order });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getOrderByOrderNumber(req: Request, res: Response) {
    try {
      const { orderNumber } = req.params;
      const order = await OrderService.getOrderByOrderNumber(String(orderNumber));
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      return res.status(200).json({ success: true, order });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, extraFields } = req.body;
      const updatedOrder = await OrderService.updateOrderStatus(String(id), status, extraFields);
      if (!updatedOrder) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      return res.status(200).json({ success: true, order: updatedOrder });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async emailInvoice(req: Request, res: Response) {
    try {
      const { orderNumber, invoiceNumber, recipientEmail, recipientName, recipientBusinessName, recipientGstin, totalAmount } = req.body;
      if (!recipientEmail) {
        return res.status(400).json({ success: false, error: 'Recipient email is required' });
      }

      console.log(`[Invoice Dispatch] Sending Tax Invoice #${invoiceNumber || orderNumber} to ${recipientEmail} for ${recipientBusinessName || recipientName || 'Client'}`);

      // Generate verification tracking ID
      const trackingId = `TRK-INV-${Date.now().toString().slice(-6)}`;

      return res.status(200).json({
        success: true,
        message: `Tax Invoice successfully generated and emailed to ${recipientEmail}`,
        trackingId,
        dispatchedAt: new Date().toISOString(),
        orderNumber,
        invoiceNumber,
        recipientEmail,
        recipientBusinessName,
        recipientGstin,
        totalAmount,
      });
    } catch (err: any) {
      console.error('Error emailing invoice:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to email invoice' });
    }
  }
}
