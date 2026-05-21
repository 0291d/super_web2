import mongoose from 'mongoose';
import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { ServicePage } from '../models/ServicePage.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const includeDrafts = req.query.includeDrafts === 'true';
    const filter = includeDrafts ? {} : { isPublished: true };
    const pages = await ServicePage.find(filter).sort({ order: 1, title: 1 });
    res.json(pages);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ pageId: id }, { slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) lookup.push({ _id: id });

    const page = await ServicePage.findOne({ $or: lookup });
    if (!page) return res.status(404).json({ message: 'Service page not found' });
    res.json(page);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = await ServicePage.create(req.body);
    res.status(201).json(page);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ pageId: id }, { slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) lookup.push({ _id: id });

    const page = await ServicePage.findOneAndUpdate({ $or: lookup }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!page) return res.status(404).json({ message: 'Service page not found' });
    res.json(page);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ pageId: id }, { slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) lookup.push({ _id: id });

    const page = await ServicePage.findOneAndDelete({ $or: lookup });
    if (!page) return res.status(404).json({ message: 'Service page not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
