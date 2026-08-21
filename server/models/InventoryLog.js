import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    type: { type: String, enum: ['IMPORT', 'EXPORT', 'ADJUSTMENT'], required: true },
    quantity: { type: Number, required: true },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    unitCost: { type: Number, required: true, min: 0, default: 0 },
    totalCost: { type: Number, required: true, min: 0, default: 0 },
    referenceType: { type: String, enum: ['receipt', 'issue', 'count'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
