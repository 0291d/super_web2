import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    paymentNumber: { type: String, required: true, unique: true, trim: true },
    method: { type: String, enum: ['VNPAY', 'COD', 'CARD_DEMO'], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionCode: { type: String, trim: true, default: '' },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

paymentSchema.index(
  { transactionCode: 1 },
  { unique: true, partialFilterExpression: { transactionCode: { $type: 'string', $ne: '' } } },
);
paymentSchema.index({ orderId: 1, method: 1, status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
