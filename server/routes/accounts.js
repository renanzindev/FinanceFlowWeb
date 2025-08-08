import express from 'express';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all accounts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await Account.find({ 
      user_id: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get account by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Create new account
router.post('/', authenticateToken, async (req, res) => {
  try {
    const accountData = {
      ...req.body,
      user_id: req.user._id
    };
    
    const account = new Account(accountData);
    await account.save();
    
    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update account
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'type', 'balance', 'initialBalance', 
      'currency', 'color', 'icon', 'description', 'isActive'
    ];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete account
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if account has transactions
    const transactionCount = await Transaction.countDocuments({
      $or: [
        { account_id: req.params.id },
        { to_account_id: req.params.id }
      ]
    });

    if (transactionCount > 0) {
      // Soft delete - mark as inactive
      const account = await Account.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        { isActive: false },
        { new: true }
      );
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.json({ 
        message: 'Account deactivated (has transactions)',
        account 
      });
    } else {
      // Hard delete if no transactions
      const account = await Account.findOneAndDelete({
        _id: req.params.id,
        user_id: req.user._id
      });
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.json({ message: 'Account deleted successfully' });
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get account balance history
router.get('/:id/balance-history', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const transactions = await Transaction.find({
      $or: [
        { account_id: req.params.id },
        { to_account_id: req.params.id }
      ],
      user_id: req.user._id,
      date: { $gte: startDate },
      status: 'completed'
    }).sort({ date: 1 });

    const account = await Account.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Calculate balance history
    let currentBalance = account.initialBalance;
    const balanceHistory = [{
      date: account.createdAt,
      balance: currentBalance
    }];

    transactions.forEach(transaction => {
      if (transaction.account_id.toString() === req.params.id) {
        // Transaction from this account
        if (transaction.type === 'income') {
          currentBalance += transaction.amount;
        } else if (transaction.type === 'expense') {
          currentBalance -= transaction.amount;
        } else if (transaction.type === 'transfer') {
          currentBalance -= transaction.amount;
        }
      } else if (transaction.to_account_id && transaction.to_account_id.toString() === req.params.id) {
        // Transfer to this account
        currentBalance += transaction.amount;
      }

      balanceHistory.push({
        date: transaction.date,
        balance: currentBalance
      });
    });

    res.json(balanceHistory);
  } catch (error) {
    console.error('Get balance history error:', error);
    res.status(500).json({ error: 'Failed to fetch balance history' });
  }
});

export default router;