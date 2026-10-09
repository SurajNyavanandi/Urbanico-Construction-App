import path from 'path';
import dotenv from 'dotenv';

// Load .env from current directory and parent directory (single common .env at project root)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db';
import { apiRouter } from './routers';
import { ServiceService } from './services/serviceService';
import { DatabaseSeeder } from './services/databaseSeeder';
import { paymentRouter } from './routers/paymentRouter';
import { PaymentController } from './controllers/paymentController';
import { errorHandler, requestLogger, createRateLimiter } from './middleware';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(requestLogger);
app.use(createRateLimiter({ windowMs: 60 * 1000, maxRequests: 120 }));
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// CORS middleware configured strictly from process.env.CORS_ORIGIN
const configuredCorsOrigin = process.env.CORS_ORIGIN?.trim();
const allowedOrigins = configuredCorsOrigin
  ? configuredCorsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

function isOriginAllowed(origin: string): boolean {
  // If unconfigured or set to wildcard '*', permit access
  if (!configuredCorsOrigin || configuredCorsOrigin === '*' || allowedOrigins.includes('*')) {
    return true;
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

  // Non-production & preview environments (e.g. Cloud Run, localhost, 127.0.0.1)
  if (process.env.NODE_ENV !== 'production') {
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-admin-secret']
}));

app.use('/api', apiRouter);
app.use('/razorpay', paymentRouter);
app.get('/api/razorpay/config', PaymentController.getConfig);
app.get('/razorpay/config', PaymentController.getConfig);
app.post('/create-order', PaymentController.createOrder);
app.post('/verify-payment', PaymentController.verifyPayment);
app.post('/send-invoice', (req, res, next) => { req.url = '/send-invoice'; apiRouter(req, res, next); });
app.post('/otp/send', (req, res, next) => { req.url = '/otp/send'; apiRouter(req, res, next); });
app.post('/otp/verify', (req, res, next) => { req.url = '/otp/verify'; apiRouter(req, res, next); });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export async function startServer() {
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
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(indexPath, (err) => {
        if (err) res.json({ status: 'online', service: 'Urbanico Backend' });
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Urbanico] Server running on http://0.0.0.0:${PORT}`);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}

export { app };
export default app;
