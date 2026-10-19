import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

function resolveJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret) {
    return envSecret;
  }
  // If not configured, generate an ephemeral cryptographic secret for this runtime process
  return crypto.randomBytes(48).toString('hex');
}

const JWT_SECRET = resolveJwtSecret();

export interface AuthUserPayload {
  id: string;
  phone: string;
  name?: string;
  email?: string;
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
  email?: string;
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
    email: user.email,
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

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
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
      error: 'Authentication token required. Please sign in to continue.',
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

/**
 * Express Middleware: Require Admin Secret (for sensitive operations like purge)
 * Uses constant-time cryptographic equality to prevent timing attacks.
 */
export function requireAdminSecret(req: Request, res: Response, next: NextFunction) {
  const secretHeader = (req.headers['x-admin-secret'] as string) || (req.query.admin_secret as string) || (req.body?.adminSecret as string);
  const configuredSecret = process.env.ADMIN_API_SECRET;

  if (process.env.NODE_ENV === 'production' && !configuredSecret) {
    return res.status(403).json({
      success: false,
      error: 'Administrative purge operations are disabled in production mode.',
      message: 'Administrative purge operations are disabled in production mode.',
    });
  }

  if (configuredSecret) {
    if (!secretHeader) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Missing admin authorization secret.',
        message: 'Unauthorized: Missing admin authorization secret.',
      });
    }

    const secretBuf = Buffer.from(secretHeader);
    const confBuf = Buffer.from(configuredSecret);
    const isValid = secretBuf.length === confBuf.length && crypto.timingSafeEqual(secretBuf, confBuf);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Invalid admin authorization secret.',
        message: 'Unauthorized: Invalid admin authorization secret.',
      });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized.',
      message: 'Unauthorized.',
    });
  }

  return next();
}

/**
 * Express Middleware: Require Admin Role (via JWT) OR Admin Secret Header
 */
export function requireAdminOrSecret(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  const secretHeader = (req.headers['x-admin-secret'] as string) || (req.query.admin_secret as string) || (req.body?.adminSecret as string);
  const configuredSecret = process.env.ADMIN_API_SECRET;

  if (configuredSecret && secretHeader) {
    const secretBuf = Buffer.from(secretHeader);
    const confBuf = Buffer.from(configuredSecret);
    if (secretBuf.length === confBuf.length && crypto.timingSafeEqual(secretBuf, confBuf)) {
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden: Requires admin privileges or valid admin secret.',
    message: 'Forbidden: Requires admin privileges or valid admin secret.',
  });
}

/**
 * Hardened Express Middleware: Require Verified Admin
 * 1. Validates cryptographically signed JWT token (req.user).
 * 2. Compares user.email against the ADMIN_EMAILS allowlist from process.env.
 * 3. Or validates constant-time ADMIN_API_SECRET header (x-admin-secret).
 * 4. Never trusts client-supplied body flags (e.g., isAdmin: true).
 * 5. Returns explicit 401 Unauthorized if unauthenticated, 403 Forbidden if not in allowlist.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // 1. Timing-safe comparison for ADMIN_API_SECRET header
  const secretHeader = req.headers['x-admin-secret'] as string;
  const configuredSecret = process.env.ADMIN_API_SECRET?.trim();
  if (configuredSecret && secretHeader) {
    const secretBuf = Buffer.from(secretHeader);
    const confBuf = Buffer.from(configuredSecret);
    if (secretBuf.length === confBuf.length && crypto.timingSafeEqual(secretBuf, confBuf)) {
      return next();
    }
  }

  // 2. Verified JWT Bearer token check
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required. Please provide a valid Bearer token.',
      message: 'Unauthorized: Authentication required.',
    });
  }

  // 3. Environment-based Admin Allowlist check
  const adminEmailsRaw = (process.env.ADMIN_EMAILS || 'admin@urbanico.in,kanukulashekhar15@gmail.com').trim();
  const allowedAdminEmails = adminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  let userEmail = req.user.email?.trim().toLowerCase();

  // If email is not in the JWT payload, look up user in DB
  if (!userEmail && (req.user.id || req.user.phone)) {
    try {
      const { User } = await import('../models/User');
      const dbUser = await User.findOne({
        $or: [{ _id: req.user.id }, { phone: req.user.phone }],
      }).select('email role');
      if (dbUser?.email) {
        userEmail = dbUser.email.trim().toLowerCase();
        req.user.email = userEmail;
      }
      if (dbUser?.role === 'admin') {
        req.user.role = 'admin';
      }
    } catch (e) {
      console.warn('[requireAdmin] DB user lookup fallback error:', e);
    }
  }

  const isEmailAllowed = Boolean(userEmail && allowedAdminEmails.includes(userEmail));
  const isRoleAdmin = req.user.role === 'admin';

  if (!isEmailAllowed && !isRoleAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Administrative privileges required. Your account is not authorized.',
      message: 'Forbidden: Administrative privileges required.',
    });
  }

  return next();
}


