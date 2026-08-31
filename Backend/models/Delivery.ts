import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDelivery extends Document {
  deliveryNumber: string;
  orderId: mongoose.Types.ObjectId | string;
  orderNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  sourceQuarry: {
    name: string;
    location: string;
    gatePassNo?: string;
  };
  destinationSite: {
    name: string;
    address: string;
    pincode: string;
    contactPerson: string;
    contactPhone: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    speedKmH?: number;
    lastUpdated: Date;
  };
  estimatedArrivalTime?: Date;
  status: 'loading' | 'weighed_out' | 'in_transit' | 'reached_site' | 'unloading' | 'delivered';
  eWayBillUrl?: string;
  otp: string;
  isOtpVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    deliveryNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `DEL-${Date.now().toString().slice(-5)}`,
    },
    orderId: { type: Schema.Types.Mixed, required: true },
    orderNumber: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    sourceQuarry: {
      name: { type: String, default: 'Urbanico Central Quarry Hub' },
      location: { type: String, default: 'Patancheru Outskirts, Hyderabad' },
      gatePassNo: { type: String },
    },
    destinationSite: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true },
      contactPerson: { type: String, required: true },
      contactPhone: { type: String, required: true },
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      speedKmH: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    estimatedArrivalTime: { type: Date },
    status: {
      type: String,
      enum: ['loading', 'weighed_out', 'in_transit', 'reached_site', 'unloading', 'delivered'],
      default: 'loading',
    },
    eWayBillUrl: { type: String },
    otp: {
      type: String,
      default: () => Math.floor(100000 + Math.random() * 900000).toString(),
    },
    isOtpVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Delivery: Model<IDelivery> =
  (mongoose.models.Delivery as Model<IDelivery>) || mongoose.model<IDelivery>('Delivery', DeliverySchema);
