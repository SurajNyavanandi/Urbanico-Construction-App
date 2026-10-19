import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

/**
 * In-memory sliding window rate limiter middleware with custom key generator
 */
export function createRateLimiter(options: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
} = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 600;
  const message = options.message || 'Too many requests. Please try again shortly.';
  const store: RateLimitStore = {};

  // Periodically clean up stale rate limit entries to avoid memory leaks
  const gcInterval = setInterval(() => {
    const now = Date.now();
    for (const k of Object.keys(store)) {
      if (store[k].resetAt < now) {
        delete store[k];
      }
    }
  }, 120_000);
  if (gcInterval && typeof gcInterval.unref === 'function') {
    gcInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply rate limiting to API endpoints, never static assets or Vite internals
    const isApiRequest =
      req.path.startsWith('/api') ||
      req.path.startsWith('/razorpay') ||
      req.path.startsWith('/payments') ||
      req.path.startsWith('/create-order') ||
      req.path.startsWith('/verify-payment') ||
      req.path.startsWith('/otp');

    if (!isApiRequest || req.path.startsWith('/@') || req.path.includes('.') || req.path.startsWith('/node_modules')) {
      return next();
    }

    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : (req.ip || req.socket.remoteAddress || 'unknown');

    const now = Date.now();

    if (!store[key] || now > store[key].resetAt) {
      store[key] = { count: 1, resetAt: now + windowMs };
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetAt / 1000));
      return next();
    }

    store[key].count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetAt / 1000));

    if (store[key].count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((store[key].resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        message,
        retryAfterSeconds,
      });
    }

    next();
  };
}

// 1. General API Rate Limiter: 180 requests per minute
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 180,
  message: 'High traffic volume detected. Please wait a moment before trying again.',
});

// 2. Strict OTP Generation Rate Limiter: max 5 requests per 10 minutes per IP/Phone
export const otpSendRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  keyGenerator: (req) => {
    const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, '').slice(-10) : '';
    const ip = req.ip || req.socket.remoteAddress || 'ip';
    return `otp_send_${phone || ip}`;
  },
  message: 'Too many OTP requests for this number. Please wait 10 minutes before requesting another OTP.',
});

// 3. Strict OTP Verification Rate Limiter: max 10 attempts per 10 minutes per IP/Phone
export const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req) => {
    const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, '').slice(-10) : '';
    const ip = req.ip || req.socket.remoteAddress || 'ip';
    return `otp_verify_${phone || ip}`;
  },
  message: 'Too many verification attempts. Please wait 10 minutes before trying again.',
});

// 4. Order Creation / Payment Checkout Rate Limiter: max 30 order creations per minute
export const orderCreateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Order creation rate exceeded. Please complete your pending order or wait a minute.',
});

/**
 * 5. Request Timeout Middleware (15 seconds default)
 * Prevents hanging connections from hogging socket pools
 */
export function requestTimeout(timeoutMs = 15000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip static assets and Vite internal endpoints
    if (req.path.startsWith('/@') || req.path.includes('.') || req.path.startsWith('/node_modules')) {
      return next();
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`[Timeout] ${req.method} ${req.originalUrl || req.path} exceeded ${timeoutMs}ms limit`);
        res.status(504).json({
          success: false,
          error: 'Gateway timeout: Request processing took too long',
          message: 'Gateway timeout: Request processing took too long',
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

/**
 * 6. Admin Mutation Rate Limiter: max 30 mutations per minute per Admin IP/User
 * Protects admin CRUD endpoints against brute force, fuzzing, and automated tampering.
 */
export const adminMutationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyGenerator: (req) => {
    const user = (req as any).user;
    const ip = req.ip || req.socket.remoteAddress || 'ip';
    return `admin_mut_${user?.email || user?.id || ip}`;
  },
  message: 'Admin rate limit exceeded. Please wait 1 minute before submitting more modifications.',
});

