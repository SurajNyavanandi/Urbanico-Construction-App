import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

/**
 * Strict Schema for Creating a Construction Material
 */
export const createMaterialSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  title: z.string().trim().max(150).optional(),
  category: z.string().trim().min(2, 'Category is required').max(60),
  categoryId: z.string().trim().max(60).optional(),
  subCategory: z.string().trim().max(60).optional(),
  subtitle: z.string().trim().max(200).optional(),
  brand: z.string().trim().max(100).optional(),
  grade: z.string().trim().max(50).optional(),
  description: z.string().trim().max(2000).optional(),
  defaultPrice: z.number().nonnegative('Price cannot be negative'),
  basePrice: z.number().nonnegative('Base price cannot be negative').optional(),
  unit: z.string().trim().min(1, 'Unit is required').max(30),
  hsnCode: z.string().trim().max(20).optional(),
  gstRate: z.number().min(0).max(28).optional().default(18),
  inStock: z.boolean().optional().default(true),
  stockQuantity: z.number().int().nonnegative('Stock cannot be negative').optional().default(1000),
  minOrderQuantity: z.number().int().positive().optional().default(1),
  densityTonsPerUnit: z.number().positive().optional().default(1.0),
  labCertNo: z.string().trim().max(50).optional(),
  imageUrl: z.string().url().max(500).optional().or(z.literal('')),
  image: z.string().max(500).optional().or(z.literal('')),
  actionType: z.enum(['add_to_cart', 'get_quote']).optional().default('add_to_cart'),
  tag: z.string().trim().max(50).optional(),
  fastDispatch: z.boolean().optional().default(true),
  vendor: z.string().trim().max(100).optional().default('Urbanico Direct'),
});

/**
 * Strict Schema for Updating a Construction Material (All fields optional, mass-assignment blocked)
 */
export const updateMaterialSchema = createMaterialSchema.partial();

/**
 * Strict Schema for Creating a Service / Trade Partner listing
 */
export const createServiceSchema = z.object({
  name: z.string().trim().min(2, 'Service name must be at least 2 characters').max(150),
  title: z.string().trim().max(150).optional(),
  category: z.string().trim().max(60).optional().default('Trade Services'),
  subtitle: z.string().trim().max(200).optional(),
  rate: z.string().trim().min(1, 'Rate description is required').max(60),
  ratePerWorkerDay: z.number().positive('Daily rate must be a positive number').optional().default(850),
  minHeadcount: z.number().int().positive().optional().default(1),
  contractorName: z.string().trim().max(100).optional().default('Urbanico Verified Trade Partner'),
  rating: z.number().min(1).max(5).optional().default(4.9),
  description: z.string().trim().max(2000).optional(),
  image: z.string().max(500).optional(),
  tag: z.string().trim().max(50).optional(),
});

/**
 * Strict Schema for Updating a Service
 */
export const updateServiceSchema = createServiceSchema.partial();

/**
 * Express middleware to validate request body against a Zod schema
 * Automatically sanitizes against mass-assignment and rejects MongoDB operators
 */
export function validateAdminBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Block NoSQL operator injections in body keys (e.g. $where, $gt)
    const hasMongoOperator = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) return true;
        if (typeof obj[key] === 'object' && hasMongoOperator(obj[key])) return true;
      }
      return false;
    };

    if (hasMongoOperator(req.body)) {
      return sendError(res, 'Security violation: NoSQL operators are disallowed in payload', 400);
    }

    // 2. Parse and strip unknown properties (Mass-assignment defense)
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join('.') || 'body';
        formattedErrors[field] = err.message;
      });
      return sendError(res, 'Validation error: Invalid input data', 400, formattedErrors);
    }

    // Replace request body with strictly typed, sanitized, and whitelist-stripped data
    req.body = result.data;
    return next();
  };
}
