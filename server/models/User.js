import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'warehouse', 'accountant'], default: 'user' },
    status: { type: String, enum: ['active', 'locked', 'inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    newsletter: { type: Boolean, default: false },
    addresses: {
      type: [
        {
          label: { type: String, trim: true, default: 'Preferred' },
          firstName: { type: String, trim: true, default: '' },
          lastName: { type: String, trim: true, default: '' },
          address1: { type: String, trim: true, default: '' },
          city: { type: String, trim: true, default: '' },
          postalCode: { type: String, trim: true, default: '' },
          country: { type: String, trim: true, default: 'Vietnam' },
          phone: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
