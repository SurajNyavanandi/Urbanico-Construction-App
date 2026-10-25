import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { diagnoseError, sanitizeData } from '../utils/errorDiagnostics';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * High-Visibility Error-Only Request Logger Middleware
 * - Completely silences 2xx and 3xx successful responses (zero log clutter).
 * - Emits a single structured, high-visibility JSON block for 4xx and 5xx errors
 *   with exact root cause diagnosis, file location, sanitized headers, and body.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const incomingId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
  const requestId = incomingId && typeof incomingId === 'string' && incomingId.length <= 64
    ? incomingId
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    // 1. Completely silence successful HTTP responses (2xx, 3xx)
    if (res.statusCode < 400) {
      return;
    }

    const duration = Date.now() - startTime;
    const isAsset = req.path.startsWith('/@') || req.path.includes('.') || req.path.startsWith('/node_modules');
    if (isAsset) {
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const origin = (req.headers['origin'] as string) || (req.headers['referer'] as string) || 'direct';

    const recordedError = res.locals.recordedError;
    const diagnosis = diagnoseError(recordedError || { message: res.locals.errorMessage || `HTTP ${res.statusCode}` }, req, res.statusCode);

    const errorPayload = {
      level: 'ERROR',
      tag: 'BACKEND_ERROR',
      timestamp: new Date().toISOString(),
      requestId,
      statusCode: res.statusCode,
      method: req.method,
      path: req.originalUrl || req.path,
      origin,
      ip,
      durationMs: duration,
      error: {
        name: recordedError?.name || (res.statusCode === 404 ? 'NotFoundError' : 'HttpError'),
        message: recordedError?.message || res.locals.errorMessage || `Request failed with status ${res.statusCode}`,
        rootCause: diagnosis.rootCause,
        remedy: diagnosis.remedy,
        fileLocation: diagnosis.fileLocation || undefined,
        stack: recordedError?.stack || undefined,
      },
      request: {
        headers: sanitizeData(req.headers),
        query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
        body: sanitizeData(req.body),
      },
    };

    console.error(
      `\n🚨 [BACKEND ERROR ${res.statusCode}] ${req.method} ${req.originalUrl || req.path}\n` +
      `   Root Cause: ${diagnosis.rootCause}\n` +
      (diagnosis.fileLocation ? `   Location:   ${diagnosis.fileLocation}\n` : '') +
      `   Origin:     ${origin} | IP: ${ip}\n` +
      JSON.stringify(errorPayload) + '\n'
    );
  });

  next();
}

export default requestLogger;
