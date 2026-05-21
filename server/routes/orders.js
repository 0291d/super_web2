import { Router } from 'express';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { Order } from '../models/Order.js';

const router = Router();

function makeOrderNumber() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BREW-${stamp}-${random}`;
}

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { items = [], email, shippingAddress, billingAddress, paymentMethod, deliveryMethod, notes = '' } = req.body;

    if (!email || !shippingAddress || !items.length) {
      return res.status(400).json({ message: 'Email, shipping address, and cart items are required' });
    }

    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.price || item.unitPrice || 0);
      return {
        productId: item.id || item.productId,
        name: item.name,
        slug: item.slug || '',
        imageUrl: item.imageUrl || item.images?.[0] || '',
        category: item.category || '',
        subcategory: item.subcategory || '',
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingTotal = subtotal >= 150 ? 0 : 15;
    const taxTotal = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shippingTotal + taxTotal) * 100) / 100;

    const order = await Order.create({
      orderNumber: makeOrderNumber(),
      email,
      userId: req.user?._id?.toString() || req.body.userId || '',
      items: normalizedItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: paymentMethod || 'card_demo',
      deliveryMethod: deliveryMethod || 'standard',
      subtotal,
      shippingTotal,
      taxTotal,
      total,
      currency: 'EUR',
      status: 'paid',
      notes,
    });

    res.status(201).json(order);
  } catch (error) {
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

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/:orderNumber', async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
