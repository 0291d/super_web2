import mongoose from 'mongoose';

const countItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    systemQuantity: { type: Number, required: true, min: 0 },
    actualQuantity: { type: Number, required: true, min: 0 },
    difference: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const inventoryCountSchema = new mongoose.Schema(
  {
    countNumber: { type: String, required: true, unique: true, trim: true },
    warehouseStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    countDate: { type: Date, required: true },
    items: {
      type: [countItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Inventory count must include at least one item',
      },
    },
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

export const InventoryCount = mongoose.model('InventoryCount', inventoryCountSchema);
