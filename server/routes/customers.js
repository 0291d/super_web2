import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    const emails = users.map((user) => user.email);

    const orderStats = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          email: { $in: emails },
        },
      },
      {
        $group: {
          _id: '$email',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    const statsByKey = new Map(orderStats.map((item) => [item._id, item]));
    const customers = users.map((user) => {
      const serialized = user.toJSON();
      const stats = statsByKey.get(serialized.email);

      return {
        ...serialized,
        orderCount: stats?.orderCount || 0,
        totalSpent: stats?.totalSpent || 0,
        lastOrderAt: stats?.lastOrderAt || null,
      };
    });

    res.json({
      total: customers.length,
      newsletterCount: customers.filter((customer) => customer.newsletter).length,
      customers,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
