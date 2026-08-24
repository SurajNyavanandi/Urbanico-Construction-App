import express from 'express';
import { connectDB, getDBStatus } from './config/db';
import { apiRouter } from './routers';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// 1. JSON & URL encoding parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CORS Middleware - Allow frontend from localhost, Vercel, and Render
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8081',
    'https://urbanico.vercel.app',
    'https://urbanico-construction-app.onrender.com',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
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
    service: 'Urbanico Backend API',
    backendPort: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: getDBStatus(),
    frontendUrl: 'https://urbanico.vercel.app',
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

export async function startServer() {
  // Connect to MongoDB Atlas
  try {
    await connectDB();
  } catch (dbErr: any) {
    console.error('Initial DB connection attempt returned:', dbErr?.message || dbErr);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Urbanico Backend API running on port ${PORT}`);
    console.log(`🌐 API Base URL:      http://localhost:${PORT}/api`);
    console.log(`💻 Frontend URL:      https://urbanico.vercel.app`);
    console.log(`🗄️  MongoDB Database:   ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
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