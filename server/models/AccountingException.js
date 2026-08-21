import mongoose from 'mongoose';

const accountingExceptionSchema = new mongoose.Schema(
  {
    exceptionNumber: { type: String, required: true, unique: true, trim: true },
    exceptionType: {
      type: String,
      enum: ['RETURN', 'REFUND', 'UNDERPAYMENT', 'OVERPAYMENT', 'CANCEL_AFTER_EXPORT', 'RECONCILIATION_DIFFERENCE'],
      required: true,
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    inventoryIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryIssue' },
    reconciliationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reconciliation' },
    accountantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, min: 0, default: 0 },
    handlingAction: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'processing', 'resolved', 'cancelled'], default: 'pending' },
    resolvedAt: { type: Date },
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

accountingExceptionSchema.index({ exceptionType: 1, paymentId: 1, reconciliationId: 1, status: 1 });

export const AccountingException = mongoose.model('AccountingException', accountingExceptionSchema);
