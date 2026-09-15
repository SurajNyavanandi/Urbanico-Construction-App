import { Request, Response } from 'express';
import { MaterialService } from '../services/materialService';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';

export class MaterialController {
  public static getMaterials = asyncHandler(async (req: Request, res: Response) => {
    const { category, search } = req.query;
    const materials = await MaterialService.getAllMaterials({
      category: category as string,
      search: search as string,
    });
    return sendSuccess(res, { materials, count: materials.length });
  });

  // --- CATEGORIES ---
  public static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = MaterialService.getCategories();
    return sendSuccess(res, { categories, count: categories.length });
  });

  public static createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = MaterialService.createCategory(req.body);
    return sendSuccess(res, { category }, 'Category created successfully', 201);
  });

  public static updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const updated = MaterialService.updateCategory(id, req.body);
    if (!updated) {
      return sendError(res, 'Category not found', 404);
    }
    return sendSuccess(res, { category: updated }, 'Category and sub-categories updated successfully');
  });

  public static deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const deleted = MaterialService.deleteCategory(id);
    if (!deleted) {
      return sendError(res, 'Category not found to delete', 404);
    }
    return sendSuccess(res, { category: deleted }, 'Category deleted successfully');
  });

  // --- SERVICES ---
  public static getServices = asyncHandler(async (req: Request, res: Response) => {
    const services = MaterialService.getServices();
    return sendSuccess(res, { services, count: services.length });
  });

  public static createService = asyncHandler(async (req: Request, res: Response) => {
    const service = MaterialService.createService(req.body);
    return sendSuccess(res, { service }, 'Service created successfully', 201);
  });

  public static updateService = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const updated = MaterialService.updateService(id, req.body);
    if (!updated) {
      return sendError(res, 'Service not found', 404);
    }
    return sendSuccess(res, { service: updated }, 'Service updated successfully');
  });

  public static deleteService = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const deleted = MaterialService.deleteService(id);
    if (!deleted) {
      return sendError(res, 'Service not found to delete', 404);
    }
    return sendSuccess(res, { service: deleted }, 'Service deleted successfully');
  });

  // --- BUNDLES ---
  public static getProjectBundles = asyncHandler(async (req: Request, res: Response) => {
    const bundles = MaterialService.getProjectBundles();
    return sendSuccess(res, { bundles, count: bundles.length });
  });

  public static createProjectBundle = asyncHandler(async (req: Request, res: Response) => {
    const bundle = MaterialService.createProjectBundle(req.body);
    return sendSuccess(res, { bundle }, 'Project bundle created successfully', 201);
  });

  public static updateProjectBundle = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const updated = MaterialService.updateProjectBundle(id, req.body);
    if (!updated) {
      return sendError(res, 'Project bundle not found', 404);
    }
    return sendSuccess(res, { bundle: updated }, 'Project bundle updated successfully');
  });

  public static deleteProjectBundle = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const deleted = MaterialService.deleteProjectBundle(id);
    if (!deleted) {
      return sendError(res, 'Project bundle not found to delete', 404);
    }
    return sendSuccess(res, { bundle: deleted }, 'Project bundle deleted successfully');
  });

  // --- MATERIALS ---
  public static getMaterialById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const material = await MaterialService.getMaterialById(String(id));
    if (!material) {
      return sendError(res, 'Material not found', 404);
    }
    return sendSuccess(res, { material });
  });

  public static createMaterial = asyncHandler(async (req: Request, res: Response) => {
    const material = await MaterialService.createMaterial(req.body);
    return sendSuccess(res, { material }, 'Material created successfully', 201);
  });

  public static updateMaterial = asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) || '';
    const updated = await MaterialService.updateMaterial(id, req.body);
    if (!updated) {
      return sendError(res, 'Material not found to update', 404);
    }
    return sendSuccess(res, { material: updated }, 'Material updated successfully');
  });

  public static deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) || '';
    const deleted = await MaterialService.deleteMaterial(id);
    if (!deleted) {
      return sendError(res, 'Material not found to delete', 404);
    }
    return sendSuccess(res, { material: deleted }, 'Material deleted successfully');
  });
}
