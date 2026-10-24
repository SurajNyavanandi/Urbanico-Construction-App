import mongoose, { Schema, Document, Model } from 'mongoose';
import { USER_ROLES, UserRole, DEFAULT_AVATAR_URL } from '../config/constants';

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  gstin?: string;
  companyName?: string;
  avatarUrl?: string;
  profilePicture?: string;
  permissions?: string[];
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  deliverySites?: Array<{
    siteName: string;
    address: string;
    pincode: string;
    supervisorName?: string;
    supervisorPhone?: string;
    isPrimary?: boolean;
  }>;
  savedLocations?: string[];
  cart?: Array<{
    id: string;
    name: string;
    category?: string;
    quantity: number;
    unit?: string;
    price?: number;
    pricePerUnit?: number;
    image?: string;
    [key: string]: any;
  }>;
  creditLimit?: number;
  availableCredit?: number;
  usedCredit?: number;
  isVerified?: boolean;
  addresses?: Array<{
    siteName: string;
    address: string;
    pincode: string;
    supervisorName?: string;
    supervisorPhone?: string;
    isPrimary?: boolean;
  }>;
  savedItems?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'contractor',
    },
    gstin: { type: String, trim: true, uppercase: true },
    companyName: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    avatarUrl: {
      type: String,
      default: DEFAULT_AVATAR_URL,
    },
    profilePicture: {
      type: String,
      default: DEFAULT_AVATAR_URL,
    },
    permissions: [{ type: String }],
    billingAddress: {
      street: { type: String },
      city: { type: String, default: 'Hyderabad' },
      state: { type: String, default: 'Telangana' },
      pincode: { type: String },
    },
    deliverySites: [
      {
        siteName: { type: String, required: true },
        address: { type: String, required: true },
        pincode: { type: String, required: true },
        supervisorName: { type: String },
        supervisorPhone: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    addresses: [Schema.Types.Mixed],
    savedLocations: [{ type: String }],
    savedItems: [{ type: String }],
    cart: [{ type: Schema.Types.Mixed }],
    creditLimit: { type: Number, default: 500000 },
    availableCredit: { type: Number, default: 500000 },
    usedCredit: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// High-speed lookup and role management indexes
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
