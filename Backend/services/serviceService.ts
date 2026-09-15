import { Service, IService } from '../models/Service';
import mongoose from 'mongoose';

export interface ServiceInfo {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  rate: string;
  description: string;
  tag?: string;
}

export const BACKEND_SERVICES: ServiceInfo[] = [
  {
    id: 'mason',
    name: 'Mason',
    subtitle: 'Tile & Brickwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg',
    rate: '₹99 Demo Visit',
    description: 'Experienced Masons for bricklaying, plastering, stone masonry, tile fitting & concrete slab laying.',
  },
  {
    id: 'painter',
    name: 'Painter',
    subtitle: 'Interior & Exterior Painting',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/painter_dofdp9.jpg',
    rate: '₹99 Demo Visit',
    description: 'Skilled Painters for putty application, primer coating, texture finishes & exterior weather-proof coating.',
  },
  {
    id: 'fabricator',
    name: 'Fabricator',
    subtitle: 'Steel & Welding Works',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/fabricator_dmfp4t.jpg',
    rate: '₹99 Demo Visit',
    description: 'Heavy and light fabrication specialists for structural trusses, MS gates, railings & safety grills.',
  },
  {
    id: 'electrician',
    name: 'Electrician',
    subtitle: 'Wiring & Panels',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852931/electrician_imidbv.jpg',
    rate: '₹99 Demo Visit',
    description: 'Certified Electricians for conduit piping, MCB panel installation, 3-phase wiring & safety earthing.',
  },
  {
    id: 'plumber',
    name: 'Plumber',
    subtitle: 'Piping & Sanitary Fittings',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/plumber_zxj5ct.jpg',
    rate: '₹99 Demo Visit',
    description: 'CPVC/UPVC water supply line installation, drainage plumbing, bathroom fittings & sump motor connections.',
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    subtitle: 'Woodwork & Formwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788852146/carpenter_pdnvrz.jpg',
    rate: '₹99 Demo Visit',
    description: 'Specialist Carpenters for door frames, wooden centring, modular kitchen carcasses & plywood shuttering.',
  },
];

let inMemoryServices = [...BACKEND_SERVICES];

function getDefaultImageForCategory(categoryId: string, name?: string): string {
  return 'https://images.unsplash.com/photo-1541888086925-ebc66336ea26?auto=format&fit=crop&q=80&w=600';
}

export class ServiceService {
  public static async getAllServices() {
    try {
      if (mongoose.connection.readyState === 1) {
        const services = await Service.find().lean().exec();
        if (services && services.length > 0) {
          return services;
        }
      }
    } catch (err) {
      // fallback to memory
    }
    return inMemoryServices;
  }

  public static async getServiceById(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const service = await Service.findOne({ $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] }).lean().exec();
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
        const deleted = await Service.findOneAndDelete({ $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] }).lean().exec();
        
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
}
