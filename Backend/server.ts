import path from 'path';
import express from 'express';

import { connectDB } from './config/db';
import { apiRouter } from './routers';
import { ServiceService } from './services/serviceService';
import { paymentRouter } from './routers/paymentRouter';
import { PaymentController } from './controllers/paymentController';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',  // Vite React default
    'http://localhost:5174',  // Vite alternative
    'http://localhost:8081',  // React Native (Metro Bundler) default
    'http://localhost:19000', // Expo React Native default
    'http://localhost:19006', // Expo Web default
    'https://virattom.com',
    'https://urbanico.vercel.app',
    'https://urbanico-admin.vercel.app'
  ];

  // Allow explicitly listed origins, cloud run previews, and dynamic local dev networks (localhost / LAN)
  if (origin && (
    allowedOrigins.includes(origin) || 
    origin.endsWith('.run.app') || 
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://192.168.')
  )) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use('/api', apiRouter);
app.use('/razorpay', paymentRouter);
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
