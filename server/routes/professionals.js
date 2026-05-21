import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { Professional } from '../models/Professional.js';
import { ProfessionalInquiry } from '../models/ProfessionalInquiry.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const page = await Professional.findOne({ pageId: 'professionals', isPublished: true });
    if (!page) return res.status(404).json({ message: 'Professionals page not found' });
    res.json(page);
  } catch (error) {
    next(error);
  }
});

router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const page = await Professional.findOne({ pageId: 'professionals' });
    if (!page) return res.status(404).json({ message: 'Professionals page not found' });
    res.json(page);
  } catch (error) {
    next(error);
  }
});

router.put('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = await Professional.findOneAndUpdate(
      { pageId: 'professionals' },
      { ...req.body, pageId: 'professionals' },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(page);
  } catch (error) {
    next(error);
  }
});

router.post('/inquiries', async (req, res, next) => {
  try {
    const inquiry = await ProfessionalInquiry.create(req.body);
    res.status(201).json(inquiry);
  } catch (error) {
    next(error);
  }
});

router.get('/inquiries', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const inquiries = await ProfessionalInquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    next(error);
  }
});

router.patch('/inquiries/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const inquiry = await ProfessionalInquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.json(inquiry);
  } catch (error) {
    next(error);
  }
});

router.delete('/inquiries/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const inquiry = await ProfessionalInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
