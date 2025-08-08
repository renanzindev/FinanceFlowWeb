import express from 'express';
import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all budgets for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isActive = true, period } = req.query;
    
    const filter = { user_id: req.user._id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (period) filter.period = period;
    
    const budgets = await Budget.find(filter)
      .populate('category_id', 'name color type')
      .sort({ createdAt: -1 });
    
    // Update spent amounts for each budget
    for (const budget of budgets) {
      await updateBudgetSpent(budget._id);
    }
    
    // Fetch updated budgets
    const updatedBudgets = await Budget.find(filter)
      .populate('category_id', 'name color type')
      .sort({ createdAt: -1 });
    
    res.json(updatedBudgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Get budget by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user_id: req.user._id
    }).populate('category_id', 'name color type');
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Update spent amount
    await updateBudgetSpent(budget._id);
    
    // Fetch updated budget
    const updatedBudget = await Budget.findById(budget._id)
      .populate('category_id', 'name color type');
    
    res.json(updatedBudget);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Create new budget
router.post('/', authenticateToken, async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      user_id: req.user._id
    };
    
    // Validate category exists and belongs to user
    const category = await Category.findOne({
      _id: budgetData.category_id,
      user_id: req.user._id
    });
    
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      category_id: budgetData.category_id,
      user_id: req.user._id,
      period: budgetData.period,
      isActive: true,
      startDate: { $lte: budgetData.endDate },
      endDate: { $gte: budgetData.startDate }
    });
    
    if (existingBudget) {
      return res.status(400).json({ 
        error: 'Budget already exists for this category in the specified period' 
      });
    }
    
    const budget = new Budget(budgetData);
    await budget.save();
    
    // Update spent amount
    await updateBudgetSpent(budget._id);
    
    // Populate and return
    await budget.populate('category_id', 'name color type');
    
    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Update budget
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'amount', 'period', 'startDate', 'endDate',
      'category_id', 'description', 'alertThreshold', 'isActive'
    ];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate category if being updated
    if (updates.category_id) {
      const category = await Category.findOne({
        _id: updates.category_id,
        user_id: req.user._id
      });
      
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('category_id', 'name color type');

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Update spent amount
    await updateBudgetSpent(budget._id);
    
    // Fetch updated budget
    const updatedBudget = await Budget.findById(budget._id)
      .populate('category_id', 'name color type');

    res.json(updatedBudget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete budget
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Get budget performance statistics
router.get('/:id/performance', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user_id: req.user._id
    }).populate('category_id', 'name color type');
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Get daily spending within budget period
    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          category_id: budget.category_id._id,
          user_id: req.user._id,
          type: 'expense',
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          dailyTotal: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Calculate budget performance metrics
    const totalDays = Math.ceil((budget.endDate - budget.startDate) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((new Date() - budget.startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysPassed);
    
    const expectedSpentByNow = (budget.amount / totalDays) * Math.min(daysPassed, totalDays);
    const projectedTotal = budget.spent * (totalDays / Math.max(daysPassed, 1));
    
    const performance = {
      budget: budget.toJSON(),
      dailySpending,
      metrics: {
        totalDays,
        daysPassed: Math.max(0, daysPassed),
        daysRemaining,
        expectedSpentByNow,
        projectedTotal,
        isOnTrack: budget.spent <= expectedSpentByNow,
        dailyBudgetRemaining: daysRemaining > 0 ? (budget.amount - budget.spent) / daysRemaining : 0
      }
    };

    res.json(performance);
  } catch (error) {
    console.error('Get budget performance error:', error);
    res.status(500).json({ error: 'Failed to fetch budget performance' });
  }
});

// Get budget overview statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    
    // Get active budgets
    const activeBudgets = await Budget.find({
      user_id: req.user._id,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('category_id', 'name color type');

    // Update spent amounts
    for (const budget of activeBudgets) {
      await updateBudgetSpent(budget._id);
    }

    // Fetch updated budgets
    const updatedBudgets = await Budget.find({
      user_id: req.user._id,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('category_id', 'name color type');

    const totalBudgeted = updatedBudgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = updatedBudgets.reduce((sum, budget) => sum + budget.spent, 0);
    const overBudgetCount = updatedBudgets.filter(budget => budget.spent > budget.amount).length;
    const nearLimitCount = updatedBudgets.filter(budget => 
      budget.percentageUsed >= budget.alertThreshold && budget.spent <= budget.amount
    ).length;

    res.json({
      totalBudgets: updatedBudgets.length,
      totalBudgeted,
      totalSpent,
      totalRemaining: Math.max(0, totalBudgeted - totalSpent),
      overBudgetCount,
      nearLimitCount,
      budgets: updatedBudgets
    });
  } catch (error) {
    console.error('Get budget overview error:', error);
    res.status(500).json({ error: 'Failed to fetch budget overview' });
  }
});

// Helper function to update budget spent amount
async function updateBudgetSpent(budgetId) {
  try {
    const budget = await Budget.findById(budgetId);
    if (!budget) return;

    const totalSpent = await Transaction.aggregate([
      {
        $match: {
          category_id: budget.category_id,
          user_id: budget.user_id,
          type: 'expense',
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const spent = totalSpent[0]?.total || 0;
    await Budget.findByIdAndUpdate(budgetId, { spent });
  } catch (error) {
    console.error('Update budget spent error:', error);
  }
}

export default router;