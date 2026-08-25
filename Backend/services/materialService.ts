import { Material, IMaterial } from '../models/Material';
import mongoose from 'mongoose';

const DEFAULT_MATERIALS = [
  {
    name: 'UltraTech OPC 53 Grade Cement',
    category: 'Cement' as const,
    brand: 'UltraTech',
    grade: '53 Grade OPC',
    description: 'High-strength structural grade cement for multi-story load bearing elements & slabs.',
    basePrice: 380,
    unit: 'Bag (50kg)',
    hsnCode: '25232910',
    gstRate: 28,
    inStock: true,
    stockQuantity: 4500,
    minOrderQuantity: 1,
  },
  {
    name: 'UltraTech Super Weather Shield PPC',
    category: 'Cement' as const,
    brand: 'UltraTech',
    grade: 'PPC Weather Shield',
    description: 'Fly-ash based Portland Pozzolana Cement offering high resistance against chemical attack.',
    basePrice: 365,
    unit: 'Bag (50kg)',
    hsnCode: '25232930',
    gstRate: 28,
    inStock: true,
    stockQuantity: 3800,
    minOrderQuantity: 1,
  },
  {
    name: 'Ambuja Kawach Waterproof Cement',
    category: 'Cement' as const,
    brand: 'Ambuja',
    grade: 'Kawach Waterproof',
    description: 'Specially formulated water-repellent cement shielding concrete from saline and dampness.',
    basePrice: 395,
    unit: 'Bag (50kg)',
    hsnCode: '25232910',
    gstRate: 28,
    inStock: true,
    stockQuantity: 2900,
    minOrderQuantity: 1,
  },
  {
    name: 'M-Sand (Manufactured Sand - Zone II)',
    category: 'Aggregates' as const,
    brand: 'Urbanico Premium Quarry',
    grade: 'Zone II (0-4.75mm)',
    description: 'Triple-washed manufactured sand with zero silt content for monolithic concrete mix.',
    basePrice: 1650,
    unit: 'Ton',
    hsnCode: '25051011',
    gstRate: 5,
    inStock: true,
    stockQuantity: 1200,
    minOrderQuantity: 1,
  },
  {
    name: 'P-Sand (Plastering Sand - Micro Zone IV)',
    category: 'Aggregates' as const,
    brand: 'Urbanico Premium Quarry',
    grade: 'Zone IV (0-2.36mm)',
    description: 'Ultra-fine washed plaster sand ensuring crack-free smooth wall finishes.',
    basePrice: 1750,
    unit: 'Ton',
    hsnCode: '25051012',
    gstRate: 5,
    inStock: true,
    stockQuantity: 950,
    minOrderQuantity: 1,
  },
  {
    name: '20mm Blue Metal Granite Aggregates',
    category: 'Aggregates' as const,
    brand: 'Urbanico Quarries',
    grade: '20mm Crushed',
    description: 'Angular hard blue granite stone aggregates for RCC column and foundation pouring.',
    basePrice: 1450,
    unit: 'Ton',
    hsnCode: '25171010',
    gstRate: 5,
    inStock: true,
    stockQuantity: 2500,
    minOrderQuantity: 1,
  },
  {
    name: '10mm Blue Metal Granite Aggregates',
    category: 'Aggregates' as const,
    brand: 'Urbanico Quarries',
    grade: '10mm Crushed',
    description: 'Clean washed 10mm aggregates for lintels, chajjas, and thin slab precast elements.',
    basePrice: 1520,
    unit: 'Ton',
    hsnCode: '25171010',
    gstRate: 5,
    inStock: true,
    stockQuantity: 1800,
    minOrderQuantity: 1,
  },
  {
    name: 'Tata Tiscon Fe 550D TMT Rebars (12mm)',
    category: 'Steel' as const,
    brand: 'Tata Tiscon',
    grade: 'Fe 550D Super Ductile',
    description: 'Earthquake-resistant thermo-mechanically treated rebars with superior elongation.',
    basePrice: 62500,
    unit: 'Ton',
    hsnCode: '72142090',
    gstRate: 18,
    inStock: true,
    stockQuantity: 85,
    minOrderQuantity: 1,
  },
  {
    name: 'JSW Neosteel 550D TMT Rebars (16mm)',
    category: 'Steel' as const,
    brand: 'JSW Steel',
    grade: 'Fe 550D High Yield',
    description: 'Primary steel mill rebars with high bonding strength and fatigue resistance.',
    basePrice: 61800,
    unit: 'Ton',
    hsnCode: '72142090',
    gstRate: 18,
    inStock: true,
    stockQuantity: 110,
    minOrderQuantity: 1,
  },
  {
    name: 'Wire Cut Clay Red Bricks (Class 1)',
    category: 'Bricks' as const,
    brand: 'Urbanico Kilns',
    grade: 'First Class Kiln-burnt',
    description: 'Uniform kiln-fired red clay bricks with >10.5 N/mm² compressive strength.',
    basePrice: 9.5,
    unit: 'Piece',
    hsnCode: '69041000',
    gstRate: 12,
    inStock: true,
    stockQuantity: 65000,
    minOrderQuantity: 500,
  },
  {
    name: 'Autoclaved Aerated Concrete (AAC) Blocks (600x200x150mm)',
    category: 'Bricks' as const,
    brand: 'Urbanico LiteBlock',
    grade: 'Grade 1 AAC',
    description: 'Lightweight thermal-insulating precision blocks reducing structural dead load by 40%.',
    basePrice: 62,
    unit: 'Piece',
    hsnCode: '68101110',
    gstRate: 12,
    inStock: true,
    stockQuantity: 18000,
    minOrderQuantity: 100,
  },
  {
    name: 'Vitrified Double Charge Floor Tiles (600x600 mm)',
    category: 'Hardware' as const,
    brand: 'Urbanico Surface',
    grade: 'Double Charge Vitrified',
    description: 'High-gloss anti-stain vitrified floor tiles for high traffic residential and commercial corridors.',
    basePrice: 58,
    unit: 'Sq.Ft',
    hsnCode: '69072100',
    gstRate: 18,
    inStock: true,
    stockQuantity: 8500,
    minOrderQuantity: 1,
  },
  {
    name: 'Fosroc Conbextra GP2 Non-Shrink Grout',
    category: 'Chemicals' as const,
    brand: 'Fosroc',
    grade: 'Free-flow Grout',
    description: 'Precision non-shrink cementitious grout for heavy baseplates & column anchorage.',
    basePrice: 890,
    unit: 'Bag (25kg)',
    hsnCode: '38245090',
    gstRate: 18,
    inStock: true,
    stockQuantity: 320,
    minOrderQuantity: 1,
  },
  {
    name: 'Dr. Fixit Fastflex Waterproofing Membrane',
    category: 'Chemicals' as const,
    brand: 'Dr. Fixit',
    grade: 'Elastomeric Polymer',
    description: '2-component polymer-modified waterproofing membrane for submerged structures and podiums.',
    basePrice: 2450,
    unit: 'Bucket (12kg)',
    hsnCode: '32149000',
    gstRate: 18,
    inStock: true,
    stockQuantity: 150,
    minOrderQuantity: 1,
  },
];

