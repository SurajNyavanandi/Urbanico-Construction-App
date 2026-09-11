import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows / Local ISP DNS querySrv ECONNREFUSED on MongoDB Atlas SRV connection strings
if (dns && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {
    // Ignore if running in an environment where setting DNS servers is restricted
  }
}

let isConnected = false;

// CRITICAL: fail fast, don't hang if MongoDB Atlas is offline or credentials unconfigured
mongoose.set('bufferCommands', false);

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[DB] Running with in-memory store');
    return null;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
    });

    isConnected = true;
    console.log(`[DB] Connected: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[DB] Error:', err?.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] Disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] Reconnected');
      isConnected = true;
    });

    return conn;
  } catch (error: any) {
    console.warn('[DB] In-memory store active');
    // Do not crash the entire server; allow graceful API response & retries
    return null;
  }
}

export function getDBStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    readyState: stateCode,
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 MongoDB connection closed.');
  }
}
