import express from 'express';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      sort = '-date',
      account_id,
      category_id,
      type,
      start_date,
      end_date,
      search
    } = req.query;

    // Build filter
    const filter = { user_id: req.user._id };
    
    if (account_id) filter.account_id = account_id;
    if (category_id) filter.category_id = category_id;
    if (type) filter.type = type;
    
    if (start_date || end_date) {
      filter.date = {};
      if (start_date) filter.date.$gte = new Date(start_date);
      if (end_date) filter.date.$lte = new Date(end_date);
    }
    
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate('account_id', 'name type color')
      .populate('category_id', 'name color type')
      .populate('to_account_id', 'name type color')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user_id: req.user._id
    })
    .populate('account_id', 'name type color')
    .populate('category_id', 'name color type')
    .populate('to_account_id', 'name type color');
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      user_id: req.user._id
    };
    
    // Validate account exists and belongs to user
    const account = await Account.findOne({
      _id: transactionData.account_id,
      user_id: req.user._id
    });
    
    if (!account) {
      return res.status(400).json({ error: 'Invalid account' });
    }
    
    // Validate category for non-transfer transactions
    if (transactionData.type !== 'transfer' && transactionData.category_id) {
      const category = await Category.findOne({
        _id: transactionData.category_id,
        user_id: req.user._id
      });
      
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }
    
    // Validate to_account for transfers
    if (transactionData.type === 'transfer' && transactionData.to_account_id) {
      const toAccount = await Account.findOne({
        _id: transactionData.to_account_id,
        user_id: req.user._id
      });
      
      if (!toAccount) {
        return res.status(400).json({ error: 'Invalid destination account' });
      }
    }
    
    const transaction = new Transaction(transactionData);
    await transaction.save();
    
    // Update account balance
    await updateAccountBalance(transaction.account_id);
    if (transaction.to_account_id) {
      await updateAccountBalance(transaction.to_account_id);
    }
    
    // Populate and return
    await transaction.populate([
      { path: 'account_id', select: 'name type color' },
      { path: 'category_id', select: 'name color type' },
      { path: 'to_account_id', select: 'name type color' }
    ]);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'description', 'amount', 'type', 'date', 'account_id',
      'category_id', 'to_account_id', 'notes', 'tags', 'status'
    ];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const oldTransaction = await Transaction.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!oldTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      updates,
      { new: true, runValidators: true }
    )
    .populate('account_id', 'name type color')
    .populate('category_id', 'name color type')
    .populate('to_account_id', 'name type color');

    // Update account balances
    const accountsToUpdate = new Set();
    accountsToUpdate.add(oldTransaction.account_id.toString());
    accountsToUpdate.add(transaction.account_id.toString());
    
    if (oldTransaction.to_account_id) {
      accountsToUpdate.add(oldTransaction.to_account_id.toString());
    }
    if (transaction.to_account_id) {
      accountsToUpdate.add(transaction.to_account_id.toString());
    }
    
    for (const accountId of accountsToUpdate) {
      await updateAccountBalance(accountId);
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Update account balances
    await updateAccountBalance(transaction.account_id);
    if (transaction.to_account_id) {
      await updateAccountBalance(transaction.to_account_id);
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get transaction statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const stats = await Transaction.aggregate([
      {
        $match: {
          user_id: req.user._id,
          date: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      income: { total: 0, count: 0 },
      expense: { total: 0, count: 0 },
      transfer: { total: 0, count: 0 }
    };

    stats.forEach(stat => {
      summary[stat._id] = {
        total: stat.total,
        count: stat.count
      };
    });

    summary.balance = summary.income.total - summary.expense.total;

    res.json(summary);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

// Helper function to update account balance
async function updateAccountBalance(accountId) {
  try {
    const account = await Account.findById(accountId);
    if (!account) return;

    // Calculate balance from transactions
    const transactions = await Transaction.find({
      $or: [
        { account_id: accountId },
        { to_account_id: accountId }
      ],
      status: 'completed'
    });

    let balance = account.initialBalance;

    transactions.forEach(transaction => {
      if (transaction.account_id.toString() === accountId.toString()) {
        // Transaction from this account
        if (transaction.type === 'income') {
          balance += transaction.amount;
        } else if (transaction.type === 'expense') {
          balance -= transaction.amount;
        } else if (transaction.type === 'transfer') {
          balance -= transaction.amount;
        }
      } else if (transaction.to_account_id && transaction.to_account_id.toString() === accountId.toString()) {
        // Transfer to this account
        balance += transaction.amount;
      }
    });

    await Account.findByIdAndUpdate(accountId, { balance });
  } catch (error) {
    console.error('Update account balance error:', error);
  }
}

export default router;