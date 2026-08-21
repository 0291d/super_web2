import mongoose from 'mongoose';
import { Router } from 'express';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';
import { AccountingJournal } from '../models/AccountingJournal.js';
import { AccountingAdjustment } from '../models/AccountingAdjustment.js';
import { AccountingException } from '../models/AccountingException.js';
import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { InventoryIssue } from '../models/InventoryIssue.js';
import { Reconciliation } from '../models/Reconciliation.js';
import {
  applyAdjustment,
  cancelAdjustment,
  cancelException,
  confirmReconciliation,
  createAccountingException,
  createAdjustment,
  createReconciliation,
  resolveException,
  startException,
  updateException,
  updateReconciliation,
} from '../services/accountingControls.js';

const router = Router();
const canViewAccounting = authorizeRoles('accountant', 'admin');
const canActAccounting = authorizeRoles('accountant');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function totals(lines = []) {
  return lines.reduce(
    (sum, line) => ({
      debit: sum.debit + Number(line.debit || 0),
      credit: sum.credit + Number(line.credit || 0),
    }),
    { debit: 0, credit: 0 },
  );
}

async function serializeJournal(journal) {
  const data = journal.toJSON();
  const order = data.orderId ? await Order.findById(data.orderId).select('orderNumber total taxTotal shippingTotal status paymentMethod').lean() : null;
  return {
    ...data,
    order,
    totals: totals(data.lines),
  };
}

async function serializeReconciliation(reconciliation) {
  const data = reconciliation.toJSON();
  const orderIds = [...new Set(data.items.map((item) => item.orderId).filter(Boolean).map(String))];
  const orders = orderIds.length ? await Order.find({ _id: { $in: orderIds } }).select('orderNumber total status paymentMethod').lean() : [];
  const ordersById = new Map(orders.map((order) => [order._id.toString(), order]));
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      order: item.orderId ? ordersById.get(String(item.orderId)) || null : null,
    })),
  };
}

async function serializeAdjustment(adjustment) {
  const data = adjustment.toJSON();
  const journal = await AccountingJournal.findById(data.journalId).select('journalNumber journalType status description').lean();
  const reconciliation = data.reconciliationId ? await Reconciliation.findById(data.reconciliationId).select('reconciliationNumber source status').lean() : null;
  return { ...data, journal, reconciliation };
}

async function serializeException(exception) {
  const data = exception.toJSON();
  const [order, payment, issue, journals] = await Promise.all([
    data.orderId ? Order.findById(data.orderId).select('orderNumber total status paymentMethod').lean() : null,
    data.paymentId ? Payment.findById(data.paymentId).select('paymentNumber method amount status transactionCode').lean() : null,
    data.inventoryIssueId ? InventoryIssue.findById(data.inventoryIssueId).select('issueNumber totalCost status').lean() : null,
    AccountingJournal.find({ sourceType: 'exception', sourceId: exception._id }).select('journalNumber journalType status description').lean(),
  ]);
  return { ...data, order, payment, inventoryIssue: issue, journals };
}

router.get('/payments/:id', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Payment not found' });
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ payment });
  } catch (error) {
    next(error);
  }
});

router.get('/journals', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    const { journalType = 'all', status = 'all', search = '', dateFrom, dateTo } = req.query;
    const filter = {};
    if (['REVENUE', 'COGS', 'TAX', 'ADJUSTMENT', 'REFUND'].includes(journalType)) filter.journalType = journalType;
    if (['auto', 'confirmed', 'need_adjustment', 'adjusted'].includes(status)) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(String(dateFrom));
      if (dateTo) filter.createdAt.$lte = new Date(String(dateTo));
    }
    if (search) filter.journalNumber = { $regex: escapeRegExp(String(search).trim()), $options: 'i' };

    const journals = await AccountingJournal.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ journals: await Promise.all(journals.map(serializeJournal)) });
  } catch (error) {
    next(error);
  }
});

router.get('/journals/:id', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Journal not found' });
    const journal = await AccountingJournal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    res.json({ journal: await serializeJournal(journal) });
  } catch (error) {
    next(error);
  }
});

async function updateAutoJournalStatus(req, res, status) {
  const journal = await AccountingJournal.findOneAndUpdate(
    { _id: req.params.id, status: 'auto' },
    { $set: { status, confirmedBy: req.user._id, confirmedAt: new Date() } },
    { new: true, runValidators: true },
  );
  if (!journal) return res.status(409).json({ message: 'Only auto journals can be updated in Sprint 4' });
  return res.json({ journal: await serializeJournal(journal) });
}

router.post('/journals/:id/confirm', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Journal not found' });
    return updateAutoJournalStatus(req, res, 'confirmed');
  } catch (error) {
    next(error);
  }
});

