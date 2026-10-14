import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, disconnectDB } from '../config/db';
import { DatabaseSeeder } from '../services/databaseSeeder';

async function runSeed() {
  console.log('🌱 [Urbanico Seed Script] Starting MongoDB Database Seeder...');
  const conn = await connectDB();
  if (!conn) {
    console.error('❌ Database connection failed. Please ensure MONGODB_URI is configured correctly in .env');
    process.exit(1);
  }

  try {
    await DatabaseSeeder.seedAll();
    console.log('✅ [Urbanico Seed Script] Database seeded successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runSeed();
