import { Request, Response, NextFunction } from 'express';
import { diagnoseError } from '../utils/errorDiagnostics';

/**
 * Standardized Central Error Handling Middleware
 * - Preserves exact API response envelope shapes.
 * - Enriches res.locals with error diagnosis and stack for the central logger.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || undefined;

  // 1. Malformed JSON Body
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body';
  }

  // 2. Mongoose Validation Error
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Database validation failed';
    const fieldErrors: Record<string, string> = {};
    for (const key of Object.keys(err.errors)) {
      fieldErrors[key] = err.errors[key].message || 'Invalid value';
    }
    details = fieldErrors;
  }

  // 3. Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': ${err.value}`;
  }

  // 4. MongoDB Duplicate Key Error (Code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `A resource with that ${duplicatedField} already exists.`;
  }

  // 5. JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please sign in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired. Please sign in again.';
  }

  // Attach error metadata for requestLogger on finish
  res.locals.recordedError = err;
  res.locals.errorMessage = message;

  // In production, suppress raw 500 internal stack traces from client response
  const safeMessage = isProduction && statusCode === 500
    ? 'An unexpected internal error occurred. Please try again later.'
    : message;

  return res.status(statusCode).json({
    success: false,
    error: safeMessage,
    message: safeMessage,
    statusCode,
    ...(details !== undefined ? { details } : {}),
    ...(!isProduction && err.stack ? { stack: err.stack } : {}),
  });
}

/**
 * Shared 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response) {
  const message = `Endpoint not found: ${req.method} ${req.originalUrl || req.path}`;
  res.locals.errorMessage = message;

  return res.status(404).json({
    success: false,
    error: message,
    message,
    statusCode: 404,
  });
}

export default errorHandler;
