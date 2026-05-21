import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { syncLocalProductImages } from './utils/syncLocalProductImages.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

await connectDB();

const result = await syncLocalProductImages({ projectRoot });

if (!result.count) {
  console.log(`No product images found in ${path.join(projectRoot, 'img')}`);
} else {
  console.log(`Scanned ${result.count} local image product groups`);
  console.log(`Updated ${result.updatedExistingCount || 0} existing catalog products with local images`);
  console.log(`Removed ${result.deletedGeneratedCount || 0} auto-generated placeholder products`);
  console.log('Existing product names and product details were preserved. Only image lists were refreshed.');
}

await mongoose.connection.close();
