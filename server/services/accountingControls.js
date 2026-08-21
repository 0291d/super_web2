import { AccountingAdjustment } from '../models/AccountingAdjustment.js';
import { AccountingException } from '../models/AccountingException.js';
import { AccountingJournal } from '../models/AccountingJournal.js';
import { Payment } from '../models/Payment.js';
import { Reconciliation } from '../models/Reconciliation.js';
import { generateJournalNumber } from './accounting.js';

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

async function nextNumber(Model, prefix, fieldName) {
  const count = await Model.countDocuments();
  return `${prefix}${String(count + 1).padStart(6, '0')}`;
}

export function validateJournalLines(lines = []) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw Object.assign(new Error('Adjustment journal must include at least two lines'), { statusCode: 400 });
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);
    if (debit < 0 || credit < 0) {
      throw Object.assign(new Error('Journal line debit and credit cannot be negative'), { statusCode: 400 });
    }
    if (debit > 0 && credit > 0) {
      throw Object.assign(new Error('A journal line cannot have both debit and credit'), { statusCode: 400 });
    }
    if (!String(line.accountCode || '').trim() || !String(line.accountName || '').trim()) {
      throw Object.assign(new Error('Each journal line must include account code and name'), { statusCode: 400 });
    }
    totalDebit += debit;
    totalCredit += credit;
  }

  if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
    throw Object.assign(new Error('Journal debit and credit totals must balance'), { statusCode: 400 });
  }
}

function paymentFilterForSource(source, fromDate, toDate) {
  const filter = { status: 'paid', paidAt: { $gte: fromDate, $lte: toDate } };
  if (source === 'VNPAY') filter.method = 'VNPAY';
  if (source === 'COD') filter.method = 'COD';
  if (source === 'BANK') filter.method = 'CARD_DEMO';
  return filter;
}

function normalizeActualItems(actualItems = []) {
  return actualItems.map((item) => ({
    paymentId: String(item.paymentId || '').trim(),
    orderId: String(item.orderId || '').trim(),
    transactionCode: String(item.transactionCode || '').trim(),
    actualAmount: Number(item.actualAmount),
  })).filter((item) => Number.isFinite(item.actualAmount) && item.actualAmount >= 0);
}

function actualLookup(actualItems) {
  const lookup = { byTransaction: new Map(), byPayment: new Map(), byOrder: new Map() };
  normalizeActualItems(actualItems).forEach((item) => {
    if (item.transactionCode) lookup.byTransaction.set(item.transactionCode, item);
    if (item.paymentId) lookup.byPayment.set(item.paymentId, item);
    if (item.orderId) lookup.byOrder.set(item.orderId, item);
  });
  return lookup;
}

function computeItem(payment, lookup, hasActualData) {
  const paymentId = payment._id.toString();
  const orderId = payment.orderId?.toString() || '';
  const actual =
    (payment.transactionCode && lookup.byTransaction.get(payment.transactionCode)) ||
    lookup.byPayment.get(paymentId) ||
    (orderId && lookup.byOrder.get(orderId));

  const systemAmount = roundMoney(payment.amount);
  const actualAmount = actual ? roundMoney(actual.actualAmount) : null;
  const difference = actual ? roundMoney(actualAmount - systemAmount) : 0;
  const result = actual ? (Math.round(difference * 100) === 0 ? 'matched' : 'difference') : 'not_received';

  return {
    paymentId: payment._id,
    orderId: payment.orderId,
    transactionCode: payment.transactionCode || '',
    systemAmount,
    actualAmount: hasActualData ? actualAmount : null,
    difference: hasActualData ? difference : 0,
    result: hasActualData ? result : 'not_received',
  };
}

function reconciliationStatus(items, hasActualData) {
  if (!hasActualData) return 'pending';
  return items.every((item) => item.result === 'matched') ? 'matched' : 'difference';
}

async function buildReconciliationItems({ source, fromDate, toDate, actualItems }) {
  const hasActualData = Array.isArray(actualItems);
  const lookup = actualLookup(actualItems);
  const payments = await Payment.find(paymentFilterForSource(source, fromDate, toDate)).sort({ paidAt: 1, createdAt: 1 });
  const items = payments.map((payment) => computeItem(payment, lookup, hasActualData));
  return { items, status: reconciliationStatus(items, hasActualData) };
}

