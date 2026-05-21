import mongoose from 'mongoose';

const serviceSectionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    items: { type: [String], default: [] },
  },
  { _id: false },
);

const servicePageSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true, default: 'Customer Service' },
    excerpt: { type: String, trim: true, default: '' },
    heroImage: { type: String, trim: true, default: '' },
    sections: { type: [serviceSectionSchema], default: [] },
    ctaLabel: { type: String, trim: true, default: '' },
    ctaHref: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret.pageId || ret._id.toString();
        delete ret.pageId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ServicePage = mongoose.model('ServicePage', servicePageSchema);
