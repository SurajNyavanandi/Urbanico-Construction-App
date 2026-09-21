import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'urbanico_jwt_auth_secret_production_2026_key';

export interface AuthUserPayload {
  id: string;
  phone: string;
  name?: string;
  role: 'contractor' | 'engineer' | 'supervisor' | 'client' | 'admin';
  permissions: string[];
  avatarUrl?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

/**
 * Standard base64url encode
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Standard base64url decode
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Generate HMAC-SHA256 signed JSON Web Token
 */
export function generateAuthToken(user: {
  _id?: any;
  id?: string;
  phone: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
}): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const role = (user.role || 'contractor') as AuthUserPayload['role'];
  const permissions = getPermissionsForRole(role);

  const payload: AuthUserPayload = {
    id: String(user._id || user.id || `usr_${Date.now()}`),
    phone: user.phone,
    name: user.name || 'Site Incharge',
    role,
    permissions,
    avatarUrl: user.avatarUrl || 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days session
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

/**
 * Verify and decode JSON Web Token
 */
export function verifyAuthToken(token: string): AuthUserPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      console.warn('[Auth] Invalid token signature');
      return null;
    }

    const payload: AuthUserPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      console.warn('[Auth] Token expired');
      return null;
    }

    return payload;
  } catch (err) {
    console.warn('[Auth] Token verification error:', err);
    return null;
  }
}

/**
 * Role-Based Access Control (RBAC) permissions map
 */
export function getPermissionsForRole(role: string): string[] {
  switch (role) {
    case 'admin':
      return [
        'order:create',
        'order:read',
        'order:update',
        'order:delete',
        'user:read',
        'user:update',
        'user:manage',
        'inventory:manage',
        'delivery:assign',
        'payment:verify',
        'payment:refund',
        'credit:approve',
      ];
    case 'engineer':
    case 'contractor':
      return [
        'order:create',
        'order:read',
        'profile:read',
        'profile:update',
        'delivery:track',
        'payment:initiate',
        'credit:request',
        'invoice:download',
      ];
    case 'supervisor':
      return [
        'order:read',
        'delivery:track',
        'delivery:accept',
        'otp:verify',
        'profile:read',
      ];
    default:
      return [
        'order:create',
        'order:read',
        'profile:read',
        'profile:update',
        'delivery:track',
        'payment:initiate',
      ];
  }
}

/**
 * Express Middleware: Authenticate Bearer Token
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const decoded = verifyAuthToken(token);

  if (decoded) {
    req.user = decoded;
  }

  return next();
}

/**
 * Express Middleware: Require Authentication (401 if unauthenticated)
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required. Please sign in with OTP 261125.',
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const decoded = verifyAuthToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please re-authenticate.',
    });
  }

  req.user = decoded;
  return next();
}

/**
 * Express Middleware: Require Specific Role (403 if unauthorized)
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] role. Your role is '${req.user.role}'.`,
      });
    }

    return next();
  };
}
