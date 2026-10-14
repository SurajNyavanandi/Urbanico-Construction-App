import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Structured Request Logger & Correlation ID Middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Correlation Request ID
  const incomingId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
  const requestId = incomingId && typeof incomingId === 'string' && incomingId.length <= 64
    ? incomingId
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isAsset = req.path.startsWith('/@') || req.path.includes('.') || req.path.startsWith('/node_modules');

    if (isAsset) {
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const logData = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logData));
    } else {
      console.log(`[HTTP ${logData.statusCode}] ${logData.method} ${logData.path} (${duration}ms) [ID: ${requestId.slice(0, 8)}]`);
    }
  });

  next();
}

export default requestLogger;
