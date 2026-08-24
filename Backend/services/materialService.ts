import { Material, IMaterial } from '../models/Material';

const DEFAULT_MATERIALS = [
  {
    name: 'UltraTech OPC 53 Grade Cement',
    category: 'Cement' as const,
    brand: 'UltraTech',
    grade: '53 Grade OPC',
    description: 'High-strength structural grade cement for multi-story load bearing elements & slabs.',
    basePrice: 385,
    unit: 'Bag (50kg)',
    gstRate: 28,
    inStock: true,
    stockQuantity: 4500,
    minOrderQuantity: 50,
  },
  {
    name: 'M-Sand (Manufactured Sand - Zone II)',
    category: 'Aggregates' as const,
    brand: 'Urbanico Premium Quarry',
    grade: 'Zone II (0-4.75mm)',
    description: 'Triple-washed manufactured sand with zero silt content for monolithic concrete mix.',
    basePrice: 1650,
    unit: 'Ton',
    gstRate: 5,
    inStock: true,
    stockQuantity: 1200,
    minOrderQuantity: 10,
  },
  {
    name: '20mm Blue Metal Granite Aggregates',
    category: 'Aggregates' as const,
    brand: 'Urbanico Quarries',
    grade: '20mm Crushed',
    description: 'Angular hard blue granite stone aggregates for RCC column and foundation pouring.',
    basePrice: 1450,
    unit: 'Ton',
    gstRate: 5,
    inStock: true,
    stockQuantity: 2500,
    minOrderQuantity: 10,
  },
  {
    name: 'Tata Tiscon Fe 550D TMT Rebars',
    category: 'Steel' as const,
    brand: 'Tata Tiscon',
    grade: 'Fe 550D Super Ductile',
    description: 'Earthquake-resistant thermo-mechanically treated rebars with superior elongation.',
    basePrice: 62500,
    unit: 'Ton',
    gstRate: 18,
    inStock: true,
    stockQuantity: 85,
    minOrderQuantity: 2,
  },
  {
    name: 'Wire Cut Clay Red Bricks (Class 1)',
    category: 'Bricks' as const,
    brand: 'Urbanico Kilns',
    grade: 'First Class Kiln-burnt',
    description: 'Uniform kiln-fired red clay bricks with >10.5 N/mm² compressive strength.',
    basePrice: 9.5,
    unit: 'Piece',
    gstRate: 12,
    inStock: true,
    stockQuantity: 65000,
    minOrderQuantity: 2000,
  },
  {
    name: 'Fosroc Conbextra GP2 Non-Shrink Grout',
    category: 'Chemicals' as const,
    brand: 'Fosroc',
    grade: 'Free-flow Grout',
    description: 'Precision non-shrink cementitious grout for heavy baseplates & column anchorage.',
    basePrice: 890,
    unit: 'Bag (25kg)',
    gstRate: 18,
    inStock: true,
    stockQuantity: 320,
    minOrderQuantity: 5,
  },
];

export class MaterialService {
  public static async getAllMaterials(filter: { category?: string; search?: string } = {}) {
    try {
      const query: Record<string, any> = {};
      if (filter.category && filter.category !== 'All') {
        query.category = filter.category;
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

      return materials;
    } catch (err) {
      console.warn('Fallback to default materials catalogue:', err);
      return DEFAULT_MATERIALS;
    }
  }

  public static async getMaterialById(id: string) {
    return await Material.findById(id).exec();
  }

  public static async createMaterial(data: Partial<IMaterial>) {
    const material = new Material(data);
    return await material.save();
  }

  public static async seedDefaultMaterials() {
    try {
      const count = await Material.countDocuments().exec();
      if (count === 0) {
        await Material.insertMany(DEFAULT_MATERIALS as any[]);
        console.log('🌱 Seeded default Urbanico construction materials successfully.');
      }
    } catch (err: any) {
      console.error('Error seeding default materials:', err.message);
    }
  }
}
