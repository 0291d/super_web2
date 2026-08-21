import mongoose from 'mongoose';

const accountingAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: { type: String, required: true, unique: true, trim: true },
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingJournal', required: true },
    reconciliationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reconciliation' },
    accountantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
    oldData: { type: mongoose.Schema.Types.Mixed, required: true },
    newData: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    adjustedAt: { type: Date },
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

accountingAdjustmentSchema.index({ journalId: 1, status: 1 });

export const AccountingAdjustment = mongoose.model('AccountingAdjustment', accountingAdjustmentSchema);
