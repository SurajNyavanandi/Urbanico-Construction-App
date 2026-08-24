import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB, getDBStatus } from './config/db';
import { apiRouter } from './routers';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 1. JSON & URL encoding parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CORS Middleware (Supports standalone frontend on http://localhost:5173, Expo, and preview proxies)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow all localhost origins, specific FRONTEND_URL, or echo origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 3. Mount all modular API routes on /api
app.use('/api', apiRouter);

// 4. Server & Integration info endpoint
app.get('/api/server-info', (req, res) => {
  res.json({
    status: 'online',
    service: 'Urbanico Modular Backend',
    backendPort: PORT,
    frontendDevUrl: FRONTEND_URL,
    frontendDevPort: 5173,
    environment: process.env.NODE_ENV || 'development',
    database: getDBStatus(),
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

export async function startServer() {
  // Connect to MongoDB Atlas
  try {
    await connectDB();
  } catch (dbErr: any) {
    console.error('Initial DB connection attempt returned:', dbErr?.message || dbErr);
  }

  // Vite middleware for unified development & production serving
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware could not be loaded (running in standalone API mode):', viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Urbanico Backend Server running on port ${PORT}`);
    console.log(`🌐 API Base URL:      http://localhost:${PORT}/api`);
    console.log(`💻 Frontend Dev URL:  ${FRONTEND_URL} (Vite: http://localhost:5173)`);
    console.log(`🗄️  MongoDB Database:   ${process.env.MONGODB_URI ? 'Configured via .env' : 'Not configured'}`);
    console.log(`======================================================\n`);
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