export class MaterialService {
  public static async getAllMaterials(filter: { category?: string; search?: string } = {}) {
    try {
      if (mongoose.connection.readyState === 1) {
        const query: Record<string, any> = {};
        if (filter.category && filter.category !== 'All' && filter.category !== 'all') {
          query.category = { $regex: filter.category, $options: 'i' };
        }
        if (filter.search) {
          query.name = { $regex: filter.search, $options: 'i' };
        }

        let materials = await Material.find(query).sort({ createdAt: -1 }).exec();

        // Auto-seed default materials if collection is completely empty
        if (materials.length === 0 && !filter.search && (!filter.category || filter.category === 'All')) {
          await this.seedDefaultMaterials();
          materials = await Material.find(query).sort({ createdAt: -1 }).exec();
        }

        if (materials && materials.length > 0) {
          return materials;
        }
      }
    } catch (err) {
      console.warn('Fallback to default materials catalogue:', err);
    }

    // Filter in-memory catalogue
    return DEFAULT_MATERIALS.filter((m) => {
      if (filter.category && filter.category !== 'All' && filter.category !== 'all') {
        if (m.category.toLowerCase() !== filter.category.toLowerCase()) return false;
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        if (!m.name.toLowerCase().includes(s) && !m.description.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }

  public static async getMaterialById(id: string) {
    try {
      if (mongoose.connection.readyState === 1) {
        const material = await Material.findById(id).exec();
        if (material) return material;
      }
    } catch (err) {
      // fallback
    }
    return DEFAULT_MATERIALS.find((m: any) => m._id === id || m.name === id) || null;
  }

  public static async createMaterial(data: Partial<IMaterial>) {
    try {
      if (mongoose.connection.readyState === 1) {
        const material = new Material(data);
        return await material.save();
      }
    } catch (err) {
      // fallback
    }
    const newMat = { _id: `mat_${Date.now()}`, ...data };
    DEFAULT_MATERIALS.push(newMat as any);
    return newMat;
  }

  public static async seedDefaultMaterials() {
    try {
      if (mongoose.connection.readyState === 1) {
        const count = await Material.countDocuments().exec();
        if (count === 0) {
          await Material.insertMany(DEFAULT_MATERIALS as any[]);
          console.log('🌱 Seeded default Urbanico construction materials successfully.');
        }
      }
    } catch (err: any) {
      console.error('Error seeding default materials:', err.message);
    }
  }
}

