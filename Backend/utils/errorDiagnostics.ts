import { Request } from 'express';

export interface ErrorDiagnosis {
  category: 'CORS' | 'DATABASE' | 'VALIDATION' | 'AUTH' | 'NETWORK' | 'NOT_FOUND' | 'RATE_LIMIT' | 'SYSTEM';
  rootCause: string;
  remedy: string;
  fileLocation?: string;
}

/**
 * Parses the top application stack frame to extract the exact file and line number.
 */
export function extractErrorLocation(stack?: string): string | undefined {
  if (!stack) return undefined;
  const lines = stack.split('\n');
  for (const line of lines.slice(1)) {
    // Exclude internal node or node_modules frames
    if (line.includes('node_modules') || line.includes('node:internal') || line.includes('node:events')) {
      continue;
    }
    const match = line.match(/\((.*?)\)/) || line.match(/at (.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return lines[1]?.trim();
}

/**
 * Deeply sanitizes sensitive headers and request body keys
 */
export function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sensitiveKeywords = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-admin-secret',
    'x-razorpay-signature',
    'password',
    'token',
    'jwt',
    'secret',
    'key_secret',
    'razorpay_key_secret',
    'otp',
    'pin',
  ];

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeywords.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '***MASKED***';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Diagnoses the root cause of an error with actionable remedy advice
 */
export function diagnoseError(err: any, req?: Request, statusCode: number = 500): ErrorDiagnosis {
  const msg = (err?.message || String(err || '')).toLowerCase();
  const name = err?.name || '';
  const code = err?.code || '';
  const fileLocation = extractErrorLocation(err?.stack);

  // 1. CORS origin violations
  if (msg.includes('cors') || msg.includes('origin') || msg.includes('access-control')) {
    const origin = req?.headers?.origin || req?.headers?.referer || 'unknown';
    return {
      category: 'CORS',
      rootCause: `CORS policy rejected request from origin '${origin}'. Allowed origins: ${process.env.CORS_ORIGIN || 'urbanico.vercel.app, *.vercel.app, *.onrender.com'}`,
      remedy: 'Verify frontend URL in Backend/server.ts isOriginAllowed() or set CORS_ORIGIN environment variable on Render.',
      fileLocation,
    };
  }

  // 2. Database Connection / Network / Atlas
  if (
    name === 'MongoNetworkError' ||
    name === 'MongooseServerSelectionError' ||
    msg.includes('buffering timed out') ||
    msg.includes('econnrefused') ||
    msg.includes('ip') && msg.includes('whitelist')
  ) {
    return {
      category: 'DATABASE',
      rootCause: 'MongoDB Atlas is unreachable or IP access list (0.0.0.0/0) is not configured in Atlas Network Access.',
      remedy: 'Check MONGODB_URI in Render dashboard and ensure Network Access permits 0.0.0.0/0 (Allow from Anywhere).',
      fileLocation,
    };
  }

  // 3. Mongoose Validation
  if (name === 'ValidationError' || msg.includes('validation failed')) {
    const fields = err?.errors ? Object.keys(err.errors).join(', ') : 'unknown';
    return {
      category: 'VALIDATION',
      rootCause: `Mongoose schema validation failed for fields: [${fields}]. Missing required fields or incorrect data types.`,
      remedy: 'Compare client payload against Mongoose model definitions in Backend/models/.',
      fileLocation,
    };
  }

  // 4. Mongoose Cast Error (Invalid ObjectId)
  if (name === 'CastError') {
    return {
      category: 'VALIDATION',
      rootCause: `Invalid format for field '${err?.path}': expected valid MongoDB ObjectId or type, received '${err?.value}'.`,
      remedy: 'Ensure client sends 24-character hexadecimal ObjectId or handle custom identifier strings correctly.',
      fileLocation,
    };
  }

  // 5. Duplicate Unique Key (Code 11000)
  if (code === 11000 || msg.includes('e11000') || msg.includes('duplicate key')) {
    const key = Object.keys(err?.keyPattern || err?.keyValue || {})[0] || 'field';
    return {
      category: 'DATABASE',
      rootCause: `Unique constraint violated on field '${key}'. A record with this value already exists in MongoDB.`,
      remedy: 'Handle existing records with upsert: true or prompt the user for unique input.',
      fileLocation,
    };
  }

  // 6. Malformed JSON Body
  if (err instanceof SyntaxError && 'body' in err) {
    return {
      category: 'VALIDATION',
      rootCause: 'Malformed JSON payload in HTTP request body.',
      remedy: 'Validate JSON syntax in client request body before dispatching.',
      fileLocation,
    };
  }

  // 7. JWT Authentication
  if (name === 'JsonWebTokenError' || name === 'TokenExpiredError' || statusCode === 401) {
    return {
      category: 'AUTH',
      rootCause: name === 'TokenExpiredError' ? 'JWT session token has expired.' : 'Missing or invalid JWT token in Authorization header.',
      remedy: 'Prompt user to log in again with OTP to obtain a fresh JWT Bearer token.',
      fileLocation,
    };
  }

  // 8. Route Not Found
  if (statusCode === 404) {
    return {
      category: 'NOT_FOUND',
      rootCause: `Endpoint '${req?.method || 'GET'} ${req?.originalUrl || req?.path || 'unknown'}' is not registered on this server.`,
      remedy: 'Verify the route path in Backend/routers/index.ts and ensure correct API prefix in frontend client.',
      fileLocation,
    };
  }

  // 9. Rate Limit Exceeded
  if (statusCode === 429 || msg.includes('rate limit')) {
    return {
      category: 'RATE_LIMIT',
      rootCause: 'Client IP has exceeded sliding-window API rate limit threshold.',
      remedy: 'Wait for rate limit window to expire or increase maxRequests in Backend/middleware/rateLimiter.ts.',
      fileLocation,
    };
  }

  // 10. General System / Internal Error
  return {
    category: statusCode >= 500 ? 'SYSTEM' : 'VALIDATION',
    rootCause: err?.message || 'Unexpected server error',
    remedy: 'Check the error stack trace and application error location below.',
    fileLocation,
  };
}
