import { Request, Response, NextFunction } from 'express';

interface IdempotentResponse {
  statusCode: number;
  body: any;
  timestamp: number;
}

class IdempotencyManager {
  private cache = new Map<string, IdempotentResponse>();
  private readonly ttlMs: number;

  constructor(ttlMs = 15 * 60 * 1000) {
    this.ttlMs = ttlMs;
    // Periodic garbage collector
    const gc = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.cache.entries()) {
        if (now - record.timestamp > this.ttlMs) {
          this.cache.delete(key);
        }
      }
    }, 60_000);
    if (gc && typeof gc.unref === 'function') {
      gc.unref();
    }
  }

  public get(key: string): IdempotentResponse | undefined {
    const record = this.cache.get(key);
    if (!record) return undefined;
    if (Date.now() - record.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    return record;
  }

  public set(key: string, statusCode: number, body: any): void {
    this.cache.set(key, {
      statusCode,
      body,
      timestamp: Date.now(),
    });
  }
}

export const idempotencyStore = new IdempotencyManager();

export function extractIdempotencyKey(req: Request): string | null {
  const headerKey =
    (req.headers['idempotency-key'] as string) ||
    (req.headers['x-idempotency-key'] as string);

  if (headerKey && typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }

  if (req.body && typeof req.body === 'object') {
    if (req.body.idempotencyKey && typeof req.body.idempotencyKey === 'string') {
      return req.body.idempotencyKey.trim();
    }
  }

  return null;
}
