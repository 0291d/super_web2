import mongoose from 'mongoose';
import { Router } from 'express';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { InventoryCount } from '../models/InventoryCount.js';
import { InventoryIssue } from '../models/InventoryIssue.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { InventoryReceipt } from '../models/InventoryReceipt.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { confirmInventoryCount, generateCountNumber, normalizeCountItems } from '../services/inventoryCounts.js';
import { confirmInventoryIssue, generateIssueNumber, issueItemsFromOrder, normalizeIssueItems, validateIssueItems } from '../services/inventoryIssues.js';
import {
  calculateReceiptTotal,
  confirmInventoryReceipt,
  generateReceiptNumber,
  normalizeReceiptItems,
  validateProductsExist,
  validateReceiptItems,
} from '../services/inventoryReceipts.js';

const router = Router();
const canUseWarehouse = authorizeRoles('warehouse', 'admin');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function receiptFilter(req) {
  const filter = {};
  const { status, dateFrom, dateTo, search } = req.query;

  if (['draft', 'confirmed', 'cancelled'].includes(status)) {
    filter.status = status;
  }

  if (dateFrom || dateTo) {
    filter.receiptDate = {};
    if (dateFrom) filter.receiptDate.$gte = new Date(String(dateFrom));
    if (dateTo) filter.receiptDate.$lte = new Date(String(dateTo));
  }

  if (search) {
    filter.receiptNumber = { $regex: escapeRegExp(String(search).trim()), $options: 'i' };
  }

  return filter;
}

function statusDateFilter(req, numberField, dateField) {
  const filter = {};
  const { status, dateFrom, dateTo, search } = req.query;

  if (['draft', 'confirmed', 'cancelled'].includes(status)) filter.status = status;
  if (dateFrom || dateTo) {
    filter[dateField] = {};
    if (dateFrom) filter[dateField].$gte = new Date(String(dateFrom));
    if (dateTo) filter[dateField].$lte = new Date(String(dateTo));
  }
  if (search) filter[numberField] = { $regex: escapeRegExp(String(search).trim()), $options: 'i' };
  return filter;
}

function productLookup(ids) {
  return Product.find({ productId: { $in: ids } })
    .select('productId name category subcategory price currency images imageUrl stock')
    .lean();
}

function serializeInventoryProduct(product) {
  const stock = Number(product.stock || 0);
  return {
    _id: product._id.toString(),
    productId: product.productId,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory || '',
    price: product.price,
    currency: product.currency || 'EUR',
    stock,
    imageUrl: product.imageUrl || product.images?.[0] || '',
    stockStatus: stock > 0 ? 'inStock' : 'outOfStock',
  };
}

async function serializeReceipt(receipt) {
  const data = receipt.toJSON();
  const productIds = [...new Set(data.items.map((item) => item.productId))];
  const products = await productLookup(productIds);
  const productsById = new Map(products.map((product) => [product.productId, product]));

  return {
    ...data,
    warehouseStaff: data.warehouseStaffId && typeof data.warehouseStaffId === 'object'
      ? {
          id: data.warehouseStaffId._id?.toString?.() || data.warehouseStaffId.id,
          firstName: data.warehouseStaffId.firstName || '',
          lastName: data.warehouseStaffId.lastName || '',
          email: data.warehouseStaffId.email || '',
          role: data.warehouseStaffId.role || '',
        }
      : null,
    items: data.items.map((item) => {
      const product = productsById.get(item.productId);
      return {
        ...item,
        product: product ? serializeInventoryProduct(product) : null,
        lineTotal: Number(item.quantity) * Number(item.unitCost),
      };
    }),
  };
}

async function serializeIssue(issue) {
  const data = issue.toJSON();
  const productIds = [...new Set(data.items.map((item) => item.productId))];
  const products = await productLookup(productIds);
  const productsById = new Map(products.map((product) => [product.productId, product]));
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      product: productsById.has(item.productId) ? serializeInventoryProduct(productsById.get(item.productId)) : null,
    })),
  };
}

async function serializeCount(count) {
  const data = count.toJSON();
  const productIds = [...new Set(data.items.map((item) => item.productId))];
  const products = await productLookup(productIds);
  const productsById = new Map(products.map((product) => [product.productId, product]));
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      product: productsById.has(item.productId) ? serializeInventoryProduct(productsById.get(item.productId)) : null,
    })),
  };
}

