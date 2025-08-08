import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'transfer']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() {
      return this.type !== 'transfer';
    }
  },
  to_account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: function() {
      return this.type === 'transfer';
    }
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  is_fixed: {
    type: Boolean,
    default: false
  },
  fixed_frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.is_fixed;
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updated_date before saving
transactionSchema.pre('save', function(next) {
  this.updated_date = new Date();
  next();
});

// Index for better query performance
transactionSchema.index({ user_id: 1, date: -1 });
transactionSchema.index({ account_id: 1, date: -1 });
transactionSchema.index({ category_id: 1, date: -1 });
transactionSchema.index({ updated_date: -1 });

export default mongoose.model('Transaction', transactionSchema);