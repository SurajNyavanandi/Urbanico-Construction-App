import { User, IUser } from '../models/User';

export class UserService {
  public static async findOrCreateUser(phone: string, userData: Partial<IUser> = {}) {
    let user = await User.findOne({ phone }).exec();
    if (!user) {
      user = new User({
        phone,
        name: userData.name || 'Rajesh Kumar (Miyapur Projects)',
        email: userData.email || 'rajesh.m@urbanico.in',
        role: userData.role || 'contractor',
        companyName: userData.companyName || 'Sri Sai Infra & Developers Ltd.',
        gstin: userData.gstin || '36AABCU9603R1ZM',
        billingAddress: {
          street: 'Plot 402, Survey 88, Miyapur Road',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500049',
        },
        deliverySites: [
          {
            siteName: 'Urban Oasis Highrise (Tower B)',
            address: 'Survey 114, Hafeezpet - Miyapur Main Rd',
            pincode: '500049',
            supervisorName: 'Kishore V.',
            supervisorPhone: '+91 98480 12345',
            isPrimary: true,
          },
        ],
        creditLimit: 2500000,
        availableCredit: 1850000,
      });
      await user.save();
    }
    return user;
  }

  public static async getUserById(id: string) {
    return await User.findById(id).exec();
  }

  public static async getUserByPhone(phone: string) {
    return await User.findOne({ phone }).exec();
  }

  public static async updateUser(id: string, updateData: Partial<IUser>) {
    return await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
  }
}
