import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    subcategory: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    address1: { type: String, required: true, trim: true },
    address2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: String, trim: true, default: '' },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, required: true },
    paymentMethod: { type: String, trim: true, default: 'card_demo' },
    paymentProvider: { type: String, trim: true, default: 'demo' },
    paymentTransactionNo: { type: String, trim: true, default: '' },
    paymentBankCode: { type: String, trim: true, default: '' },
    paymentResponseCode: { type: String, trim: true, default: '' },
    paymentTransactionStatus: { type: String, trim: true, default: '' },
    paymentRequestDate: { type: String, trim: true, default: '' },
    paymentPayDate: { type: String, trim: true, default: '' },
    paymentAmountVnd: { type: Number, min: 0, default: 0 },
    paidAt: { type: Date },
    refundStatus: { type: String, trim: true, default: '' },
    refundResponseCode: { type: String, trim: true, default: '' },
    refundTransactionNo: { type: String, trim: true, default: '' },
    refundedAt: { type: Date },
    deliveryMethod: { type: String, trim: true, default: 'standard' },
    subtotal: { type: Number, required: true, min: 0 },
    shippingTotal: { type: Number, required: true, min: 0 },
    taxTotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, default: 'EUR' },
    status: { type: String, enum: ['pending', 'paid', 'processing', 'completed', 'cancelled'], default: 'paid' },
    notes: { type: String, trim: true, default: '' },
    publicToken: { type: String, unique: true, sparse: true, trim: true, default: '' },
    inventoryReserved: { type: Boolean, default: false },
    inventoryRestored: { type: Boolean, default: false },
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

export const Order = mongoose.model('Order', orderSchema);
