import { Request, Response, NextFunction } from 'express';

/**
 * Standard API Response and Error utilities for Urbanico Backend.
 * Eliminates repetitive try-catch blocks and ensures consistent JSON responses across all controllers.
 * Designed to be clean and simple for beginners to understand.
 */

export interface ApiResponseOptions<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
  details?: any;
}

/**
 * Sends a successful JSON response with uniform shape.
 * 
 * @example
 * sendSuccess(res, { order }, 'Order placed successfully', 201);
 */
export function sendSuccess<T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200,
  extraMeta?: Record<string, any>
): Response {
  const payload: Record<string, any> = {
    success: true,
    ...(message ? { message } : {}),
    ...(extraMeta || {}),
  };

  // If data is an object, merge or assign cleanly
  if (data !== undefined) {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      Object.assign(payload, data);
    } else {
      payload.data = data;
    }
  }

  return res.status(statusCode).json(payload);
}

/**
 * Sends an error JSON response with uniform shape.
 * 
 * @example
 * sendError(res, 'Material not found', 404);
 */
export function sendError(
  res: Response,
  message: string = 'Internal server error',
  statusCode: number = 500,
  details?: any
): Response {
  const payload: Record<string, any> = {
    success: false,
    error: message,
    ...(details !== undefined ? { details } : {}),
  };

  return res.status(statusCode).json(payload);
}

/**
 * Higher-order controller wrapper that eliminates try-catch boilerplate in Express route handlers.
 * Any unhandled promise rejection or error is automatically caught and forwarded to sendError.
 * 
 * @example
 * export const getMaterials = asyncHandler(async (req, res) => {
 *   const materials = await MaterialService.getAllMaterials(req.query);
 *   return sendSuccess(res, { materials, count: materials.length });
 * });
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => {
      console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
      const statusCode = err.statusCode || err.status || 500;
      const message = err.message || 'An unexpected error occurred';
      return sendError(res, message, statusCode, err.errors || undefined);
    });
  };
}
