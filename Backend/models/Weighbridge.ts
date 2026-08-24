import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWeighbridgeSlip extends Document {
  slipNumber: string;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  vehicleNumber: string;
  materialName: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  netWeightTons: number;
  moisturePercentage?: number;
  weighbridgeOperator: string;
  weighbridgeStation: string;
  slipImageUrl?: string;
  ocrExtractedData?: Record<string, any>;
  verifiedBySiteEngineer?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WeighbridgeSlipSchema = new Schema<IWeighbridgeSlip>(
  {
    slipNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `WB-${Date.now().toString().slice(-6)}`,
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: { type: String },
    vehicleNumber: { type: String, required: true, uppercase: true },
    materialName: { type: String, required: true },
    grossWeightKg: { type: Number, required: true },
    tareWeightKg: { type: Number, required: true },
    netWeightKg: { type: Number, required: true },
    netWeightTons: { type: Number, required: true },
    moisturePercentage: { type: Number, default: 0 },
    weighbridgeOperator: { type: String, default: 'Ramulu G.' },
    weighbridgeStation: { type: String, default: 'Urbanico Automated Digital Scale #1' },
    slipImageUrl: { type: String },
    ocrExtractedData: { type: Map, of: Schema.Types.Mixed },
    verifiedBySiteEngineer: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const WeighbridgeSlip: Model<IWeighbridgeSlip> =
  (mongoose.models.WeighbridgeSlip as Model<IWeighbridgeSlip>) ||
  mongoose.model<IWeighbridgeSlip>('WeighbridgeSlip', WeighbridgeSlipSchema);
