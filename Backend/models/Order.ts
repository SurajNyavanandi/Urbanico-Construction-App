import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  materialId?: mongoose.Types.ObjectId;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  gstin?: string;
  siteAddress: {
    siteName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryCharges: number;
  unloadingCharges: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'credit';
  paymentMethod: string;
  paymentDetails?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    paidAt?: Date;
    receiptNumber?: string;
  };
  orderStatus: 'received' | 'confirmed' | 'processing' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  eWayBillNo?: string;
  deliveryDate?: Date;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  deliveryOtp?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    materialId: { type: Schema.Types.ObjectId, ref: 'Material' },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'Ton' },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `URB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    gstin: { type: String, trim: true },
    siteAddress: {
      siteName: { type: String, default: 'Primary Construction Site' },
      street: { type: String, required: true },
      city: { type: String, default: 'Hyderabad' },
      state: { type: String, default: 'Telangana' },
      pincode: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    deliveryCharges: { type: Number, default: 0 },
    unloadingCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'credit'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'RAZORPAY_ONLINE',
    },
    paymentDetails: {
      razorpay_order_id: { type: String },
      razorpay_payment_id: { type: String },
      razorpay_signature: { type: String },
      paidAt: { type: Date },
      receiptNumber: { type: String },
    },
    orderStatus: {
      type: String,
      enum: ['received', 'confirmed', 'processing', 'dispatched', 'in_transit', 'delivered', 'cancelled'],
      default: 'received',
      index: true,
    },
    eWayBillNo: { type: String },
    deliveryDate: { type: Date },
    vehicleNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    deliveryOtp: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);
