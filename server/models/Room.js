import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret.name;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Room = mongoose.model('Room', roomSchema);
