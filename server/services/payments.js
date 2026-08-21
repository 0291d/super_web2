import { Payment } from '../models/Payment.js';
import { createRevenueJournalIfPossible } from './accounting.js';

export async function generatePaymentNumber() {
  const count = await Payment.countDocuments();
  return `PM${String(count + 1).padStart(6, '0')}`;
}

export function paymentMethodForOrder(order) {
  if (order.paymentMethod === 'vnpay' || order.paymentProvider === 'vnpay') return 'VNPAY';
  if (order.paymentMethod === 'cod') return 'COD';
  return 'CARD_DEMO';
}

export async function markPaymentPaid(order, { method = paymentMethodForOrder(order), transactionCode = '', paidAt = new Date() } = {}) {
  const filter = transactionCode
    ? { transactionCode }
    : { orderId: order._id, method, status: 'paid' };

  let payment = await Payment.findOne(filter);
  if (!payment) {
    payment = await Payment.findOne({ orderId: order._id, method, status: 'pending' });
  }

  if (!payment) {
    try {
      payment = await Payment.create({
        orderId: order._id,
        paymentNumber: await generatePaymentNumber(),
        method,
        amount: Number(order.total || 0),
        status: 'paid',
        transactionCode,
        paidAt,
      });
    } catch (error) {
      if (error.code === 11000) {
        payment = await Payment.findOne(filter);
      } else {
        throw error;
      }
    }
  } else if (payment.status !== 'paid') {
    payment.status = 'paid';
    payment.amount = Number(order.total || payment.amount || 0);
    payment.transactionCode = transactionCode || payment.transactionCode || '';
    payment.paidAt = paidAt;
    await payment.save();
  }

  try {
    await createRevenueJournalIfPossible(payment);
  } catch (error) {
    console.error('Unable to create revenue journal', {
      orderId: order._id.toString(),
      paymentId: payment?._id?.toString(),
      message: error.message,
    });
  }

  return payment;
}
