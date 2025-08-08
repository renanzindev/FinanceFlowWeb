import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['checking', 'savings', 'credit', 'investment', 'cash', 'other']
  },
  balance: {
    type: Number,
    default: 0
  },
  initialBalance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  icon: {
    type: String,
    default: 'wallet'
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
accountSchema.index({ user_id: 1, isActive: 1 });

export default mongoose.model('Account', accountSchema);