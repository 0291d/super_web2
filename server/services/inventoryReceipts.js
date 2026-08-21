import mongoose from 'mongoose';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { InventoryReceipt } from '../models/InventoryReceipt.js';
import { Product } from '../models/Product.js';

export function calculateReceiptTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
}

export function normalizeReceiptItems(items = []) {
  return items.map((item) => ({
    productId: String(item.productId || '').trim(),
    quantity: Number(item.quantity),
    unitCost: Number(item.unitCost),
  }));
}

export function validateReceiptItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('Receipt must include at least one item'), { statusCode: 400 });
  }

  for (const item of items) {
    if (!item.productId) {
      throw Object.assign(new Error('Each receipt item must include a productId'), { statusCode: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw Object.assign(new Error('Receipt item quantity must be a positive integer'), { statusCode: 400 });
    }
    if (!Number.isFinite(item.unitCost) || item.unitCost < 0) {
      throw Object.assign(new Error('Receipt item unitCost must be zero or greater'), { statusCode: 400 });
    }
  }
}

export async function validateProductsExist(items, options = {}) {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await Product.find({ productId: { $in: productIds } }, null, options).lean();
  const foundIds = new Set(products.map((product) => product.productId));
  const missing = productIds.filter((productId) => !foundIds.has(productId));

  if (missing.length) {
    throw Object.assign(new Error(`Product not found: ${missing.join(', ')}`), { statusCode: 400 });
  }

  return products;
}

export async function generateReceiptNumber() {
  const count = await InventoryReceipt.countDocuments();
  return `PN${String(count + 1).padStart(6, '0')}`;
}

function batchCodeFor(receipt, index) {
  const suffix = String(index + 1).padStart(3, '0');
  return `LOT-${receipt.receiptNumber}-${suffix}`;
}

function stockIncrements(items) {
  const increments = new Map();
  items.forEach((item) => {
    increments.set(item.productId, (increments.get(item.productId) || 0) + item.quantity);
  });
  return increments;
}

async function applyConfirmedReceipt(receipt, options = {}) {
  validateReceiptItems(receipt.items);
  const products = await validateProductsExist(receipt.items, options);
  const stockBeforeByProduct = new Map(products.map((product) => [product.productId, Number(product.stock || 0)]));

  const increments = stockIncrements(receipt.items);
  await Product.bulkWrite(
    [...increments.entries()].map(([productId, quantity]) => ({
      updateOne: {
        filter: { productId },
        update: { $inc: { stock: quantity }, $set: { inStock: true } },
      },
    })),
    options,
  );

  await InventoryBatch.insertMany(
    receipt.items.map((item, index) => ({
      batchCode: batchCodeFor(receipt, index),
      productId: item.productId,
      receiptId: receipt._id,
      receivedDate: receipt.receiptDate,
      quantityReceived: item.quantity,
      quantityRemaining: item.quantity,
      unitCost: item.unitCost,
      status: 'available',
    })),
    options,
  );

  const runningStock = new Map(stockBeforeByProduct);
  await InventoryLog.insertMany(
    receipt.items.map((item) => {
      const stockBefore = runningStock.get(item.productId) || 0;
      const stockAfter = stockBefore + item.quantity;
      runningStock.set(item.productId, stockAfter);
      return {
        productId: item.productId,
        type: 'IMPORT',
        quantity: item.quantity,
        stockBefore,
        stockAfter,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        referenceType: 'receipt',
        referenceId: receipt._id,
        performedBy: receipt.warehouseStaffId,
      };
    }),
    options,
  );
}

async function confirmWithTransaction(receiptId, userId) {
  const session = await mongoose.startSession();
  try {
    let confirmedReceipt;
    await session.withTransaction(async () => {
      const receipt = await InventoryReceipt.findOne({ _id: receiptId, status: 'draft' }).session(session);
      if (!receipt) {
        const existing = await InventoryReceipt.findById(receiptId).session(session);
        if (!existing) throw Object.assign(new Error('Receipt not found'), { statusCode: 404 });
        throw Object.assign(new Error(`Receipt already ${existing.status}`), { statusCode: 409 });
      }

      receipt.totalValue = calculateReceiptTotal(receipt.items);
      receipt.status = 'confirmed';
      receipt.confirmedAt = new Date();
      receipt.warehouseStaffId = userId;

      await applyConfirmedReceipt(receipt, { session });
      await receipt.save({ session });
      confirmedReceipt = receipt;
    });

    return confirmedReceipt;
  } finally {
    await session.endSession();
  }
}

async function confirmWithoutTransaction(receiptId, userId) {
  const receipt = await InventoryReceipt.findById(receiptId);
  if (!receipt) {
    throw Object.assign(new Error('Receipt not found'), { statusCode: 404 });
  }
  if (receipt.status !== 'draft') {
    throw Object.assign(new Error(`Receipt already ${receipt.status}`), { statusCode: 409 });
  }

  const items = normalizeReceiptItems(receipt.items);
  validateReceiptItems(items);
  await validateProductsExist(items);

  const confirmedAt = new Date();
  const totalValue = calculateReceiptTotal(items);
  const lockedReceipt = await InventoryReceipt.findOneAndUpdate(
    { _id: receiptId, status: 'draft' },
    {
      $set: {
        status: 'confirmed',
        confirmedAt,
        totalValue,
        warehouseStaffId: userId,
      },
    },
    { new: true, runValidators: true },
  );

  if (!lockedReceipt) {
    throw Object.assign(new Error('Receipt already confirmed'), { statusCode: 409 });
  }

  await applyConfirmedReceipt(lockedReceipt);
  return lockedReceipt;
}

function isTransactionUnsupported(error) {
  const message = String(error?.message || '');
  return message.includes('Transaction numbers are only allowed') || message.includes('replica set') || message.includes('Transaction') && message.includes('not supported');
}

export async function confirmInventoryReceipt(receiptId, userId) {
  try {
    return await confirmWithTransaction(receiptId, userId);
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return confirmWithoutTransaction(receiptId, userId);
    }
    throw error;
  }
}