async function createReceiptPayload(req, receiptNumber) {
  const items = normalizeReceiptItems(req.body.items);
  validateReceiptItems(items);
  await validateProductsExist(items);

  const receiptDate = req.body.receiptDate ? new Date(req.body.receiptDate) : new Date();
  if (Number.isNaN(receiptDate.getTime())) {
    throw Object.assign(new Error('receiptDate must be a valid date'), { statusCode: 400 });
  }

  return {
    receiptNumber,
    warehouseStaffId: req.user._id,
    receiptDate,
    items,
    totalValue: calculateReceiptTotal(items),
    status: 'draft',
    note: String(req.body.note || ''),
  };
}

router.get('/inventory', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const { search = '', category = 'all', stockStatus = 'all' } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = String(category);
    const query = String(search).trim();
    if (query) {
      const regex = { $regex: escapeRegExp(query), $options: 'i' };
      filter.$or = [{ productId: regex }, { name: regex }];
    }
    if (stockStatus === 'inStock') filter.stock = { $gt: 0 };
    if (stockStatus === 'outOfStock') filter.stock = { $lte: 0 };

    const products = await Product.find(filter)
      .select('productId name category subcategory price currency images imageUrl stock')
      .sort({ category: 1, name: 1 })
      .lean();

    res.json({
      products: products.map(serializeInventoryProduct),
      categories: [...new Set(products.map((product) => product.category).filter(Boolean))],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/receipts', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const receipts = await InventoryReceipt.find(receiptFilter(req))
      .populate('warehouseStaffId', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.json({ receipts: await Promise.all(receipts.map(serializeReceipt)) });
  } catch (error) {
    next(error);
  }
});

router.get('/receipts/:id', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const receipt = await InventoryReceipt.findById(req.params.id).populate('warehouseStaffId', 'firstName lastName email role');
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });

    const batches = await InventoryBatch.find({ receiptId: receipt._id }).sort({ createdAt: 1 });
    res.json({ receipt: await serializeReceipt(receipt), batches });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', requireAuth, canUseWarehouse, async (_req, res, next) => {
  try {
    const orders = await Order.find({
      inventoryReserved: true,
      inventoryRestored: false,
      status: { $in: ['paid', 'processing', 'completed'] },
    }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.post('/receipts', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const payload = await createReceiptPayload(req, await generateReceiptNumber());
    const receipt = await InventoryReceipt.create(payload);
    await receipt.populate('warehouseStaffId', 'firstName lastName email role');
    res.status(201).json({ receipt: await serializeReceipt(receipt) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/receipts/:id', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const receipt = await InventoryReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    if (receipt.status !== 'draft') {
      return res.status(409).json({ message: 'Only draft receipts can be edited' });
    }

    const payload = await createReceiptPayload(req, receipt.receiptNumber);
    receipt.receiptDate = payload.receiptDate;
    receipt.items = payload.items;
    receipt.totalValue = payload.totalValue;
    receipt.note = payload.note;
    receipt.warehouseStaffId = req.user._id;
    await receipt.save();
    await receipt.populate('warehouseStaffId', 'firstName lastName email role');

    res.json({ receipt: await serializeReceipt(receipt) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/receipts/:id/cancel', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const receipt = await InventoryReceipt.findOneAndUpdate(
      { _id: req.params.id, status: 'draft' },
      { $set: { status: 'cancelled', warehouseStaffId: req.user._id } },
      { new: true, runValidators: true },
    ).populate('warehouseStaffId', 'firstName lastName email role');

    if (!receipt) {
      return res.status(409).json({ message: 'Only draft receipts can be cancelled' });
    }

    res.json({ receipt: await serializeReceipt(receipt) });
  } catch (error) {
    next(error);
  }
});

router.post('/receipts/:id/confirm', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const receipt = await confirmInventoryReceipt(req.params.id, req.user._id);
    await receipt.populate('warehouseStaffId', 'firstName lastName email role');
    const batches = await InventoryBatch.find({ receiptId: receipt._id }).sort({ createdAt: 1 });

    res.json({ receipt: await serializeReceipt(receipt), batches });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.get('/issues', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const issues = await InventoryIssue.find(statusDateFilter(req, 'issueNumber', 'issueDate')).sort({ createdAt: -1 });
    res.json({ issues: await Promise.all(issues.map(serializeIssue)) });
  } catch (error) {
    next(error);
  }
});

router.get('/issues/:id', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Issue not found' });
    const issue = await InventoryIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ issue: await serializeIssue(issue) });
  } catch (error) {
    next(error);
  }
});

