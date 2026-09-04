// ==============================================================================
// URBANICO BACKEND API SERVER
// Endpoints: /api/razorpay/create-order, /api/razorpay/verify-payment, /api/orders, /api/materials
// Local VSC: Port 3000 (http://localhost:3000/api)
// Render:    Auto-configured port or 3000 (https://urbanico-construction-app.onrender.com/api)
// Vercel:    Frontend (https://urbanico.vercel.app) connects to backend via EXPO_PUBLIC_API_URL
// ==============================================================================

import dotenv from 'dotenv';
import path from 'path';

// .env loader: Reads root .env and backend/.env for local VSC testing and Render runtime
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { connectDB, getDBStatus } from './config/db';
import { apiRouter } from './routers';

const app = express();
// Port: 3000 for local development & container proxy; Render provides PORT or defaults to 3000
const PORT = 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://urbanico.vercel.app';

// 1. JSON & URL encoding parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CORS Middleware - Allow frontend from localhost, custom configured FRONTEND_URL, and production domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    FRONTEND_URL,
    'https://urbanico.vercel.app',
    'https://urbanico-construction-app.onrender.com',
  ].filter(Boolean);

  // Allow requesting origin dynamically or fallback to *
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 3. Mount all modular API routes on /api and root fallbacks
app.use('/api', apiRouter);

// Flat direct endpoints on root to avoid 404 if client requests without /api
import { paymentRouter } from './routers/paymentRouter';
import { PaymentController } from './controllers/paymentController';
app.use('/razorpay', paymentRouter);
app.post('/create-order', PaymentController.createOrder);
app.post('/verify-payment', PaymentController.verifyPayment);

// 4. Server & Integration info endpoint
app.get('/api/server-info', (req, res) => {
  res.json({
    status: 'online',
    service: 'Urbanico Backend API',
    port: PORT,
    database: getDBStatus().isConnected ? 'connected' : 'disconnected',
    endpoints: [
      '/api/health',
      '/api/server-info',
      '/api/orders',
      '/api/materials',
      '/api/deliveries',
      '/api/users',
      '/api/razorpay/create-order',
      '/api/razorpay/verify-payment',
    ],
  });
});

// 5. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
  });
});

// 6. Global Error Handler for API routes and JSON syntax errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Malformed JSON payload' });
  }
  console.error('[Backend] Internal Error:', err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ success: false, error: 'Internal server error' });
});

export async function startServer() {
  // Connect to MongoDB Atlas in background
  connectDB().catch((dbErr: any) => {
    console.error('Initial DB connection attempt returned:', dbErr?.message || dbErr);
  });

  // Vite middleware for preview/frontend serving
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      // Standalone backend mode without vite
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    
    // Express 4/5 safe fallback for single-page applications and root requests
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found', path: req.path });
      }
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.json({
            service: 'Urbanico Backend API',
            status: 'online',
            environment: process.env.NODE_ENV || 'production',
            database: getDBStatus(),
            message: 'Urbanico Backend API is live and accepting requests.',
            endpoints: [
              '/api/health',
              '/api/server-info',
              '/api/orders',
              '/api/materials',
              '/api/deliveries',
              '/api/users',
              '/api/razorpay/create-order',
              '/api/razorpay/verify-payment',
            ],
          });
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] Port: ${PORT} | API: http://localhost:${PORT}/api`);
  });

  return app;
}

// Start automatically when executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Failed to start backend server:', err);
  });
}

export { app };
export default app;