router.post('/journals/:id/need-adjustment', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Journal not found' });
    return updateAutoJournalStatus(req, res, 'need_adjustment');
  } catch (error) {
    next(error);
  }
});

router.get('/reconciliations', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    const { source = 'all', status = 'all' } = req.query;
    const filter = {};
    if (['VNPAY', 'COD', 'BANK'].includes(source)) filter.source = source;
    if (['pending', 'matched', 'difference'].includes(status)) filter.status = status;
    const reconciliations = await Reconciliation.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ reconciliations: await Promise.all(reconciliations.map(serializeReconciliation)) });
  } catch (error) {
    next(error);
  }
});

router.get('/reconciliations/:id', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Reconciliation not found' });
    const reconciliation = await Reconciliation.findById(req.params.id);
    if (!reconciliation) return res.status(404).json({ message: 'Reconciliation not found' });
    res.json({ reconciliation: await serializeReconciliation(reconciliation) });
  } catch (error) {
    next(error);
  }
});

router.post('/reconciliations', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    const reconciliation = await createReconciliation({ ...req.body, accountantId: req.user._id });
    res.status(201).json({ reconciliation: await serializeReconciliation(reconciliation) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/reconciliations/:id', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Reconciliation not found' });
    const reconciliation = await updateReconciliation(req.params.id, req.body);
    res.json({ reconciliation: await serializeReconciliation(reconciliation) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.post('/reconciliations/:id/confirm', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Reconciliation not found' });
    const reconciliation = await confirmReconciliation(req.params.id);
    res.json({ reconciliation: await serializeReconciliation(reconciliation) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.get('/adjustments', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;
    const filter = {};
    if (['pending', 'completed', 'cancelled'].includes(status)) filter.status = status;
    const adjustments = await AccountingAdjustment.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ adjustments: await Promise.all(adjustments.map(serializeAdjustment)) });
  } catch (error) {
    next(error);
  }
});

router.get('/adjustments/:id', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Adjustment not found' });
    const adjustment = await AccountingAdjustment.findById(req.params.id);
    if (!adjustment) return res.status(404).json({ message: 'Adjustment not found' });
    res.json({ adjustment: await serializeAdjustment(adjustment) });
  } catch (error) {
    next(error);
  }
});

router.post('/adjustments', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    const adjustment = await createAdjustment({ ...req.body, accountantId: req.user._id });
    res.status(201).json({ adjustment: await serializeAdjustment(adjustment) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.post('/adjustments/:id/apply', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Adjustment not found' });
    const adjustment = await applyAdjustment(req.params.id);
    res.json({ adjustment: await serializeAdjustment(adjustment) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.post('/adjustments/:id/cancel', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Adjustment not found' });
    const adjustment = await cancelAdjustment(req.params.id);
    res.json({ adjustment: await serializeAdjustment(adjustment) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.get('/exceptions', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    const { exceptionType = 'all', status = 'all' } = req.query;
    const filter = {};
    if (['RETURN', 'REFUND', 'UNDERPAYMENT', 'OVERPAYMENT', 'CANCEL_AFTER_EXPORT', 'RECONCILIATION_DIFFERENCE'].includes(exceptionType)) filter.exceptionType = exceptionType;
    if (['pending', 'processing', 'resolved', 'cancelled'].includes(status)) filter.status = status;
    const exceptions = await AccountingException.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ exceptions: await Promise.all(exceptions.map(serializeException)) });
  } catch (error) {
    next(error);
  }
});

router.get('/exceptions/:id', requireAuth, canViewAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Exception not found' });
    const exception = await AccountingException.findById(req.params.id);
    if (!exception) return res.status(404).json({ message: 'Exception not found' });
    res.json({ exception: await serializeException(exception) });
  } catch (error) {
    next(error);
  }
});

router.post('/exceptions', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    const exception = await createAccountingException({ ...req.body, accountantId: req.user._id });
    res.status(201).json({ exception: await serializeException(exception) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.patch('/exceptions/:id', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Exception not found' });
    const exception = await updateException(req.params.id, req.body);
    res.json({ exception: await serializeException(exception) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.post('/exceptions/:id/start', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Exception not found' });
    const exception = await startException(req.params.id);
    res.json({ exception: await serializeException(exception) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.post('/exceptions/:id/resolve', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Exception not found' });
    const exception = await resolveException(req.params.id);
    res.json({ exception: await serializeException(exception) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

router.post('/exceptions/:id/cancel', requireAuth, canActAccounting, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Exception not found' });
    const exception = await cancelException(req.params.id);
    res.json({ exception: await serializeException(exception) });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
});

export default router;
