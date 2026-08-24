import { Request, Response } from 'express';
import { MaterialService } from '../services/materialService';

export class MaterialController {
  public static async getMaterials(req: Request, res: Response) {
    try {
      const { category, search } = req.query;
      const materials = await MaterialService.getAllMaterials({
        category: category as string,
        search: search as string,
      });
      return res.status(200).json({
        success: true,
        count: materials.length,
        materials,
      });
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch materials',
      });
    }
  }

  public static async getMaterialById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const material = await MaterialService.getMaterialById(id);
      if (!material) {
        return res.status(404).json({ success: false, error: 'Material not found' });
      }
      return res.status(200).json({ success: true, material });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async createMaterial(req: Request, res: Response) {
    try {
      const material = await MaterialService.createMaterial(req.body);
      return res.status(201).json({
        success: true,
        material,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