export async function createReconciliation({ source, fromDate, toDate, actualItems, note, accountantId }) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (!['VNPAY', 'COD', 'BANK'].includes(source)) {
    throw Object.assign(new Error('Invalid reconciliation source'), { statusCode: 400 });
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    throw Object.assign(new Error('Invalid reconciliation date range'), { statusCode: 400 });
  }

  const { items, status } = await buildReconciliationItems({ source, fromDate: start, toDate: end, actualItems });
  return Reconciliation.create({
    reconciliationNumber: await nextNumber(Reconciliation, 'RC', 'reconciliationNumber'),
    accountantId,
    source,
    fromDate: start,
    toDate: end,
    items,
    status,
    note: String(note || '').trim(),
  });
}

export async function updateReconciliation(reconciliationId, { actualItems, note }) {
  const reconciliation = await Reconciliation.findById(reconciliationId);
  if (!reconciliation) throw Object.assign(new Error('Reconciliation not found'), { statusCode: 404 });
  if (reconciliation.confirmedAt) throw Object.assign(new Error('Confirmed reconciliations cannot be edited'), { statusCode: 409 });

  const { items, status } = await buildReconciliationItems({
    source: reconciliation.source,
    fromDate: reconciliation.fromDate,
    toDate: reconciliation.toDate,
    actualItems,
  });
  reconciliation.items = items;
  reconciliation.status = status;
  if (note !== undefined) reconciliation.note = String(note || '').trim();
  return reconciliation.save();
}

export async function confirmReconciliation(reconciliationId) {
  const reconciliation = await Reconciliation.findById(reconciliationId);
  if (!reconciliation) throw Object.assign(new Error('Reconciliation not found'), { statusCode: 404 });
  if (reconciliation.confirmedAt) return reconciliation;
  reconciliation.status = reconciliation.items.every((item) => item.result === 'matched') ? 'matched' : 'difference';
  reconciliation.confirmedAt = new Date();
  await reconciliation.save();
  return reconciliation;
}

function snapshotJournal(journal) {
  return {
    journalNumber: journal.journalNumber,
    journalType: journal.journalType,
    sourceType: journal.sourceType,
    sourceId: journal.sourceId,
    orderId: journal.orderId,
    description: journal.description,
    lines: journal.lines.map((line) => ({
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: Number(line.debit || 0),
      credit: Number(line.credit || 0),
    })),
    status: journal.status,
  };
}

export async function createAdjustment({ journalId, reconciliationId, reason, newData, accountantId }) {
  if (!String(reason || '').trim()) throw Object.assign(new Error('Adjustment reason is required'), { statusCode: 400 });
  const journal = await AccountingJournal.findById(journalId);
  if (!journal) throw Object.assign(new Error('Journal not found'), { statusCode: 404 });
  if (!['need_adjustment', 'confirmed'].includes(journal.status)) {
    throw Object.assign(new Error('Only confirmed or need_adjustment journals can be adjusted'), { statusCode: 409 });
  }
  if (newData?.lines) validateJournalLines(newData.lines);

  return AccountingAdjustment.create({
    adjustmentNumber: await nextNumber(AccountingAdjustment, 'ADJ', 'adjustmentNumber'),
    journalId: journal._id,
    reconciliationId: reconciliationId || undefined,
    accountantId,
    reason: String(reason).trim(),
    oldData: snapshotJournal(journal),
    newData,
    status: 'pending',
  });
}

