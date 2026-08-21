import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';

const router = Router();
const staffRoles = ['warehouse', 'accountant'];
const statuses = ['active', 'locked', 'inactive'];
const roles = ['user', 'admin', ...staffRoles];

function serializeUser(user) {
  const serialized = user.toJSON();
  return {
    ...serialized,
    status: serialized.status || 'active',
    isDeleted: serialized.isDeleted === true,
  };
}

function activeUserFilter(includeDeleted = false) {
  if (includeDeleted) return {};
  return {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSelf(req, userId) {
  return req.user._id.toString() === userId.toString();
}

async function loadUser(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }

  return user;
}

router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const { search = '', role = 'all', status = 'all', includeDeleted = 'false' } = req.query;

    const filter = activeUserFilter(includeDeleted === 'true');

    if (roles.includes(role)) {
      filter.role = role;
    }

    if (statuses.includes(status)) {
      filter.$and = [
        ...(filter.$and || []),
        status === 'active'
          ? { $or: [{ status: 'active' }, { status: { $exists: false } }] }
          : { status },
      ];
    }

    const query = String(search).trim();
    if (query) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({
      users: users.map(serializeUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await loadUser(req, res);
    if (!user) return;

    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/staff', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { firstName = '', lastName = '', password, role } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Email and password with at least 8 characters are required' });
    }

    if (!staffRoles.includes(role)) {
      return res.status(400).json({ message: 'Staff role must be warehouse or accountant' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash: await hashPassword(password),
      role,
      status: 'active',
      isDeleted: false,
      updatedBy: req.user._id,
    });

    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await loadUser(req, res);
    if (!user) return;

    const { firstName, lastName, role, status } = req.body;
    const email = req.body.email === undefined ? undefined : normalizeEmail(req.body.email);

    if (user.role === 'admin' && role !== undefined && role !== 'admin') {
      return res.status(400).json({ message: 'Admin role cannot be changed here' });
    }

    if (role !== undefined) {
      if (!staffRoles.includes(role)) {
        return res.status(400).json({ message: 'Role must be warehouse or accountant' });
      }
      if (!staffRoles.includes(user.role)) {
        return res.status(400).json({ message: 'Only staff roles can be changed here' });
      }
      user.role = role;
    }

    if (status !== undefined) {
      if (!statuses.includes(status)) {
        return res.status(400).json({ message: 'Status must be active, locked, or inactive' });
      }
      if (isSelf(req, user._id) && status !== 'active') {
        return res.status(400).json({ message: 'Admin cannot lock or deactivate their own account' });
      }
      user.status = status;
    }

    if (email !== undefined) {
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
      if (duplicate) {
        return res.status(409).json({ message: 'Email is already registered' });
      }
      user.email = email;
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    user.updatedBy = req.user._id;

    await user.save();
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await loadUser(req, res);
    if (!user) return;

    const { status } = req.body;
    if (!statuses.includes(status)) {
      return res.status(400).json({ message: 'Status must be active, locked, or inactive' });
    }

    if (isSelf(req, user._id) && status !== 'active') {
      return res.status(400).json({ message: 'Admin cannot lock or deactivate their own account' });
    }

    user.status = status;
    user.updatedBy = req.user._id;
    await user.save();

    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/reset-password', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await loadUser(req, res);
    if (!user) return;

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password with at least 8 characters is required' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.updatedBy = req.user._id;
    await user.save();

    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await loadUser(req, res);
    if (!user) return;

    if (isSelf(req, user._id)) {
      return res.status(400).json({ message: 'Admin cannot delete their own account' });
    }

    user.isDeleted = true;
    user.status = 'inactive';
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    user.updatedBy = req.user._id;
    await user.save();

    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
