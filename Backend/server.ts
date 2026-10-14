import path from 'path';
import dotenv from 'dotenv';

// Load .env from current directory and parent directory (single common .env at project root)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import express from 'express';
import cors from 'cors';

import { connectDB, getDBStatus, disconnectDB } from './config/db';
import { apiRouter } from './routers';
import { DatabaseSeeder } from './services/databaseSeeder';
import { envConfig } from './config/env';
import { paymentRouter } from './routers/paymentRouter';
import { PaymentController } from './controllers/paymentController';
import {
  errorHandler,
  requestLogger,
  apiRateLimiter,
  requestTimeout,
  mongoSanitizeMiddleware,
} from './middleware';

const app = express();
const PORT = envConfig.PORT;

// Trust proxy for reverse proxy architectures (Cloud Run, Render, ALB, Nginx)
// Ensures req.ip and rate limiters reflect true client IP
app.set('trust proxy', 1);

// 1. Comprehensive HTTP Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=(self "https://checkout.razorpay.com")');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; frame-src 'self' https://api.razorpay.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://*.run.app https://api.razorpay.com;"
    );
  }
  next();
});

// 2. Structured Request Logger & 15-Second Request Timeout
app.use(requestLogger);
app.use(requestTimeout(envConfig.REQUEST_TIMEOUT_MS));
app.use(apiRateLimiter);

// 3. Raw body preservation for cryptographically strict Razorpay webhook verification
app.use(
  express.json({
    limit: envConfig.BODY_LIMIT,
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: envConfig.BODY_LIMIT }));

// 4. NoSQL injection & prototype pollution defense middleware
app.use(mongoSanitizeMiddleware);


// CORS middleware configured strictly from process.env.CORS_ORIGIN
const configuredCorsOrigin = process.env.CORS_ORIGIN?.trim();
const allowedOrigins = configuredCorsOrigin
  ? configuredCorsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

function isOriginAllowed(origin: string): boolean {
  const isProduction = process.env.NODE_ENV === 'production';

  // Allow non-browser requests (native mobile apps, server-to-server, curl)
  if (!origin) return true;

  // In production, wildcard '*' with credentials is strictly disallowed by browser standards
  if (configuredCorsOrigin === '*' || allowedOrigins.includes('*')) {
    if (!isProduction) return true;
    console.warn('[CORS] Wildcard origin (*) is disallowed in production mode with credentials.');
    return false;
  }

  // Exact origin match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Wildcard pattern matching (e.g., https://*.run.app or *.run.app)
  for (const pattern of allowedOrigins) {
    if (pattern.includes('*')) {
      const regexStr = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*') + '$';
      if (new RegExp(regexStr).test(origin)) {
        return true;
      }
    }
  }

  // Non-production & preview environments (e.g. Cloud Run preview, localhost, 127.0.0.1)
  if (!isProduction) {
    if (origin.endsWith('.run.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true;
    }
  }

  return false;
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (mobile native, server-to-server, curl)
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    // Disallow CORS headers cleanly without throwing 500 internal server error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-admin-secret', 'x-razorpay-signature', 'idempotency-key']
}));

// Route mappings
app.use('/api', apiRouter);
app.use('/razorpay', paymentRouter);
app.use('/payments', paymentRouter);

// Flat aliases for backwards compatibility with existing frontend calls
app.get('/api/razorpay/config', PaymentController.getConfig);
app.get('/razorpay/config', PaymentController.getConfig);
app.get('/api/payments/config', PaymentController.getConfig);
app.post('/create-order', PaymentController.createOrder);
app.post('/verify-payment', PaymentController.verifyPayment);
app.post('/api/payments/webhook', PaymentController.handleWebhook);
app.post('/payments/webhook', PaymentController.handleWebhook);
app.post('/send-invoice', (req, res, next) => { req.url = '/send-invoice'; apiRouter(req, res, next); });
app.post('/otp/send', (req, res, next) => { req.url = '/otp/send'; apiRouter(req, res, next); });
app.post('/otp/verify', (req, res, next) => { req.url = '/otp/verify'; apiRouter(req, res, next); });

app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    success: true,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    memory: {
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
    },
  });
});

app.use(errorHandler);

// Global process-level safety handlers to prevent unhandled node process death
process.on('unhandledRejection', (reason: any, promise) => {
  console.error('[Process Safety] Unhandled Promise Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Process Safety] Uncaught Exception:', err.message, err.stack);
});

export async function startServer() {
  // Production Readiness Environment Variable Audit
  const envAudit = [
    { key: 'MONGODB_URI', configured: Boolean(process.env.MONGODB_URI) },
    { key: 'JWT_SECRET', configured: Boolean(process.env.JWT_SECRET) },
    { key: 'RAZORPAY_KEY_ID', configured: Boolean(process.env.RAZORPAY_KEY_ID) },
    { key: 'RAZORPAY_KEY_SECRET', configured: Boolean(process.env.RAZORPAY_KEY_SECRET) },
    { key: 'RESEND_API_KEY', configured: Boolean(process.env.RESEND_API_KEY) },
    { key: 'MSG91_AUTH_KEY', configured: Boolean(process.env.MSG91_AUTH_KEY) },
  ];

  console.log('[Urbanico Backend] Production Environment Audit:');
  envAudit.forEach((item) => {
    const symbol = item.configured ? '✅' : '⚠️ ';
    console.log(`  ${symbol} ${item.key}: ${item.configured ? 'Configured' : 'Not set (sandbox/fallback active)'}`);
  });

  // Fail-fast bootstrap guard for production release
  if (process.env.NODE_ENV === 'production') {
    const missingCritical: string[] = [];
    if (!process.env.MONGODB_URI) missingCritical.push('MONGODB_URI');
    if (!process.env.JWT_SECRET) missingCritical.push('JWT_SECRET');
    if (missingCritical.length > 0) {
      console.error(`[FATAL] Missing required production environment variables: ${missingCritical.join(', ')}`);
      console.error('[FATAL] Aborting server boot. Please configure environment variables in your production environment.');
      process.exit(1);
    }
  }

  connectDB()
    .then(async (conn) => {
      if (conn) {
        try {
          await DatabaseSeeder.seedAll();
        } catch (err) {
          console.warn('[DB] Master Seeding issue:', err);
        }
      }
    })
    .catch((err) => console.error('DB connect error:', err));

  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {}
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api') || req.path.startsWith('/razorpay') || req.path.startsWith('/payments')) {
        return res.status(404).json({
          success: false,
          error: 'Endpoint not found',
          message: 'Endpoint not found',
          statusCode: 404,
        });
      }
      res.sendFile(indexPath, (err) => {
        if (err) res.json({ status: 'online', service: 'Urbanico Backend' });
      });
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Urbanico] Server running on http://0.0.0.0:${PORT} (PID ${process.pid})`);
  });

  // Graceful shutdown handling (SIGTERM & SIGINT)
  const gracefulShutdown = (signal: string) => {
    console.log(`[Urbanico] ${signal} signal received. Closing HTTP server gracefully...`);
    server.close(async () => {
      console.log('[Urbanico] HTTP server closed.');
      try {
        await disconnectDB();
      } catch (err) {
        console.warn('[Urbanico] DB disconnect error during shutdown:', err);
      }
      console.log('[Urbanico] Process terminated cleanly.');
      process.exit(0);
    });

    // Force terminate after 10s if sockets remain unclosed
    setTimeout(() => {
      console.error('[Urbanico] Forceful shutdown initiated after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}

export { app };
export default app;
