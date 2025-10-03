import apiClient from './client.js';

// Base class for all entities
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async list(sort = '-createdAt', limit = 100, filters = {}) {
    try {
      const params = { sort, limit, ...filters };
      const response = await apiClient.get(this.endpoint, { params });
      return response.data.transactions || response.data;
    } catch (error) {
      console.error(`Error fetching ${this.endpoint}:`, error);
      throw error;
    }
  }

  async get(id) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }

  async create(data) {
    try {
      const response = await apiClient.post(this.endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error creating ${this.endpoint}:`, error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const response = await apiClient.put(`${this.endpoint}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ${this.endpoint}/${id}:`, error);
      throw error;
    }
  }

  async filter(filters) {
    try {
      const response = await apiClient.get(this.endpoint, { params: filters });
      return response.data.transactions || response.data;
    } catch (error) {
      console.error(`Error filtering ${this.endpoint}:`, error);
      throw error;
    }
  }
}

// User entity with auth methods
class UserEntity {
  async me() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  async updateMyUserData(data) {
    try {
      const response = await apiClient.put('/auth/me', data);
      return response.data;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Admin methods
  async list() {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async create(userData) {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async get(id) {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const response = await apiClient.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}

// Transaction entity with custom methods
class TransactionEntity extends BaseEntity {
  constructor() {
    super('/transactions');
  }

  async getStats(period = 'month') {
    try {
      const response = await apiClient.get('/transactions/stats/summary', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      throw error;
    }
  }
}

// Category entity with custom methods
class CategoryEntity extends BaseEntity {
  constructor() {
    super('/categories');
  }

  async getStats(id, period = 'month') {
    try {
      const response = await apiClient.get(`/categories/${id}/stats`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching category ${id} stats:`, error);
      throw error;
    }
  }

  async getOverview(period = 'month', type = null) {
    try {
      const params = { period };
      if (type) params.type = type;
      const response = await apiClient.get('/categories/stats/overview', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching category overview:', error);
      throw error;
    }
  }
}

// Budget entity with custom methods
class BudgetEntity extends BaseEntity {
  constructor() {
    super('/budgets');
  }

  async getPerformance(id) {
    try {
      const response = await apiClient.get(`/budgets/${id}/performance`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching budget ${id} performance:`, error);
      throw error;
    }
  }

  async getOverview() {
    try {
      const response = await apiClient.get('/budgets/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching budget overview:', error);
      throw error;
    }
  }
}

// Account entity with custom methods
class AccountEntity extends BaseEntity {
  constructor() {
    super('/accounts');
  }

  async getBalanceHistory(id, days = 30) {
    try {
      const response = await apiClient.get(`/accounts/${id}/balance-history`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching account ${id} balance history:`, error);
      throw error;
    }
  }
}

// Export entity instances
export const User = new UserEntity();
export const Account = new AccountEntity();
export const Transaction = new TransactionEntity();
export const Category = new CategoryEntity();
export const Budget = new BudgetEntity();

// Legacy entities for compatibility (can be removed later)
export const GlobalCategory = Category;
export const GlobalAccount = Account;
export const CreditCardBill = Budget; // Placeholder