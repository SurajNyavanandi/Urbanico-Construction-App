import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose | null> {
  // Try Atlas FIRST with longer timeout, only fall back to local if explicitly disabled
  const atlasUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/';
  
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If Atlas URI exists, try it with generous timeout
  if (atlasUri) {
    try {
      console.log('🔗 Attempting MongoDB Atlas connection...');
      const conn = await mongoose.connect(atlasUri, {
        serverSelectionTimeoutMS: 15000, // 15 seconds for Atlas (more realistic)
        socketTimeoutMS: 45000,
        autoIndex: true,
      });

      isConnected = true;
      console.log('✅ MongoDB Atlas connected successfully');

      setupConnectionHandlers();
      return conn;
    } catch (atlasErr: any) {
      console.error('❌ MongoDB Atlas connection failed:', atlasErr.message);
      console.log('📍 Falling back to local MongoDB...');
    }
  }

  // Fallback to local MongoDB
  try {
    console.log('🔗 Attempting local MongoDB connection...');
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
    });

    isConnected = true;
    console.log('📍 Local MongoDB connected (production should use Atlas)');

    setupConnectionHandlers();
    return conn;
  } catch (localErr: any) {
    console.error('❌ Local MongoDB also unavailable:', localErr.message);
    console.warn('⚠️  No MongoDB connection available. Running in degraded mode.');
    return null;
  }
}

function setupConnectionHandlers() {
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