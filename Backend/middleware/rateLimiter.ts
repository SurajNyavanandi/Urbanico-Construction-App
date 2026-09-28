import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: { count: number; resetAt: number };
}

/**
 * In-memory sliding window rate limiter middleware for sensitive endpoints
 */
export function createRateLimiter(options: { windowMs?: number; maxRequests?: number } = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 600;
  const store: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply rate limiting to actual API / payment endpoints, never static assets or Vite internals
    const isApiRequest =
      req.path.startsWith('/api') ||
      req.path.startsWith('/razorpay') ||
      req.path.startsWith('/create-order') ||
      req.path.startsWith('/verify-payment');

    if (!isApiRequest || req.path.startsWith('/@') || req.path.includes('.') || req.path.startsWith('/node_modules')) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetAt) {
      store[ip] = { count: 1, resetAt: now + windowMs };
      return next();
    }

    store[ip].count += 1;
    if (store[ip].count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again shortly.',
      });
    }

    next();
  };
}