export async function applyAdjustment(adjustmentId) {
  const adjustment = await AccountingAdjustment.findById(adjustmentId);
  if (!adjustment) throw Object.assign(new Error('Adjustment not found'), { statusCode: 404 });
  if (adjustment.status === 'completed') return adjustment;
  if (adjustment.status !== 'pending') throw Object.assign(new Error('Only pending adjustments can be applied'), { statusCode: 409 });

  const journal = await AccountingJournal.findById(adjustment.journalId);
  if (!journal) throw Object.assign(new Error('Journal not found'), { statusCode: 404 });
  const lines = adjustment.newData?.lines;
  validateJournalLines(lines);

  let adjustmentJournal = await AccountingJournal.findOne({
    journalType: 'ADJUSTMENT',
    sourceType: 'exception',
    sourceId: adjustment._id,
  });
  if (!adjustmentJournal) {
    try {
      adjustmentJournal = await AccountingJournal.create({
        journalNumber: await generateJournalNumber(),
        journalType: 'ADJUSTMENT',
        sourceType: 'exception',
        sourceId: adjustment._id,
        orderId: journal.orderId,
        description: `Adjustment for ${journal.journalNumber}: ${adjustment.reason}`,
        lines,
        status: 'auto',
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      adjustmentJournal = await AccountingJournal.findOne({
        journalType: 'ADJUSTMENT',
        sourceType: 'exception',
        sourceId: adjustment._id,
      });
    }
  }

  adjustment.status = 'completed';
  adjustment.adjustedAt = adjustment.adjustedAt || new Date();
  await adjustment.save();

  if (journal.status !== 'adjusted') {
    journal.status = 'adjusted';
    await journal.save();
  }

  return adjustment;
}

export async function cancelAdjustment(adjustmentId) {
  const adjustment = await AccountingAdjustment.findOneAndUpdate(
    { _id: adjustmentId, status: 'pending' },
    { $set: { status: 'cancelled' } },
    { new: true, runValidators: true },
  );
  if (!adjustment) throw Object.assign(new Error('Only pending adjustments can be cancelled'), { statusCode: 409 });
  return adjustment;
}

export async function createAccountingException(input) {
  const exceptionType = String(input.exceptionType || '').trim();
  if (!['RETURN', 'REFUND', 'UNDERPAYMENT', 'OVERPAYMENT', 'CANCEL_AFTER_EXPORT', 'RECONCILIATION_DIFFERENCE'].includes(exceptionType)) {
    throw Object.assign(new Error('Invalid accounting exception type'), { statusCode: 400 });
  }
  if (!String(input.description || '').trim()) throw Object.assign(new Error('Exception description is required'), { statusCode: 400 });

  if (input.reconciliationId && input.paymentId && ['RECONCILIATION_DIFFERENCE', 'UNDERPAYMENT', 'OVERPAYMENT'].includes(exceptionType)) {
    const existing = await AccountingException.findOne({
      reconciliationId: input.reconciliationId,
      paymentId: input.paymentId,
      exceptionType,
      status: { $in: ['pending', 'processing'] },
    });
    if (existing) return existing;
  }

  return AccountingException.create({
    exceptionNumber: await nextNumber(AccountingException, 'EXC', 'exceptionNumber'),
    exceptionType,
    orderId: input.orderId || undefined,
    paymentId: input.paymentId || undefined,
    inventoryIssueId: input.inventoryIssueId || undefined,
    reconciliationId: input.reconciliationId || undefined,
    accountantId: input.accountantId,
    description: String(input.description).trim(),
    amount: Math.abs(roundMoney(input.amount)),
    handlingAction: String(input.handlingAction || '').trim(),
  });
}

export async function updateException(exceptionId, input) {
  const exception = await AccountingException.findById(exceptionId);
  if (!exception) throw Object.assign(new Error('Exception not found'), { statusCode: 404 });
  if (exception.status === 'resolved' || exception.status === 'cancelled') {
    throw Object.assign(new Error('Closed exceptions cannot be edited'), { statusCode: 409 });
  }
  if (input.description !== undefined) exception.description = String(input.description || '').trim();
  if (input.handlingAction !== undefined) exception.handlingAction = String(input.handlingAction || '').trim();
  if (input.amount !== undefined) exception.amount = Math.abs(roundMoney(input.amount));
  return exception.save();
}

export async function startException(exceptionId) {
  const exception = await AccountingException.findOneAndUpdate(
    { _id: exceptionId, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: true, runValidators: true },
  );
  if (!exception) throw Object.assign(new Error('Only pending exceptions can start processing'), { statusCode: 409 });
  return exception;
}

export async function resolveException(exceptionId) {
  const exception = await AccountingException.findById(exceptionId);
  if (!exception) throw Object.assign(new Error('Exception not found'), { statusCode: 404 });
  if (exception.status === 'resolved') return exception;
  if (!['pending', 'processing'].includes(exception.status)) {
    throw Object.assign(new Error('Only open exceptions can be resolved'), { statusCode: 409 });
  }

  exception.status = 'resolved';
  exception.resolvedAt = exception.resolvedAt || new Date();
  return exception.save();
}

export async function cancelException(exceptionId) {
  const exception = await AccountingException.findOneAndUpdate(
    { _id: exceptionId, status: { $in: ['pending', 'processing'] } },
    { $set: { status: 'cancelled' } },
    { new: true, runValidators: true },
  );
  if (!exception) throw Object.assign(new Error('Only open exceptions can be cancelled'), { statusCode: 409 });
  return exception;
}
