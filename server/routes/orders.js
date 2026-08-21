import crypto from 'crypto';
import { Router } from 'express';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import {
  createVnpayPayment,
  getVnpayAmountParam,
  queryVnpayTransaction,
  refundVnpayTransaction,
  verifyVnpayReturn,
} from '../utils/vnpay.js';
import { markPaymentPaid, paymentMethodForOrder } from '../services/payments.js';

const router = Router();

function makeOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BREW-${stamp}-${random}`;
}

function makePublicToken() {
  return crypto.randomBytes(24).toString('hex');
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

async function calculateAccountDiscount(req, subtotal) {
  if (!req.user) {
    return { discountRate: 0, discountTotal: 0 };
  }

  const userId = req.user._id.toString();
  const previousOrderCount = await Order.countDocuments({
    $or: [{ userId }, { email: req.user.email }],
    status: { $ne: 'cancelled' },
  });
  const discountRate = previousOrderCount === 0 ? 0.1 : subtotal > 500 ? 0.05 : 0;

  return {
    discountRate,
    discountTotal: roundMoney(subtotal * discountRate),
  };
}

function clientIp(req) {
  const value = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  return value === '::1' || value === '::ffff:127.0.0.1' ? '127.0.0.1' : value;
}

async function buildOrderItems(items) {
  const requestedItems = new Map();

  for (const item of items) {
    const id = String(item.id || item.productId || '').trim();
    const quantity = Number(item.quantity);
    if (!id || !Number.isInteger(quantity) || quantity < 1) {
      throw Object.assign(new Error('Cart contains invalid items'), { statusCode: 400 });
    }
    requestedItems.set(id, (requestedItems.get(id) || 0) + quantity);
  }

  const ids = [...requestedItems.keys()];
  const products = await Product.find({ $or: [{ productId: { $in: ids } }, { slug: { $in: ids } }] });
  const productsById = new Map();
  products.forEach((product) => {
    productsById.set(product.productId, product);
    productsById.set(product.slug, product);
  });

  const currencies = new Set();
  const normalizedItems = ids.map((id) => {
    const product = productsById.get(id);
    const quantity = requestedItems.get(id);
    if (!product) {
      throw Object.assign(new Error('One or more products no longer exist'), { statusCode: 400 });
    }
    if (product.stock < quantity) {
      throw Object.assign(new Error(`${product.name} does not have enough stock`), { statusCode: 409 });
    }
    currencies.add(product.currency || 'EUR');
    return {
      databaseId: product._id,
      productId: product.productId,
      name: product.name,
      slug: product.slug || '',
      imageUrl: product.imageUrl || product.images?.[0] || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      quantity,
      unitPrice: product.price,
      lineTotal: roundMoney(product.price * quantity),
    };
  });

  if (currencies.size !== 1) {
    throw Object.assign(new Error('Cart items must use the same currency'), { statusCode: 400 });
  }

  return { normalizedItems, currency: [...currencies][0] };
}

async function restoreInventory(items) {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.databaseId, [
        { $set: { stock: { $add: ['$stock', item.quantity] }, inStock: true } },
      ], { updatePipeline: true }),
    ),
  );
}

async function restoreOrderInventory(order) {
  const products = await Product.find({ productId: { $in: order.items.map((item) => item.productId) } });
  const ids = new Map(products.map((product) => [product.productId, product._id]));
  await restoreInventory(
    order.items.filter((item) => ids.has(item.productId)).map((item) => ({ databaseId: ids.get(item.productId), quantity: item.quantity })),
  );
}

async function reserveInventory(items) {
  const reserved = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.databaseId, stock: { $gte: item.quantity } },
        [{ $set: { stock: { $subtract: ['$stock', item.quantity] }, inStock: { $gt: [{ $subtract: ['$stock', item.quantity] }, 0] } } }],
        { new: true, updatePipeline: true },
      );
      if (!updated) {
        throw Object.assign(new Error(`${item.name} does not have enough stock`), { statusCode: 409 });
      }
      reserved.push(item);
    }
  } catch (error) {
    await restoreInventory(reserved);
    throw error;
  }
}

function vnpayAmountMatches(order, query) {
  return Number(query.vnp_Amount) === getVnpayAmountParam(order);
}

async function markVnpayOrderFailed(order) {
  if (order.status === 'pending') {
    order.status = 'cancelled';
    if (order.inventoryReserved && !order.inventoryRestored) {
      await restoreOrderInventory(order);
      order.inventoryRestored = true;
    }
  }
}

async function applyVnpayResult(order, query) {
  const paymentSucceeded = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';

  order.paymentResponseCode = String(query.vnp_ResponseCode || '');
  order.paymentTransactionStatus = String(query.vnp_TransactionStatus || '');
  order.paymentTransactionNo = String(query.vnp_TransactionNo || order.paymentTransactionNo || '');
  order.paymentBankCode = String(query.vnp_BankCode || order.paymentBankCode || '');
  order.paymentPayDate = String(query.vnp_PayDate || order.paymentPayDate || '');

  if (paymentSucceeded) {
    order.status = 'paid';
    order.paidAt = order.paidAt || new Date();
  } else {
    await markVnpayOrderFailed(order);
  }
}

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { items = [], email, shippingAddress, billingAddress, paymentMethod = 'card_demo', deliveryMethod, notes = '' } = req.body;
    if (!email || !shippingAddress || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Email, shipping address, and cart items are required' });
    }

    const { normalizedItems, currency } = await buildOrderItems(items);
    const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const { discountRate, discountTotal } = await calculateAccountDiscount(req, subtotal);
    const discountedSubtotal = roundMoney(Math.max(0, subtotal - discountTotal));
    const shippingTotal = subtotal >= 150 ? 0 : 15;
    const taxTotal = roundMoney(discountedSubtotal * 0.08);
    const total = roundMoney(discountedSubtotal + shippingTotal + taxTotal);
    const orderNumber = makeOrderNumber();

    await reserveInventory(normalizedItems);
    try {
      const order = await Order.create({
        orderNumber,
        email,
        userId: req.user?._id?.toString() || '',
        items: normalizedItems.map(({ databaseId: _databaseId, ...item }) => item),
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        paymentProvider: paymentMethod === 'vnpay' ? 'vnpay' : 'demo',
        deliveryMethod: deliveryMethod || 'standard',
        subtotal,
        discountRate,
        discountTotal,
        shippingTotal,
        taxTotal,
        total,
        currency,
        status: ['vnpay', 'cod'].includes(paymentMethod) ? 'pending' : 'paid',
        notes,
        publicToken: makePublicToken(),
        inventoryReserved: true,
        paidAt: ['vnpay', 'cod'].includes(paymentMethod) ? undefined : new Date(),
      });

      if (paymentMethod === 'vnpay') {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const payment = createVnpayPayment({
          order,
          ipAddress: clientIp(req),
          returnUrl: process.env.VNPAY_RETURN_URL || `${baseUrl}/api/orders/payments/vnpay/return`,
        });
        order.paymentRequestDate = payment.paymentRequestDate;
        order.paymentAmountVnd = payment.paymentAmountVnd;
        await order.save();
        return res.status(201).json({ order, paymentUrl: payment.paymentUrl });
      }

      try {
        if (order.status === 'paid') await markPaymentPaid(order, { method: paymentMethodForOrder(order), paidAt: order.paidAt || new Date() });
      } catch (error) {
        console.error('Unable to record demo payment', { orderId: order._id.toString(), message: error.message });
      }

      return res.status(201).json(order);
    } catch (error) {
      await restoreInventory(normalizedItems);
      throw error;
    }
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.get('/payments/vnpay/return', async (req, res, next) => {
  try {
    const isValidSignature = verifyVnpayReturn(req.query);
    const orderNumber = String(req.query.vnp_TxnRef || '');
    const order = orderNumber ? await Order.findOne({ orderNumber }) : null;
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

    if (!order) {
      return res.redirect(`${clientOrigin}/checkout?paymentStatus=missing_order`);
    }

    if (!isValidSignature) {
      return res.redirect(
        `${clientOrigin}/order-confirmation/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(order.publicToken || '')}&paymentStatus=invalid_signature`,
      );
    }

    if (!vnpayAmountMatches(order, req.query)) {
      await markVnpayOrderFailed(order);
      await order.save();
      return res.redirect(
        `${clientOrigin}/order-confirmation/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(order.publicToken || '')}&paymentStatus=invalid_amount`,
      );
    }

    const paymentSucceeded =
      req.query.vnp_ResponseCode === '00' && req.query.vnp_TransactionStatus === '00';

    await applyVnpayResult(order, req.query);
    await order.save();
    if (paymentSucceeded) {
      try {
        await markPaymentPaid(order, {
          method: 'VNPAY',
          transactionCode: String(req.query.vnp_TransactionNo || order.paymentTransactionNo || ''),
          paidAt: order.paidAt || new Date(),
        });
      } catch (error) {
        console.error('Unable to record VNPay payment', { orderId: order._id.toString(), message: error.message });
      }
    }
    const paymentStatus = paymentSucceeded ? 'paid' : 'failed';
    return res.redirect(
      `${clientOrigin}/order-confirmation/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(order.publicToken || '')}&paymentStatus=${paymentStatus}`,
    );
  } catch (error) {
    next(error);
  }
});

router.get('/payments/vnpay/ipn', async (req, res, next) => {
  try {
    if (!verifyVnpayReturn(req.query)) {
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const order = await Order.findOne({ orderNumber: String(req.query.vnp_TxnRef || '') });
    if (!order) return res.json({ RspCode: '01', Message: 'Order not found' });

    if (!vnpayAmountMatches(order, req.query)) {
      return res.json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (order.paymentResponseCode || order.status !== 'pending') {
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    await applyVnpayResult(order, req.query);
    await order.save();
    try {
      await markPaymentPaid(order, {
        method: 'VNPAY',
        transactionCode: String(req.query.vnp_TransactionNo || order.paymentTransactionNo || ''),
        paidAt: order.paidAt || new Date(),
      });
    } catch (error) {
      console.error('Unable to record VNPay payment', { orderId: order._id.toString(), message: error.message });
    }

    return res.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    next(error);
  }
});

router.post('/payments/vnpay/query/:orderNumber', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentProvider !== 'vnpay') {
      return res.status(400).json({ message: 'Order was not paid with VNPay' });
    }

    const result = await queryVnpayTransaction({ order, ipAddress: clientIp(req) });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/payments/vnpay/refund/:orderNumber', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentProvider !== 'vnpay') {
      return res.status(400).json({ message: 'Order was not paid with VNPay' });
    }
    if (order.status !== 'paid' || !order.paymentTransactionNo) {
      return res.status(409).json({ message: 'Only paid VNPay orders with a transaction number can be refunded' });
    }

    const amountVnd = req.body?.amountVnd;
    const transactionType = req.body?.transactionType || (amountVnd ? '03' : '02');
    const result = await refundVnpayTransaction({
      order,
      amountVnd,
      transactionType,
      createdBy: req.user?.email || req.user?.name || 'admin',
      ipAddress: clientIp(req),
    });

    order.refundResponseCode = String(result?.vnp_ResponseCode || '');
    order.refundStatus = String(result?.vnp_TransactionStatus || result?.vnp_Message || '');
    order.refundTransactionNo = String(result?.vnp_TransactionNo || '');
    if (result?.vnp_ResponseCode === '00') {
      order.refundedAt = new Date();
    }
    await order.save();

    res.json({ order, refund: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message, details: error.details });
    next(error);
  }
});

router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [{ userId: req.user._id.toString() }, { email: req.user.email }],
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const allowedStatuses = ['pending', 'paid', 'processing', 'completed', 'cancelled'];
    const { status } = req.body;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'cancelled' && status !== 'cancelled') {
      return res.status(409).json({ message: 'Cancelled orders cannot be reopened because inventory was released' });
    }
    if (status === 'cancelled' && order.status !== 'cancelled' && order.inventoryReserved && !order.inventoryRestored) {
      await restoreOrderInventory(order);
      order.inventoryRestored = true;
    }
    if (!order.publicToken) order.publicToken = makePublicToken();
    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/:orderNumber', optionalAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const tokenMatches = order.publicToken && req.query.token === order.publicToken;
    const ownsOrder = req.user && (req.user.role === 'admin' || order.userId === req.user._id.toString() || order.email === req.user.email);
    if (!tokenMatches && !ownsOrder) {
      return res.status(403).json({ message: 'Order access denied' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
