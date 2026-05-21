import mongoose from 'mongoose';

const professionalCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    linkLabel: { type: String, trim: true, default: 'Explore' },
    href: { type: String, trim: true, default: '#' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const catalogueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    fileSize: { type: String, trim: true, default: '' },
    fileUrl: { type: String, trim: true, default: '#' },
    description: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const professionalSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true, unique: true, trim: true, default: 'professionals' },
    eyebrow: { type: String, trim: true, default: 'Trade & Contract' },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    heroImage: { type: String, trim: true, default: '' },
    cards: { type: [professionalCardSchema], default: [] },
    inquiryTitle: { type: String, trim: true, default: 'Contract Project Inquiry' },
    inquiryIntro: { type: String, trim: true, default: '' },
    cataloguesTitle: { type: String, trim: true, default: 'Latest Catalogues' },
    catalogues: { type: [catalogueSchema], default: [] },
    servicesTitle: { type: String, trim: true, default: 'Professional Services' },
    services: { type: [String], default: [] },
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

export const Professional = mongoose.model('Professional', professionalSchema);
