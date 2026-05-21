import mongoose from 'mongoose';

const professionalInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    projectType: { type: String, trim: true, default: '' },
    budget: { type: String, trim: true, default: '' },
    projectDetails: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'reviewed', 'archived'], default: 'new' },
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

export const ProfessionalInquiry = mongoose.model('ProfessionalInquiry', professionalInquirySchema);
