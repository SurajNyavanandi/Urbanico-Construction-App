import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Quote } from '../models/Quote';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';
import { sanitizePhone } from '../utils/sanitizer';

export class QuoteController {
  public static createQuote = asyncHandler(async (req: Request, res: Response) => {
    const { customerName, customerPhone, customerEmail, siteLocation, items, notes } = req.body;

    if (!customerPhone || !siteLocation || !items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Validation error: customerPhone, siteLocation, and items array are required.', 400);
    }

    const newQuote = new Quote({
      quoteId: `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName || 'B2B Client',
      customerPhone: sanitizePhone(customerPhone),
      customerEmail: customerEmail || '',
      siteLocation: {
        siteName: siteLocation.siteName || 'Construction Site',
        street: siteLocation.street || 'Site Address',
        city: siteLocation.city || 'Hyderabad',
        state: siteLocation.state || 'Telangana',
        pincode: siteLocation.pincode || '500032',
      },
      items,
      notes: notes || '',
      status: 'pending',
      bids: [],
    });

    const savedQuote = await newQuote.save();

    return sendSuccess(res, { quote: savedQuote }, 'B2B Custom RFQ / Quote submitted successfully to database', 201);
  });

  public static getQuotes = asyncHandler(async (req: Request, res: Response) => {
    const { phone, status } = req.query;
    const filter: Record<string, any> = {};

    if (phone) {
      filter.customerPhone = { $regex: sanitizePhone(phone) };
    }
    if (status && status !== 'all') {
      filter.status = String(status);
    }

    const quotes = await Quote.find(filter).sort({ createdAt: -1 }).lean().exec();
    return sendSuccess(res, { quotes, count: quotes.length });
  });

  public static getQuoteById = asyncHandler(async (req: Request, res: Response) => {
    const idStr = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const isObjectId = mongoose.Types.ObjectId.isValid(idStr);
    const quote = await Quote.findOne(
      isObjectId ? { $or: [{ _id: idStr }, { quoteId: idStr }] } : { quoteId: idStr }
    ).lean().exec();
    if (!quote) {
      return sendError(res, 'Quote RFQ record not found', 404);
    }
    return sendSuccess(res, { quote });
  });
}
