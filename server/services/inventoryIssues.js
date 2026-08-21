import { InventoryBatch } from '../models/InventoryBatch.js';
import { InventoryIssue } from '../models/InventoryIssue.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { createCogsJournalIfPossible } from './accounting.js';

export async function generateIssueNumber() {
  const count = await InventoryIssue.countDocuments();
  return `PX${String(count + 1).padStart(6, '0')}`;
}

export function normalizeIssueItems(items = []) {
  return items.map((item) => ({
    productId: String(item.productId || '').trim(),
    quantity: Number(item.quantity),
    cost: 0,
    fifoAllocations: [],
  }));
}

export function validateIssueItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw Object.assign(new Error('Issue must include at least one item'), { statusCode: 400 });
  }
  for (const item of items) {
    if (!item.productId) throw Object.assign(new Error('Each issue item must include a productId'), { statusCode: 400 });
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw Object.assign(new Error('Issue item quantity must be a positive integer'), { statusCode: 400 });
    }
  }
}

function mergeItems(items) {
  const merged = new Map();
  items.forEach((item) => {
    merged.set(item.productId, (merged.get(item.productId) || 0) + item.quantity);
  });
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity, cost: 0, fifoAllocations: [] }));
}

export async function issueItemsFromOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (!order.inventoryReserved || order.inventoryRestored) {
    throw Object.assign(new Error('Order inventory is not reserved for export'), { statusCode: 409 });
  }

  const existingIssue = await InventoryIssue.findOne({ orderId: order._id, status: { $ne: 'cancelled' } });
  if (existingIssue) {
    throw Object.assign(new Error('Order already has an active inventory issue'), { statusCode: 409 });
  }

  return { order, items: mergeItems(normalizeIssueItems(order.items)) };
}

async function validateProducts(items, options = {}) {
  const ids = [...new Set(items.map((item) => item.productId))];
  const products = await Product.find({ productId: { $in: ids } }, null, options);
  const byId = new Map(products.map((product) => [product.productId, product]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    throw Object.assign(new Error(`Product not found: ${missing.join(', ')}`), { statusCode: 400 });
  }
  return byId;
}

export async function buildFifoAllocations(items, options = {}) {
  const allocationsByProduct = new Map();
  for (const item of items) {
    const batches = await InventoryBatch.find({
      productId: item.productId,
      quantityRemaining: { $gt: 0 },
      status: 'available',
    }, null, options).sort({ receivedDate: 1, _id: 1 });

    const totalAvailable = batches.reduce((sum, batch) => sum + Number(batch.quantityRemaining || 0), 0);
    if (totalAvailable < item.quantity) {
      throw Object.assign(new Error('Insufficient inventory batch quantity'), { statusCode: 409 });
    }

    let remaining = item.quantity;
    const allocations = [];
    for (const batch of batches) {
      if (remaining <= 0) break;
      const quantity = Math.min(remaining, batch.quantityRemaining);
      allocations.push({ batch, quantity, unitCost: batch.unitCost });
      remaining -= quantity;
    }
    allocationsByProduct.set(item.productId, allocations);
  }

  return allocationsByProduct;
}

async function applyBatchAllocations(allocationsByProduct, options = {}) {
  const operations = [];
  for (const allocations of allocationsByProduct.values()) {
    allocations.forEach((allocation) => {
      const nextRemaining = Number(allocation.batch.quantityRemaining) - allocation.quantity;
      operations.push({
        updateOne: {
          filter: { _id: allocation.batch._id, quantityRemaining: { $gte: allocation.quantity } },
          update: {
            $inc: { quantityRemaining: -allocation.quantity },
            $set: { status: nextRemaining === 0 ? 'depleted' : 'available' },
          },
        },
      });
    });
  }

  if (!operations.length) return;
  const result = await InventoryBatch.bulkWrite(operations, options);
  if (result.modifiedCount !== operations.length) {
    throw Object.assign(new Error('Inventory batch allocation changed during confirmation'), { statusCode: 409 });
  }
}

function issueItemsWithCost(items, allocationsByProduct) {
  return items.map((item) => {
    const allocations = allocationsByProduct.get(item.productId) || [];
    const fifoAllocations = allocations.map((allocation) => ({
      batchId: allocation.batch._id,
      quantity: allocation.quantity,
      unitCost: allocation.unitCost,
    }));
    const cost = fifoAllocations.reduce((sum, allocation) => sum + allocation.quantity * allocation.unitCost, 0);
    return { ...item, fifoAllocations, cost };
  });
}

export async function confirmInventoryIssue(issueId, userId) {
  const issue = await InventoryIssue.findById(issueId);
  if (!issue) throw Object.assign(new Error('Issue not found'), { statusCode: 404 });
  if (issue.status !== 'draft') throw Object.assign(new Error('Issue already confirmed'), { statusCode: 409 });

  const items = mergeItems(normalizeIssueItems(issue.items));
  validateIssueItems(items);
  const productsById = await validateProducts(items);
  const allocationsByProduct = await buildFifoAllocations(items);

  const lockedIssue = await InventoryIssue.findOneAndUpdate(
    { _id: issueId, status: 'draft' },
    { $set: { status: 'confirmed', confirmedAt: new Date(), warehouseStaffId: userId } },
    { new: true, runValidators: true },
  );
  if (!lockedIssue) throw Object.assign(new Error('Issue already confirmed'), { statusCode: 409 });

  const costedItems = issueItemsWithCost(items, allocationsByProduct);
  await applyBatchAllocations(allocationsByProduct);

  lockedIssue.items = costedItems;
  lockedIssue.totalCost = costedItems.reduce((sum, item) => sum + item.cost, 0);
  await lockedIssue.save();

  await InventoryLog.insertMany(costedItems.map((item) => {
    const product = productsById.get(item.productId);
    const unitCost = item.quantity ? item.cost / item.quantity : 0;
    return {
      productId: item.productId,
      type: 'EXPORT',
      quantity: item.quantity,
      stockBefore: Number(product?.stock || 0),
      stockAfter: Number(product?.stock || 0),
      unitCost,
      totalCost: item.cost,
      referenceType: 'issue',
      referenceId: lockedIssue._id,
      performedBy: userId,
    };
  }));

  try {
    await createCogsJournalIfPossible(lockedIssue);
  } catch (error) {
    console.error('Unable to create COGS journal', {
      issueId: lockedIssue._id.toString(),
      message: error.message,
    });
  }

  return lockedIssue;
}
