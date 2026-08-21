import { InventoryBatch } from '../models/InventoryBatch.js';
import { InventoryCount } from '../models/InventoryCount.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { Product } from '../models/Product.js';

export async function generateCountNumber() {
  const count = await InventoryCount.countDocuments();
  return `KK${String(count + 1).padStart(6, '0')}`;
}

export async function normalizeCountItems(items = []) {
  if (!Array.isArray(items) || !items.length) {
    throw Object.assign(new Error('Inventory count must include at least one item'), { statusCode: 400 });
  }

  const productIds = [...new Set(items.map((item) => String(item.productId || '').trim()).filter(Boolean))];
  const products = await Product.find({ productId: { $in: productIds } });
  const productsById = new Map(products.map((product) => [product.productId, product]));
  const missing = productIds.filter((productId) => !productsById.has(productId));
  if (missing.length) throw Object.assign(new Error(`Product not found: ${missing.join(', ')}`), { statusCode: 400 });

  return items.map((item) => {
    const productId = String(item.productId || '').trim();
    const actualQuantity = Number(item.actualQuantity);
    if (!productId) throw Object.assign(new Error('Each count item must include a productId'), { statusCode: 400 });
    if (!Number.isInteger(actualQuantity) || actualQuantity < 0) {
      throw Object.assign(new Error('actualQuantity must be a non-negative integer'), { statusCode: 400 });
    }
    const systemQuantity = Number(productsById.get(productId)?.stock || 0);
    return {
      productId,
      systemQuantity,
      actualQuantity,
      difference: actualQuantity - systemQuantity,
    };
  });
}

async function reduceBatchesForShortage(productId, shortage) {
  const batches = await InventoryBatch.find({
    productId,
    quantityRemaining: { $gt: 0 },
    status: 'available',
  }).sort({ receivedDate: 1, _id: 1 });

  const totalRemaining = batches.reduce((sum, batch) => sum + Number(batch.quantityRemaining || 0), 0);
  if (totalRemaining < shortage) {
    throw Object.assign(new Error('FIFO cost cannot be determined because legacy inventory has no batch cost data'), { statusCode: 409 });
  }

  let remaining = shortage;
  const operations = [];
  const allocations = [];
  for (const batch of batches) {
    if (remaining <= 0) break;
    const quantity = Math.min(remaining, batch.quantityRemaining);
    const nextRemaining = Number(batch.quantityRemaining) - quantity;
    operations.push({
      updateOne: {
        filter: { _id: batch._id, quantityRemaining: { $gte: quantity } },
        update: {
          $inc: { quantityRemaining: -quantity },
          $set: { status: nextRemaining === 0 ? 'depleted' : 'available' },
        },
      },
    });
    allocations.push({ quantity, unitCost: batch.unitCost });
    remaining -= quantity;
  }

  if (operations.length) {
    const result = await InventoryBatch.bulkWrite(operations);
    if (result.modifiedCount !== operations.length) {
      throw Object.assign(new Error('Inventory batch quantity changed during count confirmation'), { statusCode: 409 });
    }
  }

  return allocations;
}

export async function confirmInventoryCount(countId, userId) {
  const count = await InventoryCount.findById(countId);
  if (!count) throw Object.assign(new Error('Inventory count not found'), { statusCode: 404 });
  if (count.status !== 'draft') throw Object.assign(new Error('Inventory count already confirmed'), { statusCode: 409 });

  const currentItems = await normalizeCountItems(count.items);
  const positiveDifference = currentItems.find((item) => item.difference > 0);
  if (positiveDifference) {
    throw Object.assign(new Error('Positive count differences require a receipt because FIFO cost cannot be determined'), { statusCode: 409 });
  }

  const lockedCount = await InventoryCount.findOneAndUpdate(
    { _id: countId, status: 'draft' },
    { $set: { status: 'confirmed', confirmedAt: new Date(), warehouseStaffId: userId, items: currentItems } },
    { new: true, runValidators: true },
  );
  if (!lockedCount) throw Object.assign(new Error('Inventory count already confirmed'), { statusCode: 409 });

  const logs = [];
  for (const item of currentItems) {
    if (item.difference < 0) {
      await reduceBatchesForShortage(item.productId, Math.abs(item.difference));
    }

    const product = await Product.findOneAndUpdate(
      { productId: item.productId },
      { $set: { stock: item.actualQuantity, inStock: item.actualQuantity > 0 } },
      { new: false },
    );

    logs.push({
      productId: item.productId,
      type: 'ADJUSTMENT',
      quantity: item.difference,
      stockBefore: item.systemQuantity,
      stockAfter: item.actualQuantity,
      unitCost: 0,
      totalCost: 0,
      referenceType: 'count',
      referenceId: lockedCount._id,
      performedBy: userId,
    });

    if (!product) {
      throw Object.assign(new Error(`Product not found: ${item.productId}`), { statusCode: 400 });
    }
  }

  await InventoryLog.insertMany(logs);
  return lockedCount;
}
