import { Request, Response } from 'express';
import { ServiceService } from '../services/serviceService';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';

export class ServiceController {
  public static getServices = asyncHandler(async (req: Request, res: Response) => {
    const services = await ServiceService.getAllServices();
    return sendSuccess(res, { services, count: services.length });
  });

  public static getServiceById = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const service = await ServiceService.getServiceById(id);
    if (!service) {
      return sendError(res, 'Service not found', 404);
    }
    return sendSuccess(res, { service });
  });

  public static createService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.createService(req.body);
    return sendSuccess(res, { service }, 'Service created successfully', 201);
  });

  public static updateService = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const updated = await ServiceService.updateService(id, req.body);
    if (!updated) {
      return sendError(res, 'Service not found', 404);
    }
    return sendSuccess(res, { service: updated }, 'Service updated successfully');
  });

  public static deleteService = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const deleted = await ServiceService.deleteService(id);
    if (!deleted) {
      return sendError(res, 'Service not found to delete', 404);
    }
    return sendSuccess(res, { service: deleted }, 'Service deleted successfully');
  });
}
