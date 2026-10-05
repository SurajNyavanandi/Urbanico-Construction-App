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
let retryInterval: NodeJS.Timeout | null = null;

// CRITICAL: fail fast, don't hang if MongoDB Atlas is offline or credentials unconfigured
mongoose.set('bufferCommands', false);

async function onConnectionSuccess(conn: typeof mongoose) {
  isConnected = true;
  console.log(`[DB] 🟢 MongoDB Atlas CONNECTED: ${conn.connection.name} (${conn.connection.host})`);

  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }

  try {
    const { DatabaseSeeder } = await import('../services/databaseSeeder');
    await DatabaseSeeder.seedAll();
  } catch (err: any) {
    console.warn('[DB] Seeder execution notice:', err?.message || err);
  }

  try {
    const { UserService } = await import('../services/userService');
    const { OrderService } = await import('../services/orderService');
    await UserService.syncToAtlas();
    await OrderService.syncToAtlas();
  } catch (syncErr: any) {
    console.warn('[DB] Post-connect sync notice:', syncErr?.message || syncErr);
  }
}

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[DB] MONGODB_URI is not defined. Please set it in your environment or .env file.');
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

    await onConnectionSuccess(conn);

    mongoose.connection.on('error', (err) => {
      console.error('[DB] Connection Error:', err?.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] ⚠️ MongoDB Atlas disconnected. Initiating background reconnect...');
      isConnected = false;
      scheduleReconnect();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] 🟢 MongoDB Atlas reconnected');
      isConnected = true;
    });

    return conn;
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('IP') || errMsg.includes('whitelist') || errMsg.includes('SSL') || errMsg.includes('alert')) {
      console.warn('[DB] ⚠️ MongoDB Atlas IP access check needed. If connection is blocked, ensure "0.0.0.0/0" (Allow Access from Anywhere) is added to Network Access in your MongoDB Atlas dashboard.');
    } else {
      console.warn(`[DB] Connection attempt deferred: ${errMsg}`);
    }
    scheduleReconnect();
    return null;
  }
}

function scheduleReconnect() {
  if (retryInterval) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) return;

  retryInterval = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
      return;
    }
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: true,
      });
      await onConnectionSuccess(conn);
    } catch {
      // Retrying silently until Network Access / Atlas is open
    }
  }, 10000);
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
