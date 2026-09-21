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
import { paymentRouter } from './routers/paymentRouter';
import { PaymentController } from './controllers/paymentController';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware allowing https://urbanico.vercel.app and development origins
const allowedOrigins = [
  'https://urbanico.vercel.app',
  'https://urbanico-construction-app.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin === 'https://urbanico.vercel.app' ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('.run.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use('/api', apiRouter);
app.use('/razorpay', paymentRouter);
app.get('/api/razorpay/config', PaymentController.getConfig);
app.get('/razorpay/config', PaymentController.getConfig);
app.post('/create-order', PaymentController.createOrder);
app.post('/verify-payment', PaymentController.verifyPayment);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Malformed JSON payload' });
  }
  console.error('[Backend] Error:', err?.message || err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
});

export async function startServer() {
  connectDB()
    .then(async (conn) => {
      if (conn) {
        try {
          await ServiceService.seedDefaultServices();
        } catch (err) {
          console.warn('[DB] Seeding issue:', err);
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
    console.log(`[Backend] Port: ${PORT} | API: http://localhost:${PORT}/api`);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}

export { app };
export default app;
