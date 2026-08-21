import { User } from '../models/User.js';
import { verifyToken } from '../utils/token.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = verifyToken(token);

    if (!payload?.sub) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted === true || ['locked', 'inactive'].includes(user.status)) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = token ? verifyToken(token) : null;

    if (payload?.sub) {
      const user = await User.findById(payload.sub);
      if (user && user.isDeleted !== true && !['locked', 'inactive'].includes(user.status)) {
        req.user = user;
      }
    }

    next();
  } catch {
    next();
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
}
