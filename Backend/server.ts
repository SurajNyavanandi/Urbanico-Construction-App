import express from 'express';
import path from 'path';
import { connectDB } from './config/db';
import { apiRouter } from './routers';

const app = express();
const PORT = 3000;

app.use(express.json());

// Mount the modular Urbanico backend API router
app.use('/api', apiRouter);

async function startServer() {
  // Connect to MongoDB
  try {
    await connectDB();
  } catch (dbErr) {
    console.error('Initial DB connection attempt returned:', dbErr);
  }

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
      logLevel: 'silent',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server started on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
