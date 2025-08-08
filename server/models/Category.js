import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  color: {
    type: String,
    default: '#6b7280'
  },
  icon: {
    type: String,
    default: 'tag'
  },
  budget: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  is_active: {
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
categorySchema.index({ user_id: 1, type: 1, is_active: 1 });

export default mongoose.model('Category', categorySchema);