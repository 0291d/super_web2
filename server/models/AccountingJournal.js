import mongoose from 'mongoose';

const journalLineSchema = new mongoose.Schema(
  {
    accountCode: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    debit: { type: Number, min: 0, default: 0 },
    credit: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const accountingJournalSchema = new mongoose.Schema(
  {
    journalNumber: { type: String, required: true, unique: true, trim: true },
    journalType: { type: String, enum: ['REVENUE', 'COGS', 'TAX', 'ADJUSTMENT', 'REFUND'], required: true },
    sourceType: { type: String, enum: ['order', 'payment', 'inventoryissue', 'exception'], required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    description: { type: String, trim: true, default: '' },
    lines: {
      type: [journalLineSchema],
      required: true,
      validate: {
        validator: (lines) => Array.isArray(lines) && lines.length >= 2,
        message: 'Journal must include at least two lines',
      },
    },
    status: { type: String, enum: ['auto', 'confirmed', 'need_adjustment', 'adjusted'], default: 'auto' },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

accountingJournalSchema.index({ journalType: 1, sourceType: 1, sourceId: 1 }, { unique: true });

accountingJournalSchema.pre('validate', function validateBalancedJournal() {
  const totalDebit = this.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = this.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const invalidLine = this.lines.some((line) => Number(line.debit || 0) > 0 && Number(line.credit || 0) > 0);

  if (invalidLine) throw new Error('A journal line cannot have both debit and credit');
  if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
    throw new Error('Journal debit and credit totals must balance');
  }
});

export const AccountingJournal = mongoose.model('AccountingJournal', accountingJournalSchema);
