import mongoose from 'mongoose';

const detailsSchema = new mongoose.Schema(
  {
    itemNumber: { type: String, trim: true, default: '' },
    size: { type: String, trim: true, default: '' },
    weight: { type: String, trim: true, default: '' },
    material: { type: String, trim: true, default: '' },
    origin: { type: String, trim: true, default: 'Designed in Europe' },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    subcategory: { type: String, trim: true, default: '' },
    room: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, default: 'EUR' },
    description: { type: String, trim: true, default: '' },
    shortDescription: { type: String, trim: true, default: '' },
    images: { type: [String], default: [] },
    sizes: { type: [String], default: ['One Size'] },
    materials: { type: [String], default: [] },
    stock: { type: Number, min: 0, default: 0 },
    isNew: { type: Boolean, default: false },
    isCertified: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    badge: { type: String, trim: true, default: '' },
    details: { type: detailsSchema, default: () => ({}) },
    careInstructions: { type: String, trim: true, default: '' },

    material: { type: String, trim: true, default: '' },
    dimensions: { type: String, trim: true, default: '' },
    inStock: { type: Boolean, default: true },
    imageUrl: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.productId || ret._id.toString();
        delete ret.productId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Product = mongoose.model('Product', productSchema);
