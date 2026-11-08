import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If we get 401 and we're not on auth pages, redirect to login
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/password', data),
};

// Transaction API
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
};

// Analytics API
export const analyticsAPI = {
  getIncomeExpenses: (params) => api.get('/analytics/income-expenses', { params }),
  getCategories: (params) => api.get('/analytics/categories', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};

// Budget API
export const budgetAPI = {
  getAll: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.patch(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Goals API
export const goalAPI = {
  getAll: (params) => api.get('/goals', { params }),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.patch(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  addContribution: (id, data) => api.post(`/goals/${id}/contributions`, data),
  addWithdrawal: (id, data) => api.post(`/goals/${id}/withdrawals`, data),
};

// Category API
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  deleteTransaction: (id) => api.delete(`/admin/transactions/${id}`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getSystemHealth: () => api.get('/admin/system-health'),
};

export default api;
