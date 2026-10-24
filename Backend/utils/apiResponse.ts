import { Request, Response, NextFunction } from 'express';
import { PAGINATION } from '../config/constants';

/**
 * Standard API Response and Error utilities for Urbanico Backend.
 * Eliminates repetitive try-catch blocks and ensures consistent JSON responses across all controllers.
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
 * Reusable helper to safely extract and bound pagination parameters from request queries
 */
export function parsePagination(query: any = {}) {
  const rawLimit = Number(query.limit);
  const rawPage = Number(query.page);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, isNaN(rawLimit) ? PAGINATION.DEFAULT_LIMIT : rawLimit)
  );
  const page = Math.max(1, isNaN(rawPage) ? PAGINATION.DEFAULT_PAGE : rawPage);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
}

/**
 * Sends a successful JSON response with uniform shape.
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
    message,
    statusCode,
    ...(details !== undefined ? { details } : {}),
  };

  return res.status(statusCode).json(payload);
}

/**
 * Higher-order controller wrapper that eliminates try-catch boilerplate in Express route handlers.
 * Any unhandled promise rejection or error is automatically caught and forwarded to the central error handler or sendError.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
