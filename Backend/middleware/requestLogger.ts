import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight HTTP Request Performance Logger Middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/@') && !req.path.includes('.')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl || req.path} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
}
