import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose | null> {
  const connectionUris = [process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017/'].filter(
    (uri): uri is string => Boolean(uri)
  );

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  for (const [index, uri] of connectionUris.entries()) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: true,
      });

      isConnected = true;
      console.log(index === 0 && process.env.MONGODB_URI ? 'MongoDB connected' : 'MongoDB connected (local)');

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
    } catch {
      if (index === connectionUris.length - 1) {
        console.warn('MongoDB unavailable');
      }
    }
  }

  return null;
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
