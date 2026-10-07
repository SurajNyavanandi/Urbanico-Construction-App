import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

const inMemoryUsers: any[] = [];

export class UserService {
  public static async findOrCreateUser(phone: string, userData: Partial<IUser> = {}) {
    const cleanPhone = phone ? phone.replace(/[^\d+]/g, '') : '';
    const cleanDigits = phone ? phone.replace(/\D/g, '').slice(-10) : '';

    try {
      if (mongoose.connection.readyState === 1) {
        let user = null;
        if (cleanPhone) {
          user = await User.findOne({ phone: cleanPhone }).exec();
          if (!user && cleanDigits) {
            user = await User.findOne({ phone: { $regex: cleanDigits } }).exec();
          }
        }
        if (!user) {
          user = new User({
            phone: cleanPhone || '+919876543210',
            name: userData.name || '',
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

    let memoryUser = inMemoryUsers.find((u) => {
      const uDigits = (u.phone || '').replace(/\D/g, '');
      return u.phone === cleanPhone || (cleanDigits && uDigits.includes(cleanDigits));
    });
    if (!memoryUser) {
      memoryUser = {
        _id: `usr_${Date.now()}`,
        phone: cleanPhone || '+919876543210',
        name: userData.name || '',
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
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    try {
      if (mongoose.connection.readyState === 1) {
        let user = await User.findOne({ phone: clean }).exec();
        if (!user && cleanDigits) {
          user = await User.findOne({ phone: { $regex: cleanDigits } }).exec();
        }
        if (user) return user;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryUsers.find((u) => {
      const uDigits = (u.phone || '').replace(/\D/g, '');
      return u.phone === clean || (cleanDigits && uDigits.includes(cleanDigits));
    }) || null;
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
        if (user) {
          const idx = inMemoryUsers.findIndex((u) => u._id === idOrPhone || u.phone === idOrPhone);
          if (idx !== -1) {
            inMemoryUsers[idx] = {
              ...inMemoryUsers[idx],
              ...updateData,
              updatedAt: new Date(),
            };
          }
          return user;
        }
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

  public static async getAllUsers(filter: Record<string, any> = {}) {
    try {
      if (mongoose.connection.readyState === 1) {
        return await User.find(filter).sort({ createdAt: -1 }).exec();
      }
    } catch (err) {
      console.warn('[User] DB getAllUsers error:', err);
    }
    return inMemoryUsers;
  }

  public static async deleteUser(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          return await User.findByIdAndDelete(id).exec();
        }
        return await User.findOneAndDelete({ phone: id }).exec();
      }
    } catch (err) {
      console.warn('[User] DB deleteUser error:', err);
    }
    const idx = inMemoryUsers.findIndex((u) => u._id === id || u.phone === id);
    if (idx !== -1) {
      return inMemoryUsers.splice(idx, 1)[0];
    }
    return null;
  }

  public static async purgeAllUsers() {
    try {
      if (mongoose.connection.readyState === 1) {
        await User.deleteMany({}).exec();
      }
    } catch (err) {
      console.warn('[User] Purge database error:', err);
    }
    inMemoryUsers.length = 0;
    return { success: true, message: 'All user data wiped completely' };
  }

  /**
   * Synchronize all in-memory users directly into MongoDB Atlas collections
   */
  public static async syncToAtlas() {
    if (mongoose.connection.readyState !== 1) return;
    try {
      console.log(`[User] Reconciling ${inMemoryUsers.length} user records with MongoDB Atlas...`);
      for (const u of inMemoryUsers) {
        const cleanPhone = (u.phone || '').replace(/[^\d+]/g, '');
        if (!cleanPhone) continue;
        await User.findOneAndUpdate(
          { phone: cleanPhone },
          {
            $set: {
              name: u.name,
              email: u.email,
              role: u.role,
              companyName: u.companyName,
              gstin: u.gstin,
              avatarUrl: u.avatarUrl,
              profilePicture: u.profilePicture,
              billingAddress: u.billingAddress,
              deliverySites: u.deliverySites,
              savedLocations: u.savedLocations,
              cart: u.cart,
              creditLimit: u.creditLimit,
              availableCredit: u.availableCredit,
              updatedAt: u.updatedAt || new Date(),
            },
            $setOnInsert: {
              phone: cleanPhone,
              createdAt: u.createdAt || new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }

      // Reconcile users from Atlas back into inMemoryUsers
      const atlasUsers = await User.find({}).limit(100).exec();
      for (const aUser of atlasUsers) {
        const cleanPhone = (aUser.phone || '').replace(/[^\d+]/g, '');
        const foundIdx = inMemoryUsers.findIndex(
          (u) => (u.phone || '').replace(/[^\d+]/g, '') === cleanPhone
        );
        if (foundIdx === -1) {
          inMemoryUsers.push(aUser.toObject());
        }
      }

      console.log('[User] 🟢 All users reconciled with MongoDB Atlas successfully.');
    } catch (err: any) {
      console.warn('[User] Error during Atlas user sync:', err?.message || err);
    }
  }
}

