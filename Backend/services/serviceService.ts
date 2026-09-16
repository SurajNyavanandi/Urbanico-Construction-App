import { Service } from '../models/Service';
import mongoose from 'mongoose';
import { MASTER_SERVICES, MasterService } from '../data/seedData';

export type ServiceInfo = MasterService;

export const BACKEND_SERVICES: ServiceInfo[] = MASTER_SERVICES;

let inMemoryServices: ServiceInfo[] = [...MASTER_SERVICES];

function getDefaultImageForCategory(categoryId: string, name?: string): string {
  return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg';
}

export class ServiceService {
  public static async getAllServices() {
    try {
      if (mongoose.connection.readyState === 1) {
        let services = await Service.find().lean().exec();
        if (services && services.length > 0) {
          return services;
        }

        // Auto-seed if collection is empty
        await this.seedDefaultServices();
        services = await Service.find().lean().exec();
        if (services && services.length > 0) {
          return services;
        }
      }
    } catch (err) {
      console.warn('ServiceService getAllServices using in-memory store:', err);
    }
    return inMemoryServices;
  }

  public static async getServiceById(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const service = await Service.findOne({
          $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();
        if (service) return service;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryServices.find((s) => s.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public static async createService(data: Partial<ServiceInfo>) {
    const rawId = (data.id || data.name || `srv_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newService: ServiceInfo = {
      id: rawId,
      name: data.name || 'New Service',
      subtitle: data.subtitle || 'Certified Trade Expert',
      image: data.image && data.image.startsWith('http') ? data.image : getDefaultImageForCategory('services', data.name),
      rate: data.rate || '₹99 Demo Visit',
      description: data.description || 'Experienced certified construction trade professional for site works.',
      tag: data.tag || 'SERVICES',
    };

    try {
      if (mongoose.connection.readyState === 1) {
        const service = await Service.create(newService);
        inMemoryServices.push(newService);
        return service;
      }
    } catch (err) {
      // fallback
    }
    inMemoryServices.push(newService);
    return newService;
  }

  public static async updateService(id: string, data: Partial<ServiceInfo>) {
    try {
      if (mongoose.connection.readyState === 1) {
        const updated = await Service.findOneAndUpdate(
          { $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] },
          { $set: data },
          { new: true }
        ).lean().exec();

        if (updated) {
          const idx = inMemoryServices.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
          if (idx !== -1) {
            inMemoryServices[idx] = { ...inMemoryServices[idx], ...data };
          }
          return updated;
        }
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryServices.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      if (data.image && !data.image.startsWith('http')) {
        delete data.image;
      }
      inMemoryServices[idx] = { ...inMemoryServices[idx], ...data };
      return inMemoryServices[idx];
    }
    return null;
  }

  public static async deleteService(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const deleted = await Service.findOneAndDelete({
          $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();

        if (deleted) {
          const idx = inMemoryServices.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
          if (idx !== -1) {
            inMemoryServices.splice(idx, 1);
          }
          return deleted;
        }
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryServices.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      const [removed] = inMemoryServices.splice(idx, 1);
      return removed;
    }
    return null;
  }

  public static async seedDefaultServices() {
    try {
      if (mongoose.connection.readyState === 1) {
        for (const s of MASTER_SERVICES) {
          await Service.findOneAndUpdate(
            { id: s.id },
            { $set: s },
            { upsert: true, new: true }
          ).exec();
        }
        console.log(`🌱 Seeded ${MASTER_SERVICES.length} Urbanico services successfully.`);
      }
    } catch (err: any) {
      console.error('Error seeding default services:', err.message);
    }
    inMemoryServices = [...MASTER_SERVICES];
  }
}
