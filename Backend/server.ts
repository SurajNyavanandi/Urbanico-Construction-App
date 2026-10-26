import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env from current directory and parent directory (single common .env at project root)
dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
} catch {}

import express from 'express';
import cors from 'cors';

import { connectDB, getDBStatus, disconnectDB } from './config/db';
import { apiRouter } from './routers';
import { DatabaseSeeder } from './services/databaseSeeder';
import { envConfig } from './config/env';
import { paymentRouter } from './routers/paymentRouter';
import { materialRouter } from './routers/materialRouter';
import { serviceRouter } from './routers/serviceRouter';
import { PaymentController } from './controllers/paymentController';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  apiRateLimiter,
  requestTimeout,
  mongoSanitizeMiddleware,
} from './middleware';
import { diagnoseError, extractErrorLocation } from './utils/errorDiagnostics';

const app = express();
const PORT = envConfig.PORT;

// Trust proxy for reverse proxy architectures (Cloud Run, Render, ALB, Nginx)
// Ensures req.ip and rate limiters reflect true client IP
app.set('trust proxy', 1);

// 1. Comprehensive HTTP Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow iframe embedding for AI Studio preview
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=(self "https://checkout.razorpay.com")');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' data: blob: https: 'unsafe-inline' 'unsafe-eval'; frame-src 'self' * data: blob:;"
    );
  }
  next();
});

// 2. CORS middleware configured from environment variables (process.env.CORS_ORIGIN or ALLOWED_ORIGINS)
// Automatically includes localhost, Render domains (*.onrender.com), Vercel domains (urbanico.vercel.app, *.vercel.app), and custom origins.
const rawOrigins =
  process.env.CORS_ORIGIN ||
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,https://urbanico.vercel.app,https://*.vercel.app,https://*.onrender.com';

const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  // Allow non-browser requests (native mobile apps, server-to-server, curl)
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/\/+$/, '');

  // Automatically allow urbanico.vercel.app and any Vercel domain (*.vercel.app)
  if (/^https?:\/\/[a-zA-Z0-9-.]+\.vercel\.app$/.test(normalizedOrigin)) {
    return true;
  }

  // Automatically allow any Render domain (*.onrender.com)
  if (/^https?:\/\/[a-zA-Z0-9-.]+\.onrender\.com$/.test(normalizedOrigin)) {
    return true;
  }

  // Automatically allow any AI Studio / Cloud Run preview domain
  if (/^https?:\/\/ais-(dev|pre)-[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.run\.app$/.test(normalizedOrigin)) {
    return true;
  }

  // Local development localhost / 127.0.0.1 with any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
    return true;
  }

  if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  // Wildcard pattern matching (e.g., https://*.onrender.com, https://*.vercel.app, exp://*)
  for (const pattern of allowedOrigins) {
    if (pattern.includes('*')) {
      const regexStr = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*') + '$';
      if (new RegExp(regexStr).test(normalizedOrigin)) {
        return true;
      }
    }
  }

  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'x-admin-secret',
    'x-razorpay-signature',
    'idempotency-key',
    'Idempotency-Key',
  ],
  exposedHeaders: ['Retry-After', 'Idempotency-Key'],
  maxAge: 86400,
};

// Enable CORS for all routes (automatically handles all OPTIONS preflights)
app.use(cors(corsOptions));

// 3. Structured Request Logger & Request Timeout
app.use(requestLogger);
app.use('/api', requestTimeout(envConfig.REQUEST_TIMEOUT_MS));
app.use('/api', apiRateLimiter);

// 4. Raw body preservation for cryptographically strict Razorpay webhook verification
app.use(
  express.json({
    limit: envConfig.BODY_LIMIT,
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: envConfig.BODY_LIMIT }));

// 5. NoSQL injection & prototype pollution defense middleware
app.use(mongoSanitizeMiddleware);

// Canonical API route mappings
app.use('/api', apiRouter);
app.use('/api/payments', paymentRouter);
app.use('/payments', paymentRouter);
app.use('/razorpay', paymentRouter);
app.use('/materials', materialRouter);
app.use('/services', serviceRouter);
app.use('/categories', (req, res, next) => {
  req.url = '/categories' + (req.url === '/' ? '' : req.url);
  materialRouter(req, res, next);
});
app.use('/bundles', (req, res, next) => {
  req.url = '/bundles' + (req.url === '/' ? '' : req.url);
  materialRouter(req, res, next);
});

// Legacy flat endpoint compatibility
app.post('/create-order', PaymentController.createOrder);
app.post('/verify-payment', PaymentController.verifyPayment);
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

app.use('/api', notFoundHandler);
app.use(errorHandler);

// Centralized process-level error handlers with structured root cause and file line diagnostic output
process.on('unhandledRejection', (reason: any) => {
  const diagnosis = diagnoseError(reason);
  const location = extractErrorLocation(reason?.stack);
  console.error(
    `\n🚨 [FATAL UNHANDLED REJECTION]\n` +
    `   Root Cause: ${diagnosis.rootCause}\n` +
    (location ? `   Location:   ${location}\n` : '') +
    JSON.stringify({
      level: 'FATAL',
      tag: 'UNHANDLED_REJECTION',
      timestamp: new Date().toISOString(),
      name: reason?.name || 'UnhandledPromiseRejection',
      message: reason?.message || String(reason),
      rootCause: diagnosis.rootCause,
      remedy: diagnosis.remedy,
      fileLocation: location,
      stack: reason?.stack,
    }) + '\n'
  );
});

process.on('uncaughtException', (err: Error) => {
  const diagnosis = diagnoseError(err);
  const location = extractErrorLocation(err?.stack);
  console.error(
    `\n🚨 [FATAL UNCAUGHT EXCEPTION]\n` +
    `   Root Cause: ${diagnosis.rootCause}\n` +
    (location ? `   Location:   ${location}\n` : '') +
    JSON.stringify({
      level: 'FATAL',
      tag: 'UNCAUGHT_EXCEPTION',
      timestamp: new Date().toISOString(),
      name: err.name,
      message: err.message,
      rootCause: diagnosis.rootCause,
      remedy: diagnosis.remedy,
      fileLocation: location,
      stack: err.stack,
    }) + '\n'
  );
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

  // Environment status notification
  if (!process.env.MONGODB_URI) {
    console.warn('[Urbanico] ⚠️ MONGODB_URI not set. Running with built-in in-memory catalog and storage.');
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
        configFile: path.resolve(process.cwd(), 'vite.config.ts'),
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
        },
        appType: 'custom',
      });
      app.use(vite.middlewares);

      // SPA fallback for dev server
      app.use(async (req, res, next) => {
        const url = req.originalUrl;
        if (
          url.startsWith('/api') ||
          url.startsWith('/razorpay') ||
          url.startsWith('/payments') ||
          url.startsWith('/create-order') ||
          url.startsWith('/verify-payment') ||
          url.startsWith('/send-invoice') ||
          url.startsWith('/otp')
        ) {
          return next();
        }
        try {
          const indexFile = path.resolve(process.cwd(), 'index.html');
          if (fs.existsSync(indexFile)) {
            let template = fs.readFileSync(indexFile, 'utf-8');
            template = await vite.transformIndexHtml(url, template);
            return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          }
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          return next(e);
        }
        next();
      });
    } catch (e) {
      console.error('[Vite] Middleware load error:', e);
    }
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