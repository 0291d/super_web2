import { AccountingJournal } from '../models/AccountingJournal.js';
import { InventoryIssue } from '../models/InventoryIssue.js';
import { Order } from '../models/Order.js';

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export async function generateJournalNumber() {
  const count = await AccountingJournal.countDocuments();
  return `JV${String(count + 1).padStart(6, '0')}`;
}

async function createJournalIfMissing(input) {
  const existing = await AccountingJournal.findOne({
    journalType: input.journalType,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });
  if (existing) return existing;

  try {
    return await AccountingJournal.create({
      journalNumber: await generateJournalNumber(),
      status: 'auto',
      ...input,
    });
  } catch (error) {
    if (error.code === 11000) {
      return AccountingJournal.findOne({
        journalType: input.journalType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      });
    }
    throw error;
  }
}

export async function createRevenueJournalIfPossible(payment) {
  if (payment.status !== 'paid') return null;

  const order = await Order.findById(payment.orderId);
  if (!order) throw Object.assign(new Error('Order not found for revenue journal'), { statusCode: 404 });

  const productRevenue = roundMoney(Number(order.subtotal || 0) - Number(order.discountTotal || 0));
  const taxTotal = roundMoney(order.taxTotal);
  const shippingTotal = roundMoney(order.shippingTotal);
  const expectedTotal = roundMoney(productRevenue + taxTotal + shippingTotal);
  const paidAmount = roundMoney(payment.amount);

  if (Math.round(expectedTotal * 100) !== Math.round(paidAmount * 100)) {
    throw new Error('Order totals do not match payment amount; revenue journal skipped');
  }

  if (shippingTotal !== 0) {
    throw new Error('Shipping account is not configured; revenue journal skipped');
  }

  if (productRevenue < 0 || taxTotal < 0) {
    throw new Error('Order revenue or tax is invalid; revenue journal skipped');
  }

  return createJournalIfMissing({
    journalType: 'REVENUE',
    sourceType: 'payment',
    sourceId: payment._id,
    orderId: order._id,
    description: `Revenue for order ${order.orderNumber}`,
    lines: [
      { accountCode: payment.method === 'VNPAY' ? '1121' : '1111', accountName: payment.method === 'VNPAY' ? 'Bank deposits' : 'Cash', debit: paidAmount, credit: 0 },
      { accountCode: '5111', accountName: 'Product revenue', debit: 0, credit: productRevenue },
      { accountCode: '33311', accountName: 'VAT payable', debit: 0, credit: taxTotal },
    ],
  });
}

export async function createCogsJournalIfPossible(issueOrId) {
  const issue = typeof issueOrId === 'string' ? await InventoryIssue.findById(issueOrId) : issueOrId;
  if (!issue || issue.status !== 'confirmed') return null;
  const totalCost = roundMoney(issue.totalCost);
  if (totalCost <= 0) {
    throw new Error('COGS unavailable for legacy order');
  }

  return createJournalIfMissing({
    journalType: 'COGS',
    sourceType: 'inventoryissue',
    sourceId: issue._id,
    orderId: issue.orderId,
    description: `COGS for inventory issue ${issue.issueNumber}`,
    lines: [
      { accountCode: '632', accountName: 'Cost of goods sold', debit: totalCost, credit: 0 },
      { accountCode: '1561', accountName: 'Merchandise inventory', debit: 0, credit: totalCost },
    ],
  });
}
