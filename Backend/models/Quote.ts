import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuoteBid {
  bidId: string;
  contractorName: string;
  contractorPhone: string;
  bidAmount: number;
  estimatedDays: number;
  notes?: string;
  createdAt: Date;
}

export interface IQuote extends Document {
  quoteId: string;
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  siteLocation: {
    siteName?: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    title: string;
    category?: string;
    quantity: number;
    unit?: string;
    specifications?: string;
  }>;
  status: 'pending' | 'bidding' | 'accepted' | 'rejected' | 'closed';
  bids: IQuoteBid[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteBidSchema = new Schema<IQuoteBid>(
  {
    bidId: { type: String, default: () => `BID-${Date.now().toString().slice(-6)}` },
    contractorName: { type: String, required: true },
    contractorPhone: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    estimatedDays: { type: Number, default: 1 },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuoteSchema = new Schema<IQuote>(
  {
    quoteId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `QT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    siteLocation: {
      siteName: { type: String, default: 'Construction Site' },
      street: { type: String, required: true },
      city: { type: String, default: 'Hyderabad' },
      state: { type: String, default: 'Telangana' },
      pincode: { type: String, required: true },
    },
    items: [
      {
        title: { type: String, required: true },
        category: { type: String, default: 'General' },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'Unit' },
        specifications: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'bidding', 'accepted', 'rejected', 'closed'],
      default: 'pending',
      index: true,
    },
    bids: [QuoteBidSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

QuoteSchema.index({ customerPhone: 1, createdAt: -1 });
QuoteSchema.index({ status: 1, createdAt: -1 });

export const Quote: Model<IQuote> =
  (mongoose.models.Quote as Model<IQuote>) || mongoose.model<IQuote>('Quote', QuoteSchema);
