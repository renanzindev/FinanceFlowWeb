import express from 'express';
import supabase from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all accounts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get accounts error:', error);
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
    
    res.json(accounts || []);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get account by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    
    if (error) {
      console.error('Get account error:', error);
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
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: account, error } = await supabase
      .from('accounts')
      .insert([accountData])
      .select()
      .single();

    if (error) {
      console.error('Create account error:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }
    
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
      'name', 'type', 'balance', 'currency', 'is_active'
    ];
    const updates = {
      updated_at: new Date().toISOString()
    };
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const { data: account, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Update account error:', error);
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
    const { count: transactionCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .or(`account_id.eq.${req.params.id},to_account_id.eq.${req.params.id}`);

    if (countError) {
      console.error('Count transactions error:', countError);
      return res.status(500).json({ error: 'Failed to check account transactions' });
    }

    if (transactionCount > 0) {
      // Soft delete - mark as inactive
      const { data: account, error } = await supabase
        .from('accounts')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Deactivate account error:', error);
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.json({ 
        message: 'Account deactivated (has transactions)',
        account 
      });
    } else {
      // Hard delete if no transactions
      const { data: account, error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Delete account error:', error);
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

    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .or(`account_id.eq.${req.params.id},to_account_id.eq.${req.params.id}`)
      .eq('user_id', req.user.id)
      .gte('date', startDate.toISOString())
      .eq('status', 'completed')
      .order('date', { ascending: true });

    if (transError) {
      console.error('Get transactions error:', transError);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (accountError) {
      console.error('Get account error:', accountError);
      return res.status(404).json({ error: 'Account not found' });
    }

    // Calculate balance history
    let currentBalance = account.balance || 0;
    const balanceHistory = [{
      date: account.created_at,
      balance: currentBalance
    }];

    transactions.forEach(transaction => {
      if (transaction.account_id === req.params.id) {
        // Transaction from this account
        if (transaction.type === 'income') {
          currentBalance += transaction.amount;
        } else if (transaction.type === 'expense') {
          currentBalance -= transaction.amount;
        } else if (transaction.type === 'transfer') {
          currentBalance -= transaction.amount;
        }
      } else if (transaction.to_account_id === req.params.id) {
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