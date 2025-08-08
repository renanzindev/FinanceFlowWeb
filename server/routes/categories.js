import express from 'express';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all categories for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, is_active = true } = req.query;
    
    const filter = { user_id: req.user._id };
    if (type) filter.type = type;
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    
    const categories = await Category.find(filter)
      .sort({ name: 1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      user_id: req.user._id
    };
    
    // Check if category name already exists for this user
    const existingCategory = await Category.findOne({
      name: categoryData.name,
      user_id: req.user._id,
      type: categoryData.type
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Category with this name already exists for this type' 
      });
    }
    
    const category = new Category(categoryData);
    await category.save();
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'type', 'color', 'icon', 'budget', 
      'description', 'is_active'
    ];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if new name conflicts with existing categories
    if (updates.name) {
      const existingCategory = await Category.findOne({
        name: updates.name,
        user_id: req.user._id,
        type: updates.type || req.body.type,
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          error: 'Category with this name already exists for this type' 
        });
      }
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if category has transactions
    const transactionCount = await Transaction.countDocuments({
      category_id: req.params.id
    });

    if (transactionCount > 0) {
      // Soft delete - mark as inactive
      const category = await Category.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        { is_active: false },
        { new: true }
      );
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ 
        message: 'Category deactivated (has transactions)',
        category 
      });
    } else {
      // Hard delete if no transactions
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
        user_id: req.user._id
      });
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    }
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get category spending statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
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

    const category = await Category.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const stats = await Transaction.aggregate([
      {
        $match: {
          category_id: category._id,
          user_id: req.user._id,
          date: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const result = {
      category: category.name,
      period,
      totalAmount: stats[0]?.totalAmount || 0,
      transactionCount: stats[0]?.transactionCount || 0,
      avgAmount: stats[0]?.avgAmount || 0,
      budget: category.budget,
      budgetUsed: category.budget ? ((stats[0]?.totalAmount || 0) / category.budget) * 100 : null
    };

    res.json(result);
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

// Get spending by category (overview)
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { period = 'month', type } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const matchFilter = {
      user_id: req.user._id,
      date: { $gte: startDate },
      status: 'completed'
    };

    if (type) {
      matchFilter.type = type;
    }

    const stats = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category_id',
          categoryName: { $first: '$category.name' },
          categoryColor: { $first: '$category.color' },
          categoryType: { $first: '$category.type' },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Get category overview error:', error);
    res.status(500).json({ error: 'Failed to fetch category overview' });
  }
});

export default router;