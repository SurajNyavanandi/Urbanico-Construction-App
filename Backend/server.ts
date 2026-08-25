import express, { Request, Response, NextFunction } from 'express';
import { connectDB, getDBStatus } from './config/db';
import { apiRouter } from './routers';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// 1. JSON & URL encoding parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CORS Middleware - Allow frontend from localhost, Vercel, and Render
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8081',
    'https://urbanico.vercel.app',
    'https://urbanico-construction-app.onrender.com',
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com'))) {
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
app.get('/api/server-info', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Urbanico Backend API',
    backendPort: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: getDBStatus(),
    frontendUrl: 'https://urbanico.vercel.app',
    backendRenderUrl: 'https://urbanico-construction-app.onrender.com',
    allowedOrigins: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8081',
      'https://urbanico.vercel.app',
      'https://urbanico-construction-app.onrender.com',
    ],
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
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
  });
});

// 6. Root endpoint info
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Urbanico Backend API is running',
    status: 'online',
    frontend: 'https://urbanico.vercel.app',
    apiBase: `http://localhost:${PORT}/api`,
    docs: 'See /api/server-info for endpoints',
  });
});

export async function startServer() {
  // Validate required environment variables
  const requiredEnvVars = ['MONGODB_URI'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('📝 Add these to Render Environment Variables in the dashboard');
  }

  // Connect to MongoDB Atlas
  try {
    await connectDB();
  } catch (dbErr) {
    const errorMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.error('Initial DB connection attempt returned:', errorMessage);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Urbanico Backend API running on port ${PORT}`);
    console.log(`🌐 API Base URL:      http://localhost:${PORT}/api`);
    console.log(`💻 Frontend URL:      https://urbanico.vercel.app`);
    console.log(`☁️  Render Backend:   https://urbanico-construction-app.onrender.com`);
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