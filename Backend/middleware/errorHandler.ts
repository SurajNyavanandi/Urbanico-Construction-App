import { Request, Response, NextFunction } from 'express';

/**
 * Standardized Global Error Handling Middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Malformed JSON payload', message: 'Malformed JSON payload' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, suppress raw database driver errors, replica-set hostnames and internal traces
  const safeMessage = isProduction && statusCode === 500
    ? 'An unexpected internal error occurred. Please try again later.'
    : (err.message || 'Internal server error');

  console.error(`[Error] ${req.method} ${req.originalUrl || req.path} (${statusCode}):`, err.message);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    error: safeMessage,
    message: safeMessage,
    statusCode,
    ...(err.details ? { details: err.details } : {}),
    ...(!isProduction && { stack: err.stack }),
  });
}
