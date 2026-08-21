import mongoose from 'mongoose';
import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { Product } from '../models/Product.js';

const router = Router();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactMatch(value) {
  return new RegExp(`^${escapeRegExp(value)}$`, 'i');
}

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function generateNextProductId() {
  const products = await Product.find({ productId: /^prod_\d+$/ }).select('productId').lean();
  const maxId = products.reduce((max, product) => {
    const match = /^prod_(\d+)$/.exec(product.productId || '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `prod_${String(maxId + 1).padStart(3, '0')}`;
}

function productPayload(body, productIdOverride) {
  const { id: _id, productId: _productId, ...rest } = body;
  const productId = productIdOverride || body.productId || body.id;
  const details = { ...(body.details || {}) };

  if (productId && !details.itemNumber) {
    details.itemNumber = `BREW-DEMO-${productId.replace(/^prod_/, '')}`;
  }

  return {
    ...rest,
    productId,
    slug: body.slug || slugify(body.name || productId),
    imageUrl: body.imageUrl || body.images?.[0] || '',
    details,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { category, subcategory, q, sort } = req.query;
    const filter = {};

    if (category) filter.category = exactMatch(String(category));
    if (subcategory) filter.subcategory = exactMatch(String(subcategory));
    if (q) {
      const query = new RegExp(escapeRegExp(String(q)), 'i');
      filter.$or = [{ name: query }, { description: query }, { shortDescription: query }];
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      popular: { isPopular: -1, createdAt: -1 },
      newest: { isNew: -1, createdAt: -1 },
    };

    const products = await Product.find(filter).sort(sortMap[sort] || { category: 1, name: 1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ productId: id }, { slug: id }];

    if (mongoose.Types.ObjectId.isValid(id)) {
      lookup.push({ _id: id });
    }

    const product = await Product.findOne({ $or: lookup });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const productId = req.body.productId || req.body.id || await generateNextProductId();
    const product = await Product.create(productPayload(req.body, productId));
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ productId: id }, { slug: id }];

    if (mongoose.Types.ObjectId.isValid(id)) {
      lookup.push({ _id: id });
    }

    const product = await Product.findOneAndUpdate({ $or: lookup }, productPayload(req.body), {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ productId: id }, { slug: id }];

    if (mongoose.Types.ObjectId.isValid(id)) {
      lookup.push({ _id: id });
    }

    const product = await Product.findOneAndDelete({ $or: lookup });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
