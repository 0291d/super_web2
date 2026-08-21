import mongoose from 'mongoose';

const reconciliationItemSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    transactionCode: { type: String, trim: true, default: '' },
    systemAmount: { type: Number, required: true, min: 0 },
    actualAmount: { type: Number, min: 0, default: null },
    difference: { type: Number, default: 0 },
    result: { type: String, enum: ['matched', 'difference', 'not_received'], default: 'not_received' },
  },
  { _id: false },
);

const reconciliationSchema = new mongoose.Schema(
  {
    reconciliationNumber: { type: String, required: true, unique: true, trim: true },
    accountantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['VNPAY', 'COD', 'BANK'], required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    items: { type: [reconciliationItemSchema], default: [] },
    status: { type: String, enum: ['pending', 'matched', 'difference'], default: 'pending' },
    note: { type: String, trim: true, default: '' },
    confirmedAt: { type: Date },
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

reconciliationSchema.pre('validate', function validateDates() {
  if (this.fromDate && this.toDate && this.toDate < this.fromDate) {
    throw new Error('Reconciliation toDate must be greater than or equal to fromDate');
  }
});

reconciliationSchema.index({ source: 1, createdAt: -1 });

export const Reconciliation = mongoose.model('Reconciliation', reconciliationSchema);
