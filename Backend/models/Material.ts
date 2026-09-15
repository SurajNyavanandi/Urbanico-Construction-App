import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaterial extends Document {
  id?: string;
  name: string;
  category?: string;
  categoryId?: string;
  subCategory?: string;
  subtitle?: string;
  brand?: string;
  grade?: string;
  description?: string;
  basePrice?: number;
  defaultPrice?: number;
  unit?: string;
  hsnCode?: string;
  gstRate?: number;
  inStock?: boolean;
  stockQuantity?: number;
  minOrderQuantity?: number;
  densityTonsPerUnit?: number;
  labCertNo?: string;
  imageUrl?: string;
  image?: string;
  actionType?: 'add_to_cart' | 'get_quote';
  tag?: string;
  fastDispatch?: boolean;
  options?: any[];
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, index: true },
    categoryId: { type: String, index: true },
    subCategory: { type: String, trim: true },
    subtitle: { type: String },
    brand: { type: String, trim: true },
    grade: { type: String, trim: true },
    description: { type: String, default: '' },
    basePrice: { type: Number, default: 0 },
    defaultPrice: { type: Number, default: 0 },
    unit: { type: String, default: 'Unit' },
    hsnCode: { type: String, trim: true },
    gstRate: { type: Number, default: 18 },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 1000 },
    minOrderQuantity: { type: Number, default: 1 },
    densityTonsPerUnit: { type: Number, default: 1.0 },
    labCertNo: { type: String },
    imageUrl: { type: String },
    image: { type: String },
    actionType: { type: String, default: 'add_to_cart' },
    tag: { type: String },
    fastDispatch: { type: Boolean, default: true },
    options: [Schema.Types.Mixed],
    specifications: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const Material: Model<IMaterial> =
  (mongoose.models.Material as Model<IMaterial>) || mongoose.model<IMaterial>('Material', MaterialSchema);

