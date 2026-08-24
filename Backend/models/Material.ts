import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
  name: string;
  category: 'Cement' | 'Aggregates' | 'Steel' | 'Bricks' | 'Chemicals' | 'Plumbing' | 'Hardware';
  subCategory?: string;
  brand?: string;
  grade?: string;
  description: string;
  basePrice: number;
  unit: string;
  hsnCode?: string;
  gstRate: number;
  inStock: boolean;
  stockQuantity?: number;
  minOrderQuantity: number;
  densityTonsPerUnit?: number;
  labCertNo?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['Cement', 'Aggregates', 'Steel', 'Bricks', 'Chemicals', 'Plumbing', 'Hardware'],
      index: true,
    },
    subCategory: { type: String, trim: true },
    brand: { type: String, trim: true },
    grade: { type: String, trim: true },
    description: { type: String, default: '' },
    basePrice: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: 'Ton' },
    hsnCode: { type: String, trim: true },
    gstRate: { type: Number, default: 18 },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 1000 },
    minOrderQuantity: { type: Number, default: 1 },
    densityTonsPerUnit: { type: Number, default: 1.0 },
    labCertNo: { type: String },
    imageUrl: { type: String },
    specifications: { type: Map, of: String },
  },
  {
    timestamps: true,
  }
);

export const Material: Model<IMaterial> =
  (mongoose.models.Material as Model<IMaterial>) || mongoose.model<IMaterial>('Material', MaterialSchema);
