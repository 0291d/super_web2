import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createToken } from '../utils/token.js';

const router = Router();

function publicUser(user) {
  return user.toJSON();
}

router.post('/register', async (req, res, next) => {
  try {
    const { firstName = '', lastName = '', email, password, newsletter = false } = req.body;

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Email and password with at least 8 characters are required' });
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
      role: 'user',
      newsletter,
    });

    const token = createToken({ sub: user._id.toString(), role: user.role });
    res.status(201).json({ user: publicUser(user), token });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isDeleted === true || ['locked', 'inactive'].includes(user.status)) {
      return res.status(403).json({ message: 'Account is not active' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken({ sub: user._id.toString(), role: user.role });
    res.json({ user: publicUser(user), token });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { firstName = '', lastName = '', newsletter, addresses } = req.body;

    req.user.firstName = firstName;
    req.user.lastName = lastName;
    if (typeof newsletter === 'boolean') {
      req.user.newsletter = newsletter;
    }
    if (Array.isArray(addresses)) {
      req.user.addresses = addresses.slice(0, 5).map((address) => ({
        label: address.label || 'Preferred',
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        address1: address.address1 || '',
        city: address.city || '',
        postalCode: address.postalCode || '',
        country: address.country || 'Vietnam',
        phone: address.phone || '',
      }));
    }

    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
});

router.patch('/password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Current password and a new password with at least 8 characters are required' });
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, req.user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    req.user.passwordHash = await hashPassword(newPassword);
    await req.user.save();

    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
});

export default router;
