import mongoose from 'mongoose';

const storySectionSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const storySchema = new mongoose.Schema(
  {
    storyId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    heroImage: { type: String, trim: true, default: '' },
    images: { type: [String], default: [] },
    author: { type: String, trim: true, default: 'ferm LIVING Studio' },
    publishedAt: { type: Date, default: Date.now },
    readTime: { type: String, trim: true, default: '5 min read' },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    sections: { type: [storySectionSchema], default: [] },
    quote: { type: String, trim: true, default: '' },
    relatedProductIds: { type: [String], default: [] },
    sourceUrl: { type: String, trim: true, default: '' },
    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret.storyId || ret._id.toString();
        delete ret.storyId;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Story = mongoose.model('Story', storySchema);
