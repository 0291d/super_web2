import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import professionalRoutes from './routes/professionals.js';
import servicePageRoutes from './routes/servicePages.js';
import storyRoutes from './routes/stories.js';
import { syncLocalProductImages } from './utils/syncLocalProductImages.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use('/assets/img', express.static(path.join(projectRoot, 'img')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: 'brew' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/service-pages', servicePageRoutes);
app.use('/api/stories', storyRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.name === 'ValidationError' ? 400 : err.name === 'CastError' ? 404 : err.code === 11000 ? 409 : 500;
  const message =
    status === 400
      ? err.message
      : status === 404
        ? 'Resource not found'
        : status === 409
          ? 'Duplicate record'
          : 'Server error';
  res.status(status).json({ message });
});

await connectDB();

if (process.env.AUTO_SYNC_PRODUCT_IMAGES !== 'false') {
  try {
    const result = await syncLocalProductImages({ projectRoot });
    if (result.count) {
      console.log(`Scanned ${result.count} local image product groups`);
      console.log(`Updated ${result.updatedExistingCount || 0} existing catalog products with local images`);
      if (result.deletedGeneratedCount) {
        console.log(`Removed ${result.deletedGeneratedCount} auto-generated placeholder products`);
      }
    }
  } catch (error) {
    console.error('Unable to sync local product images', error);
  }
}

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
