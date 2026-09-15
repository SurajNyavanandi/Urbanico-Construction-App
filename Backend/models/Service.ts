import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IService extends Document {
  id?: string;
  name: string;
  subtitle: string;
  image: string;
  rate: string;
  description: string;
  tag?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    subtitle: { type: String, trim: true },
    image: { type: String },
    rate: { type: String, trim: true },
    description: { type: String, default: '' },
    tag: { type: String },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const Service: Model<IService> =
  (mongoose.models.Service as Model<IService>) || mongoose.model<IService>('Service', ServiceSchema);
