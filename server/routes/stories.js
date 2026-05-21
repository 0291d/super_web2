import mongoose from 'mongoose';
import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { Story } from '../models/Story.js';

const router = Router();

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactMatch(value) {
  return new RegExp(`^${escapeRegExp(value)}$`, 'i');
}

router.get('/', async (req, res, next) => {
  try {
    const { category, q, featured, includeDrafts } = req.query;
    const filter = {};

    if (includeDrafts !== 'true') filter.isPublished = true;
    if (category) filter.category = exactMatch(String(category));
    if (featured === 'true') filter.isFeatured = true;
    if (q) {
      const query = new RegExp(escapeRegExp(String(q)), 'i');
      filter.$or = [{ title: query }, { excerpt: query }, { category: query }, { tags: query }];
    }

    const stories = await Story.find(filter).sort({ isFeatured: -1, publishedAt: -1, title: 1 });
    res.json(stories);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ storyId: id }, { slug: id }];

    if (mongoose.Types.ObjectId.isValid(id)) lookup.push({ _id: id });

    const story = await Story.findOne({ $or: lookup });
    if (!story) return res.status(404).json({ message: 'Story not found' });

    res.json(story);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const story = await Story.create(req.body);
    res.status(201).json(story);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ storyId: id }, { slug: id }];

    if (mongoose.Types.ObjectId.isValid(id)) lookup.push({ _id: id });

    const story = await Story.findOneAndUpdate({ $or: lookup }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!story) return res.status(404).json({ message: 'Story not found' });

    res.json(story);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const lookup = [{ storyId: id }, { slug: id }];

    if (mongoose.Types.ObjectId.isValid(id)) lookup.push({ _id: id });

    const story = await Story.findOneAndDelete({ $or: lookup });
    if (!story) return res.status(404).json({ message: 'Story not found' });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
