import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { Material } from '../models/Material';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Delivery } from '../models/Delivery';
import {
  MASTER_CATEGORIES,
  MASTER_MATERIALS,
  MASTER_SERVICES,
} from '../data/seedData';

export class DatabaseSeeder {
  /**
   * Seed all initial collections if empty into MongoDB Atlas
   */
  public static async seedAll(): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      console.log('[DB-Seeder] MongoDB connection not ready, skipping seeding.');
      return;
    }

    try {
      console.log('[DB-Seeder] Verifying MongoDB Atlas collections...');

      // 1. Categories
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        console.log('[DB-Seeder] Seeding 8 Master Categories to MongoDB Atlas...');
        await Category.insertMany(
          MASTER_CATEGORIES.map((c) => ({
            id: c.id,
            name: c.name,
            image: c.image,
            count: c.count,
            priceLabel: c.priceLabel,
            subcategoriesText: c.subcategoriesText,
            tag: c.tag,
            highlighted: c.highlighted || false,
          }))
        );
        console.log('[DB-Seeder] Categories seeded successfully.');
      }

      // 2. Materials
      const materialCount = await Material.countDocuments();
      if (materialCount === 0) {
        console.log('[DB-Seeder] Seeding 34 Master Materials to MongoDB Atlas...');
        await Material.insertMany(
          MASTER_MATERIALS.map((m) => ({
            id: m.id,
            categoryId: m.categoryId,
            category: m.category,
            name: m.name,
            subtitle: m.subtitle,
            description: m.description || '',
            image: m.image,
            imageUrl: m.image,
            actionType: m.actionType || 'add_to_cart',
            defaultPrice: m.defaultPrice,
            basePrice: m.defaultPrice,
            unit: m.unit,
            inStock: m.inStock !== false,
            stockQuantity: m.stockQuantity || 1000,
            hsnCode: m.hsnCode || '6810',
            gstRate: m.gstRate || 18,
            fastDispatch: m.fastDispatch !== false,
            tag: m.tag || '',
            options: m.options || [],
            specifications: m.specifications || {},
          }))
        );
        console.log('[DB-Seeder] Materials seeded successfully.');
      }

      // 3. Services / Trades
      const serviceCount = await Service.countDocuments();
      if (serviceCount === 0) {
        console.log('[DB-Seeder] Seeding Master Services to MongoDB Atlas...');
        await Service.insertMany(
          MASTER_SERVICES.map((s) => ({
            id: s.id,
            name: s.name,
            subtitle: s.subtitle,
            image: s.image,
            rate: s.rate,
            description: s.description,
            tag: s.tag || '',
          }))
        );
        console.log('[DB-Seeder] Services seeded successfully.');
      }

      // 4. Default Demonstration Users (Contractor + Admin)
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[DB-Seeder] Seeding Initial Contractor & Admin Users to MongoDB Atlas...');
        await User.insertMany([
          {
            phone: '+919848012345',
            name: 'K. Surya Prakash',
            email: 'surya.contractor@urbanico.in',
            role: 'contractor',
            companyName: 'Surya Infra & Constructions Pvt Ltd',
            gstin: '36AAACS9812M1Z4',
            avatarUrl: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
            profilePicture: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
            billingAddress: {
              street: 'Plot 42, Financial District, Gachibowli',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500032',
            },
            deliverySites: [
              {
                siteName: 'Urbanico High-Rise Tower Site B',
                address: 'Plot 42, Financial District, Nanakramguda, Hyderabad, Telangana - 500032',
                pincode: '500032',
                supervisorName: 'K. Surya Prakash',
                supervisorPhone: '+919848012345',
                isPrimary: true,
              },
            ],
            savedLocations: ['Plot 42, Financial District, Nanakramguda, Hyderabad'],
            creditLimit: 1500000,
            availableCredit: 1240000,
          },
          {
            phone: '+919999999999',
            name: 'Urbanico Master Admin',
            email: 'admin@urbanico.in',
            role: 'admin',
            companyName: 'Urbanico Technologies Head Office',
            gstin: '36AAACU9821M1Z5',
            avatarUrl: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
            profilePicture: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
            billingAddress: {
              street: 'Jubilee Enclave, HITEC City',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500081',
            },
            creditLimit: 50000000,
            availableCredit: 50000000,
          },
        ]);
        console.log('[DB-Seeder] Demo users created in Atlas.');
      }

      // 5. Initial Seed Orders
      const orderCount = await Order.countDocuments();
      if (orderCount === 0) {
        console.log('[DB-Seeder] Seeding Live Sample Construction Orders to MongoDB Atlas...');
        const seedOrders = [
          {
            orderNumber: 'URB-892104-712',
            customerName: 'Commercial Site Supervisor',
            customerPhone: '9848012345',
            customerEmail: 'site.procurement@urbanico.in',
            gstin: '36AAACU9821M1Z5',
            siteAddress: {
              siteName: 'Urbanico High-Rise Tower Site B',
              street: 'Plot 42, Financial District, Nanakramguda',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500032',
              coordinates: { lat: 17.4156, lng: 78.3489 },
            },
            items: [
              {
                name: 'UltraTech Super Cement (53 Grade OPC)',
                category: 'cement',
                quantity: 50,
                unit: '50kg Bag',
                unitPrice: 385,
                totalPrice: 19250,
                gstAmount: 0.18,
                image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
              },
              {
                name: 'Tata Tiscon Fe550D TMT Steel Rebars (12mm)',
                category: 'iron_bars',
                quantity: 500,
                unit: 'kg',
                unitPrice: 68,
                totalPrice: 34000,
                gstAmount: 0.18,
                image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
              },
            ],
            subtotal: 53250,
            taxAmount: 9585,
            deliveryCharges: 0,
            unloadingCharges: 800,
            totalAmount: 63635,
            paymentStatus: 'paid',
            paymentMethod: 'UPI / NetBanking',
            orderStatus: 'in_transit',
            eWayBillNo: 'EWB-TS-2026-88192301',
            vehicleNumber: 'TS 09 UB 5120',
            driverName: 'Ramesh Kumar (Fleet Dispatch)',
            driverPhone: '+91 98490 55120',
            deliveryOtp: '749182',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            orderNumber: 'URB-764319-481',
            customerName: 'Kavitha Infra Projects',
            customerPhone: '9848012345',
            customerEmail: 'procure@kavithainfra.com',
            gstin: '36AABCK7812L1ZX',
            siteAddress: {
              siteName: 'Villa Enclave Project - Block C',
              street: 'Sy No. 120, Kokapet SEZ Road',
              city: 'Hyderabad',
              state: 'Telangana',
              pincode: '500075',
            },
            items: [
              {
                name: 'Robo Sand Triple Washed Plastering M-Sand',
                category: 'sand',
                quantity: 3,
                unit: 'Brass / Unit',
                unitPrice: 8500,
                totalPrice: 25500,
                gstAmount: 0.05,
                image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/sand2_wj9sly.jpg',
              },
              {
                name: 'Kiln Fired High-Strength Red Clay Bricks',
                category: 'bricks',
                quantity: 2500,
                unit: 'Pieces',
                unitPrice: 9.5,
                totalPrice: 23750,
                gstAmount: 0.12,
                image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614403/brick2_gjzbjh.jpg',
              },
            ],
            subtotal: 49250,
            taxAmount: 4125,
            deliveryCharges: 1500,
            unloadingCharges: 1200,
            totalAmount: 56075,
            paymentStatus: 'paid',
            paymentMethod: 'Razorpay Corporate Netbanking',
            orderStatus: 'delivered',
            eWayBillNo: 'EWB-TS-2026-44781290',
            vehicleNumber: 'TS 07 UA 3901',
            driverName: 'Mallesh Yadav',
            driverPhone: '+91 94401 22910',
            deliveryOtp: '392815',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ];

        await Order.insertMany(seedOrders);
        console.log('[DB-Seeder] Seed orders inserted in Atlas.');

        // Also create delivery records for active shipments
        await Delivery.create({
          deliveryNumber: 'DEL-89210',
          orderNumber: 'URB-892104-712',
          vehicleNumber: 'TS 09 UB 5120',
          driverName: 'Ramesh Kumar (Fleet Dispatch)',
          driverPhone: '+91 98490 55120',
          sourceQuarry: {
            name: 'Urbanico Central Crushed Stone & Sand Quarry Hub',
            location: 'Hyderabad Logistics Corridor',
            gatePassNo: 'GP-48192',
          },
          destinationSite: {
            name: 'Urbanico High-Rise Tower Site B',
            address: 'Plot 42, Financial District, Nanakramguda, Hyderabad, Telangana - 500032',
            pincode: '500032',
            contactPerson: 'K. Surya Prakash',
            contactPhone: '+919848012345',
          },
          currentLocation: {
            latitude: 17.4156,
            longitude: 78.3489,
            speedKmH: 38,
            lastUpdated: new Date(),
          },
          status: 'in_transit',
          otp: '749182',
          isOtpVerified: false,
          estimatedArrivalTime: new Date(Date.now() + 28 * 60 * 1000),
        });
      }

      console.log('[DB-Seeder] Atlas database initialization complete.');
    } catch (err: any) {
      console.error('[DB-Seeder] Error during Atlas seeding:', err?.message || err);
    }
  }
}
