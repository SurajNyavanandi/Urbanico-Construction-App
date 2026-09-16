import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  id: string;
  name: string;
  image: string;
  count?: string;
  priceLabel?: string;
  subcategoriesText?: string;
  tag?: string;
  highlighted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    image: { type: String, required: true },
    count: { type: String, default: '' },
    priceLabel: { type: String, default: '' },
    subcategoriesText: { type: String, default: '' },
    tag: { type: String, default: '' },
    highlighted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) || mongoose.model<ICategory>('Category', CategorySchema);
