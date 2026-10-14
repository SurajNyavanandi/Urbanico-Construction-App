import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IService extends Document {
  id?: string;
  name: string;
  title?: string;
  category?: string;
  subtitle: string;
  image: string;
  rate: string;
  ratePerWorkerDay?: number;
  minHeadcount?: number;
  availableSlots?: string[];
  contractorName?: string;
  rating?: number;
  description: string;
  tag?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    title: { type: String, trim: true },
    category: { type: String, default: 'Trade Services', index: true },
    subtitle: { type: String, trim: true },
    image: { type: String },
    rate: { type: String, trim: true },
    ratePerWorkerDay: { type: Number, default: 850 },
    minHeadcount: { type: Number, default: 1 },
    availableSlots: [{ type: String }],
    contractorName: { type: String, default: 'Urbanico Verified Trade Partner' },
    rating: { type: Number, default: 4.9 },
    description: { type: String, default: '' },
    tag: { type: String },
  },
  {
    timestamps: true,
    strict: false,
  }
);

ServiceSchema.index({ createdAt: 1 });
ServiceSchema.index({ tag: 1 });

export const Service: Model<IService> =
  (mongoose.models.Service as Model<IService>) || mongoose.model<IService>('Service', ServiceSchema);
