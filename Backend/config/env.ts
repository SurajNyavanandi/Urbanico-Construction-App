/**
 * Environment and Configuration Schema Validator
 * Validates, sanitizes, and exports typed configuration on server bootstrap.
 */

export interface AppConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  MONGODB_URI: string;
  JWT_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  ADMIN_API_SECRET: string;
  ADMIN_EMAILS: string[];
  CORS_ORIGIN: string;
  RESEND_API_KEY: string;
  MSG91_AUTH_KEY: string;
  BODY_LIMIT: string;
  REQUEST_TIMEOUT_MS: number;
}

export function validateEnvironment(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development').trim() as AppConfig['NODE_ENV'];
  const isProduction = nodeEnv === 'production';

  // AI Studio requires port 3000
  const PORT = 3000;

  const mongodbUri = (process.env.MONGODB_URI || '').trim();
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const adminSecret = (process.env.ADMIN_API_SECRET || '').trim();
  const corsOrigin = (process.env.CORS_ORIGIN || '').trim();
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const msg91AuthKey = (process.env.MSG91_AUTH_KEY || '').trim();
  const adminEmailsRaw = (process.env.ADMIN_EMAILS || 'admin@urbanico.in,kanukulashekhar15@gmail.com').trim();
  const adminEmails = adminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const missingProductionSecrets: string[] = [];
  if (isProduction) {
    if (!mongodbUri) missingProductionSecrets.push('MONGODB_URI');
    if (!jwtSecret || jwtSecret.length < 16) {
      missingProductionSecrets.push('JWT_SECRET (min 16 chars)');
    }
  }

  if (missingProductionSecrets.length > 0) {
    console.warn('[Config Warning] Recommended production configurations missing: ' + missingProductionSecrets.join(', '));
  }

  const config: AppConfig = {
    PORT,
    NODE_ENV: nodeEnv,
    MONGODB_URI: mongodbUri,
    JWT_SECRET: jwtSecret || 'dev_ephemeral_jwt_secret_token_urbanico_construction_2026',
    ADMIN_EMAILS: adminEmails,
    RAZORPAY_KEY_ID: razorpayKeyId,
    RAZORPAY_KEY_SECRET: razorpayKeySecret,
    ADMIN_API_SECRET: adminSecret,
    CORS_ORIGIN: corsOrigin,
    RESEND_API_KEY: resendApiKey,
    MSG91_AUTH_KEY: msg91AuthKey,
    BODY_LIMIT: '5mb',
    REQUEST_TIMEOUT_MS: 15000,
  };

  return config;
}

export const envConfig = validateEnvironment();
export default envConfig;
