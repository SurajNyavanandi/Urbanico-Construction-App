import { Service } from '../models/Service';
import mongoose from 'mongoose';
import { MASTER_SERVICES, MasterService } from '../data/seedData';
import { serviceCache } from '../utils/memoryCache';

export type ServiceInfo = MasterService;

export const BACKEND_SERVICES: ServiceInfo[] = MASTER_SERVICES;

let inMemoryServices: ServiceInfo[] = [...MASTER_SERVICES];

function getDefaultImageForCategory(categoryId: string, name?: string): string {
  return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg';
}

export class ServiceService {
  public static async getAllServices(filter: { limit?: number; page?: number } = {}) {
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const page = Math.max(1, filter.page || 1);
    const skip = (page - 1) * limit;

    const cacheKey = `services:${page}:${limit}`;
    const cached = serviceCache.get(cacheKey);
    if (cached) return cached;

    try {
      if (mongoose.connection.readyState === 1) {
        const total = await Service.countDocuments();
        let services = await Service.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();
        if (services && services.length > 0) {
          const payload = { services, total, page, limit, totalPages: Math.ceil(total / limit) };
          serviceCache.set(cacheKey, payload, 300_000);
          return payload;
        }

        // Auto-seed if collection is empty
        await this.seedDefaultServices();
        const totalAfterSeed = await Service.countDocuments();
        services = await Service.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();
        if (services && services.length > 0) {
          const payload = { services, total: totalAfterSeed, page, limit, totalPages: Math.ceil(totalAfterSeed / limit) };
          serviceCache.set(cacheKey, payload, 300_000);
          return payload;
        }
      }
    } catch (err) {
      console.warn('ServiceService getAllServices using in-memory store:', err);
    }
    const paginated = inMemoryServices.slice(skip, skip + limit);
    const payload = {
      services: paginated,
      total: inMemoryServices.length,
      page,
      limit,
      totalPages: Math.ceil(inMemoryServices.length / limit),
    };
    serviceCache.set(cacheKey, payload, 300_000);
    return payload;
  }

  public static async getServiceById(id: string) {
    const cacheKey = `service:${id}`;
    const cached = serviceCache.get(cacheKey);
    if (cached) return cached;

    try {
      if (mongoose.connection.readyState === 1) {
        const service = await Service.findOne({
          $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();
        if (service) {
          serviceCache.set(cacheKey, service, 300_000);
          return service;
        }
      }
    } catch (err) {
      // fallback
    }
    const fallback = inMemoryServices.find((s) => s.id.toLowerCase() === id.toLowerCase()) || null;
    if (fallback) serviceCache.set(cacheKey, fallback, 300_000);
    return fallback;
  }

  public static async createService(data: Partial<ServiceInfo>) {
    serviceCache.clear();
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
    serviceCache.clear();
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
    serviceCache.clear();
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
