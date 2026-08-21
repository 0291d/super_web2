import mongoose from 'mongoose';

const fifoAllocationSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryBatch', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const issueItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    cost: { type: Number, required: true, min: 0, default: 0 },
    fifoAllocations: { type: [fifoAllocationSchema], default: [] },
  },
  { _id: false },
);

const inventoryIssueSchema = new mongoose.Schema(
  {
    issueNumber: { type: String, required: true, unique: true, trim: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    warehouseStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueDate: { type: Date, required: true },
    items: {
      type: [issueItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Issue must include at least one item',
      },
    },
    totalCost: { type: Number, required: true, min: 0, default: 0 },
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

export const InventoryIssue = mongoose.model('InventoryIssue', inventoryIssueSchema);
