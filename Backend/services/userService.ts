import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

const inMemoryUsers: any[] = [];

export class UserService {
  public static async findOrCreateUser(phone: string, userData: Partial<IUser> = {}) {
    const cleanPhone = phone ? phone.replace(/[^\d+]/g, '') : '+919876543210';

    try {
      if (mongoose.connection.readyState === 1) {
        let user = await User.findOne({ phone: cleanPhone }).exec();
        if (!user) {
          user = new User({
            phone: cleanPhone,
            name: userData.name || 'Site Incharge',
            email: userData.email || '',
            role: userData.role || 'contractor',
            companyName: userData.companyName || '',
            gstin: userData.gstin || '',
            avatarUrl: userData.avatarUrl || 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
            profilePicture: userData.profilePicture || 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
            billingAddress: userData.billingAddress || undefined,
            deliverySites: userData.deliverySites || [],
            creditLimit: userData.creditLimit || 0,
            availableCredit: userData.availableCredit || 0,
          });
          await user.save();
        }
        return user;
      }
    } catch (err) {
      console.warn('[User] Note: In-memory fallback used');
    }

    let memoryUser = inMemoryUsers.find((u) => u.phone === cleanPhone);
    if (!memoryUser) {
      memoryUser = {
        _id: `usr_${Date.now()}`,
        phone: cleanPhone,
        name: userData.name || 'Site Incharge',
        email: userData.email || '',
        role: userData.role || 'contractor',
        companyName: userData.companyName || '',
        gstin: userData.gstin || '',
        avatarUrl: userData.avatarUrl || 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
        profilePicture: userData.profilePicture || 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
        billingAddress: userData.billingAddress || undefined,
        deliverySites: userData.deliverySites || [],
        creditLimit: userData.creditLimit || 0,
        availableCredit: userData.availableCredit || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryUsers.push(memoryUser);
    }
    return memoryUser;
  }

  public static async getUserById(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(id).exec();
        if (user) return user;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryUsers.find((u) => u._id === id || String(u._id) === id) || null;
  }

  public static async getUserByPhone(phone: string) {
    const clean = phone.replace(/[^\d+]/g, '');
    try {
      if (mongoose.connection.readyState === 1) {
        const user = await User.findOne({ phone: clean }).exec();
        if (user) return user;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryUsers.find((u) => u.phone === clean || u.phone.includes(clean)) || null;
  }

  public static async updateUser(idOrPhone: string, updateData: Partial<IUser>) {
    try {
      if (mongoose.connection.readyState === 1) {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(idOrPhone)) {
          user = await User.findByIdAndUpdate(idOrPhone, { $set: updateData }, { new: true }).exec();
        } else {
          user = await User.findOneAndUpdate({ phone: idOrPhone }, { $set: updateData }, { new: true }).exec();
        }
        if (user) return user;
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryUsers.findIndex((u) => u._id === idOrPhone || u.phone === idOrPhone);
    if (idx !== -1) {
      inMemoryUsers[idx] = {
        ...inMemoryUsers[idx],
        ...updateData,
        updatedAt: new Date(),
      };
      return inMemoryUsers[idx];
    }
    return null;
  }
}

