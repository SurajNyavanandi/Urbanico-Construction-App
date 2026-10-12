import { Request, Response, NextFunction } from 'express';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeObject(target: any): any {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeObject(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    // 1. Prototype pollution protection
    if (FORBIDDEN_KEYS.has(key)) {
      delete target[key];
      continue;
    }

    // 2. MongoDB operator injection protection ($ prefix or dot in query keys)
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
      continue;
    }

    target[key] = sanitizeObject(target[key]);
  }

  return target;
}

/**
 * MongoDB NoSQL injection & prototype pollution defense middleware
 */
export function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  next();
}

export default mongoSanitizeMiddleware;
