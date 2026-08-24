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
      const id = String(req.params.id);
      const order = await OrderService.getOrderById(id);
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
      const orderNumber = String(req.params.orderNumber);
      const order = await OrderService.getOrderByOrderNumber(orderNumber);
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
      const id = String(req.params.id);
      const { status, extraFields } = req.body;
      const updatedOrder = await OrderService.updateOrderStatus(id, status, extraFields);
      if (!updatedOrder) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      return res.status(200).json({ success: true, order: updatedOrder });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
