import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables. Running with memory/mock fallback.');
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
    console.log(`✅ MongoDB Connected successfully to: ${conn.connection.host} (DB: ${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error event:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully.');
      isConnected = true;
    });

    return conn;
  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
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
