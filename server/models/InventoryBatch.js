import mongoose from 'mongoose';

const inventoryBatchSchema = new mongoose.Schema(
  {
    batchCode: { type: String, required: true, unique: true, trim: true },
    productId: { type: String, required: true, trim: true },
    receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryReceipt', required: true },
    receivedDate: { type: Date, required: true },
    quantityReceived: { type: Number, required: true, min: 1 },
    quantityRemaining: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['available', 'depleted'], default: 'available' },
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

export const InventoryBatch = mongoose.model('InventoryBatch', inventoryBatchSchema);
