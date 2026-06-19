import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Prevent duplicate requests between the same users
requestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
requestSchema.index({ receiver: 1, status: 1 });
requestSchema.index({ sender: 1, status: 1 });

const Request = mongoose.model('request', requestSchema);

export default Request;
