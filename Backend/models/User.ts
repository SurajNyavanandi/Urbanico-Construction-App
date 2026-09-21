import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  role: 'contractor' | 'engineer' | 'supervisor' | 'client' | 'admin';
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
  creditLimit?: number;
  availableCredit?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    role: {
      type: String,
      enum: ['contractor', 'engineer', 'supervisor', 'client', 'admin'],
      default: 'contractor',
    },
    gstin: { type: String, trim: true, uppercase: true },
    companyName: { type: String, trim: true },
    avatarUrl: {
      type: String,
      default: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
    },
    profilePicture: {
      type: String,
      default: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
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
    creditLimit: { type: Number, default: 500000 },
    availableCredit: { type: Number, default: 500000 },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
