import { Material, IMaterial } from '../models/Material';
import { Category, ICategory } from '../models/Category';
import mongoose from 'mongoose';
import {
  MASTER_CATEGORIES,
  MASTER_SERVICES,
  MASTER_MATERIAL_ITEMS,
  MASTER_PROJECT_BUNDLES,
  MasterCategory,
  MasterMaterialItem,
  MasterProjectBundle,
} from '../data/seedData';
import { materialCache, categoryCache, bundleCache } from '../utils/memoryCache';

export type CategoryInfo = MasterCategory;
export type ProjectBundleInfo = MasterProjectBundle;

export const BACKEND_CATEGORIES: CategoryInfo[] = MASTER_CATEGORIES;
export const BACKEND_PROJECT_BUNDLES: ProjectBundleInfo[] = MASTER_PROJECT_BUNDLES;
export const BACKEND_MATERIAL_ITEMS: any[] = MASTER_MATERIAL_ITEMS;

let inMemoryCategories: CategoryInfo[] = [...MASTER_CATEGORIES];
let inMemoryBundles: ProjectBundleInfo[] = [...MASTER_PROJECT_BUNDLES];
let inMemoryMaterials: any[] = [...MASTER_MATERIAL_ITEMS];

export function getDefaultImageForCategory(categoryId: string, name: string = ''): string {
  const cat = (categoryId || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (cat.includes('cement') || n.includes('cement')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg';
  }
  if (cat.includes('brick') || n.includes('brick') || n.includes('aac') || n.includes('block')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614403/brick2_gjzbjh.jpg';
  }
  if (cat.includes('sand') || n.includes('sand') || n.includes('m-sand') || n.includes('p-sand')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931576/Plastering_Sand_mvhxto.png';
  }
  if (cat.includes('stone') || cat.includes('aggregate') || n.includes('aggregate') || n.includes('granite') || n.includes('gravel')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931575/Stone_20mm_qvbriu.png';
  }
  if (cat.includes('iron') || cat.includes('steel') || n.includes('tmt') || n.includes('rebar') || n.includes('steel')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Iron_bar_wz80t5.png';
  }
  if (cat.includes('centring') || cat.includes('formwork') || n.includes('scaffolding') || n.includes('plank')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931561/Wooden_Planks_o94gt5.png';
  }
  if (cat.includes('tile') || cat.includes('floor') || n.includes('tile') || n.includes('granite slab') || n.includes('marble')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg';
  }
  if (cat.includes('service') || n.includes('mason') || n.includes('painter') || n.includes('electrician') || n.includes('plumber')) {
    return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg';
  }
  return 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg';
}

export class MaterialService {
  // ==========================================
  // MATERIALS GET & FILTER
  // ==========================================
  public static async getAllMaterials(filter: { category?: string; search?: string } = {}) {
    const cacheKey = `materials:${filter.category || 'all'}:${filter.search || ''}`;
    const cached = materialCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (mongoose.connection.readyState === 1) {
        const query: Record<string, any> = {};
        if (filter.category && filter.category !== 'All' && filter.category !== 'all') {
          query.$or = [
            { categoryId: filter.category.toLowerCase() },
            { category: { $regex: filter.category, $options: 'i' } },
          ];
        }
        if (filter.search) {
          query.$or = [
            { name: { $regex: filter.search, $options: 'i' } },
            { subtitle: { $regex: filter.search, $options: 'i' } },
            { description: { $regex: filter.search, $options: 'i' } },
          ];
        }

        let materials = await Material.find(query).sort({ createdAt: -1 }).lean().exec();

        // Auto-seed default materials if collection is completely empty
        if (materials.length === 0 && !filter.search && (!filter.category || filter.category === 'All' || filter.category === 'all')) {
          materials = await Material.find(query).sort({ createdAt: -1 }).lean().exec();
        }

        if (materials && materials.length > 0) {
          materialCache.set(cacheKey, materials, 120_000);
          return materials;
        }
      }
    } catch (err) {
      console.warn('Using in-memory dynamic materials catalogue:', err);
    }

    // Filter in-memory dynamic catalogue
    const result = inMemoryMaterials.filter((m) => {
      if (filter.category && filter.category !== 'All' && filter.category !== 'all') {
        const cat = filter.category.toLowerCase();
        const matchesCategory =
          (m.categoryId && m.categoryId.toLowerCase() === cat) ||
          (m.category && m.category.toLowerCase() === cat);
        if (!matchesCategory) return false;
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matchesSearch =
          (m.name && m.name.toLowerCase().includes(s)) ||
          (m.subtitle && m.subtitle.toLowerCase().includes(s)) ||
          (m.description && m.description.toLowerCase().includes(s));
        if (!matchesSearch) return false;
      }
      return true;
    });

    materialCache.set(cacheKey, result, 120_000);
    return result;
  }

  public static async getMaterialById(id: string) {
    const cacheKey = `material:${id}`;
    const cached = materialCache.get(cacheKey);
    if (cached) return cached;

    try {
      if (mongoose.connection.readyState === 1) {
        const material = await Material.findOne({
          $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();
        if (material) {
          materialCache.set(cacheKey, material, 300_000);
          return material;
        }
      }
    } catch (err) {
      // fallback
    }
    const fallback = inMemoryMaterials.find((m: any) => m.id === id || m._id === id || m.name === id) || null;
    if (fallback) materialCache.set(cacheKey, fallback, 300_000);
    return fallback;
  }

  // ==========================================
  // CATEGORIES CRUD (Database-Backed + In-Memory Fallback)
  // ==========================================
  public static async getCategories() {
    const cached = categoryCache.get('categories:all');
    if (cached) return cached;

    try {
      if (mongoose.connection.readyState === 1) {
        let categories = await Category.find().sort({ createdAt: 1 }).lean().exec();
        if (categories && categories.length > 0) {
          categoryCache.set('categories:all', categories, 300_000);
          return categories;
        }

        // Auto-seed default categories if empty
        categories = await Category.find().sort({ createdAt: 1 }).lean().exec();
        if (categories && categories.length > 0) {
          categoryCache.set('categories:all', categories, 300_000);
          return categories;
        }
      }
    } catch (err) {
      console.warn('MaterialService getCategories using in-memory fallback:', err);
    }
    categoryCache.set('categories:all', inMemoryCategories, 300_000);
    return inMemoryCategories;
  }

  public static async getCategoryById(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const category = await Category.findOne({
          $or: [{ id: id.toLowerCase() }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();
        if (category) return category;
      }
    } catch (err) {
      // fallback
    }
    return inMemoryCategories.find((c) => c.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public static async createCategory(data: Partial<CategoryInfo>) {
    categoryCache.clear();
    const rawId = (data.id || data.name || `cat_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCategory: CategoryInfo = {
      id: rawId,
      name: data.name || 'New Category',
      image: data.image && data.image.startsWith('http') ? data.image : getDefaultImageForCategory(rawId, data.name),
      count: data.count || '1 Product',
      priceLabel: data.priceLabel || 'From ₹99',
      subcategoriesText: data.subcategoriesText || '',
      tag: data.tag || data.name?.toUpperCase() || 'GENERAL',
      highlighted: data.highlighted || false,
    };

    try {
      if (mongoose.connection.readyState === 1) {
        const created = await Category.create(newCategory);
        inMemoryCategories.push(newCategory);
        return created;
      }
    } catch (err) {
      // fallback
    }

    inMemoryCategories.push(newCategory);
    return newCategory;
  }

  public static async updateCategory(id: string, data: Partial<CategoryInfo>) {
    categoryCache.clear();
    try {
      if (mongoose.connection.readyState === 1) {
        const updated = await Category.findOneAndUpdate(
          { $or: [{ id: id.toLowerCase() }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] },
          { $set: data },
          { new: true }
        ).lean().exec();

        if (updated) {
          const idx = inMemoryCategories.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
          if (idx !== -1) {
            inMemoryCategories[idx] = { ...inMemoryCategories[idx], ...data };
          }
          return updated;
        }
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryCategories.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      if (data.image && !data.image.startsWith('http')) {
        delete data.image;
      }
      inMemoryCategories[idx] = { ...inMemoryCategories[idx], ...data };
      return inMemoryCategories[idx];
    }
    return null;
  }

  public static async deleteCategory(id: string) {
    categoryCache.clear();
    try {
      if (mongoose.connection.readyState === 1) {
        const deleted = await Category.findOneAndDelete({
          $or: [{ id: id.toLowerCase() }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();

        if (deleted) {
          const idx = inMemoryCategories.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
          if (idx !== -1) {
            inMemoryCategories.splice(idx, 1);
          }
          return deleted;
        }
      }
    } catch (err) {
      // fallback
    }

    const idx = inMemoryCategories.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      const [removed] = inMemoryCategories.splice(idx, 1);
      return removed;
    }
    return null;
  }

  // ==========================================
  // PROJECT BUNDLES CRUD
  // ==========================================
  public static getProjectBundles() {
    return inMemoryBundles;
  }

  public static getProjectBundleById(id: string) {
    return inMemoryBundles.find((b) => b.id.toLowerCase() === id.toLowerCase()) || null;
  }

  public static createProjectBundle(data: Partial<ProjectBundleInfo>) {
    bundleCache.clear();
    const rawId = (data.id || data.title || `bnd_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newBundle: ProjectBundleInfo = {
      id: rawId,
      title: data.title || 'Project Starter Combo',
      subtitle: data.subtitle || 'All-in-one Construction Package',
      tag: data.tag || 'POPULAR COMBO',
      description: data.description || 'Pre-engineered package combo with bundled savings.',
      itemsSummary: data.itemsSummary || 'Multiple Items Included',
      itemsIncluded: data.itemsIncluded || ['Cement', 'Sand', 'Aggregates'],
      savings: data.savings || 'Save 10%',
      price: Number(data.price) || 5000,
      originalPrice: Number(data.originalPrice) || 5500,
      image: data.image && data.image.startsWith('http') ? data.image : getDefaultImageForCategory('cement', data.title),
      targetCategory: data.targetCategory || 'cement',
      bundleItems: data.bundleItems || [],
    };
    inMemoryBundles.push(newBundle);
    return newBundle;
  }

  public static updateProjectBundle(id: string, data: Partial<ProjectBundleInfo>) {
    bundleCache.clear();
    const idx = inMemoryBundles.findIndex((b) => b.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      if (data.image && !data.image.startsWith('http')) {
        delete data.image;
      }
      inMemoryBundles[idx] = { ...inMemoryBundles[idx], ...data };
      return inMemoryBundles[idx];
    }
    return null;
  }

  public static deleteProjectBundle(id: string) {
    bundleCache.clear();
    const idx = inMemoryBundles.findIndex((b) => b.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      const [removed] = inMemoryBundles.splice(idx, 1);
      return removed;
    }
    return null;
  }

  // ==========================================
  // MATERIALS CRUD
  // ==========================================
  public static async createMaterial(data: Partial<IMaterial> | any) {
    materialCache.clear();
    const categoryId = (data.categoryId || data.category || 'cement').toLowerCase();
    const resolvedImage =
      data.image && typeof data.image === 'string' && data.image.startsWith('http')
        ? data.image
        : getDefaultImageForCategory(categoryId, data.name);

    const itemData = {
      id: data.id || `mat_${Date.now()}`,
      categoryId,
      category: data.category || 'General',
      subCategory: data.subCategory || '',
      name: data.name || 'New Material',
      subtitle: data.subtitle || 'Direct Quarry & Plant Supply',
      description: data.description || 'Premium quality verified construction material.',
      image: resolvedImage,
      actionType: data.actionType || 'add_to_cart',
      defaultPrice: Number(data.defaultPrice) || 100,
      unit: data.unit || 'Unit',
      hsnCode: data.hsnCode || '252329',
      gstRate: Number(data.gstRate) || 18,
      inStock: data.inStock ?? true,
      stockQuantity: Number(data.stockQuantity) || 1000,
      rating: Number(data.rating) || 4.8,
      reviewsCount: Number(data.reviewsCount) || 24,
      tag: data.tag || 'VERIFIED',
      fastDispatch: data.fastDispatch ?? true,
      options: data.options || [
        {
          id: 'standard-unit',
          label: 'Standard Volume Unit',
          price: Number(data.defaultPrice) || 100,
          type: 'radio',
        },
      ],
      specifications: data.specifications || {},
      originYard: data.originYard || 'Urbanico Central Yard, Hyderabad',
      ...data,
    };

    itemData.image = resolvedImage;

    try {
      if (mongoose.connection.readyState === 1) {
        const material = new Material(itemData);
        await material.save();
        return material.toObject();
      }
    } catch (err) {
      // fallback
    }

    inMemoryMaterials.unshift(itemData);
    return itemData;
  }

  public static async updateMaterial(id: string, data: Partial<IMaterial> | any) {
    materialCache.clear();
    if (data.image && typeof data.image === 'string' && !data.image.startsWith('http')) {
      delete data.image;
    }

    try {
      if (mongoose.connection.readyState === 1) {
        const updated = await Material.findOneAndUpdate(
          { $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] },
          { $set: data },
          { new: true }
        ).lean().exec();
        if (updated) return updated;
      }
    } catch (err) {}

    const idx = inMemoryMaterials.findIndex((m) => m.id === id || m._id === id);
    if (idx !== -1) {
      inMemoryMaterials[idx] = { ...inMemoryMaterials[idx], ...data };
      return inMemoryMaterials[idx];
    }
    return null;
  }

  public static async deleteMaterial(id: string) {
    materialCache.clear();
    try {
      if (mongoose.connection.readyState === 1) {
        const deleted = await Material.findOneAndDelete({
          $or: [{ id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }],
        }).lean().exec();
        if (deleted) return deleted;
      }
    } catch (err) {}

    const idx = inMemoryMaterials.findIndex((m) => m.id === id || m._id === id);
    if (idx !== -1) {
      const [removed] = inMemoryMaterials.splice(idx, 1);
      return removed;
    }
    return null;
  }
}
