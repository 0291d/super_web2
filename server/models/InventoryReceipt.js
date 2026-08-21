import mongoose from 'mongoose';

const receiptItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const inventoryReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, trim: true },
    warehouseStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiptDate: { type: Date, required: true },
    items: {
      type: [receiptItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Receipt must include at least one item',
      },
    },
    totalValue: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: ['draft', 'confirmed', 'cancelled'], default: 'draft' },
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

export const InventoryReceipt = mongoose.model('InventoryReceipt', inventoryReceiptSchema);