router.post('/issues', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const orderId = String(req.body.orderId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: 'A valid orderId is required' });
    const { items } = await issueItemsFromOrder(orderId);
    const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();
    if (Number.isNaN(issueDate.getTime())) return res.status(400).json({ message: 'issueDate must be a valid date' });

    const issue = await InventoryIssue.create({
      issueNumber: await generateIssueNumber(),
      orderId,
      warehouseStaffId: req.user._id,
      issueDate,
      items,
      totalCost: 0,
      status: 'draft',
      note: String(req.body.note || ''),
    });
    res.status(201).json({ issue: await serializeIssue(issue) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/issues/:id', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Issue not found' });
    const issue = await InventoryIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.status !== 'draft') return res.status(409).json({ message: 'Only draft issues can be edited' });

    const items = normalizeIssueItems(req.body.items);
    validateIssueItems(items);
    issue.issueDate = req.body.issueDate ? new Date(req.body.issueDate) : issue.issueDate;
    if (Number.isNaN(issue.issueDate.getTime())) return res.status(400).json({ message: 'issueDate must be a valid date' });
    issue.items = items;
    issue.note = String(req.body.note || '');
    issue.warehouseStaffId = req.user._id;
    await issue.save();
    res.json({ issue: await serializeIssue(issue) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/issues/:id/cancel', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const issue = await InventoryIssue.findOneAndUpdate(
      { _id: req.params.id, status: 'draft' },
      { $set: { status: 'cancelled', warehouseStaffId: req.user._id } },
      { new: true, runValidators: true },
    );
    if (!issue) return res.status(409).json({ message: 'Only draft issues can be cancelled' });
    res.json({ issue: await serializeIssue(issue) });
  } catch (error) {
    next(error);
  }
});

router.post('/issues/:id/confirm', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Issue not found' });
    const issue = await confirmInventoryIssue(req.params.id, req.user._id);
    res.json({ issue: await serializeIssue(issue) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.get('/counts', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const counts = await InventoryCount.find(statusDateFilter(req, 'countNumber', 'countDate')).sort({ createdAt: -1 });
    res.json({ counts: await Promise.all(counts.map(serializeCount)) });
  } catch (error) {
    next(error);
  }
});

router.get('/counts/:id', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Inventory count not found' });
    const count = await InventoryCount.findById(req.params.id);
    if (!count) return res.status(404).json({ message: 'Inventory count not found' });
    res.json({ count: await serializeCount(count) });
  } catch (error) {
    next(error);
  }
});

router.post('/counts', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const items = await normalizeCountItems(req.body.items);
    const countDate = req.body.countDate ? new Date(req.body.countDate) : new Date();
    if (Number.isNaN(countDate.getTime())) return res.status(400).json({ message: 'countDate must be a valid date' });
    const count = await InventoryCount.create({
      countNumber: await generateCountNumber(),
      warehouseStaffId: req.user._id,
      countDate,
      items,
      status: 'draft',
      note: String(req.body.note || ''),
    });
    res.status(201).json({ count: await serializeCount(count) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/counts/:id', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Inventory count not found' });
    const count = await InventoryCount.findById(req.params.id);
    if (!count) return res.status(404).json({ message: 'Inventory count not found' });
    if (count.status !== 'draft') return res.status(409).json({ message: 'Only draft counts can be edited' });
    count.items = await normalizeCountItems(req.body.items);
    count.countDate = req.body.countDate ? new Date(req.body.countDate) : count.countDate;
    if (Number.isNaN(count.countDate.getTime())) return res.status(400).json({ message: 'countDate must be a valid date' });
    count.note = String(req.body.note || '');
    count.warehouseStaffId = req.user._id;
    await count.save();
    res.json({ count: await serializeCount(count) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/counts/:id/cancel', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const count = await InventoryCount.findOneAndUpdate(
      { _id: req.params.id, status: 'draft' },
      { $set: { status: 'cancelled', warehouseStaffId: req.user._id } },
      { new: true, runValidators: true },
    );
    if (!count) return res.status(409).json({ message: 'Only draft counts can be cancelled' });
    res.json({ count: await serializeCount(count) });
  } catch (error) {
    next(error);
  }
});

router.post('/counts/:id/confirm', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Inventory count not found' });
    const count = await confirmInventoryCount(req.params.id, req.user._id);
    res.json({ count: await serializeCount(count) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.get('/inventory-logs', requireAuth, canUseWarehouse, async (req, res, next) => {
  try {
    const filter = {};
    const { productId, type } = req.query;
    if (productId) filter.productId = String(productId);
    if (['IMPORT', 'EXPORT', 'ADJUSTMENT'].includes(type)) filter.type = type;
    const logs = await InventoryLog.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

export default router;
