/**
 * Format minor units (paise) to display currency
 * @param {number} amountMinor - Amount in minor units (paise)
 * @param {string} currency - Currency code (INR, USD, etc.)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amountMinor, currency = 'INR') => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyMinor = formatCurrency;

/**
 * Format date for display
 */
export const formatDate = (dateStr, format = 'short') => {
  const date = new Date(dateStr);
  if (format === 'short') {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  if (format === 'long') {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  if (format === 'input') {
    return date.toISOString().split('T')[0];
  }
  return date.toLocaleDateString();
};

/**
 * Get date range for common periods
 */
export const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'this_week': {
      const day = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'all':
    default:
      startDate = null;
      endDate = null;
      break;
  }

  return {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
  };
};

/**
 * Get month name from month number
 */
export const getMonthName = (month, short = true) => {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
};

/**
 * Payment method labels
 */
export const paymentMethodLabels = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  wallet: 'Digital Wallet',
  other: 'Other',
};

/**
 * Category colors mapping
 */
export const categoryColors = {
  'Salary': '#22c55e',
  'Freelance': '#3b82f6',
  'Investments': '#8b5cf6',
  'Other Income': '#06b6d4',
  'Food & Dining': '#f97316',
  'Transportation': '#eab308',
  'Shopping': '#ec4899',
  'Bills & Utilities': '#ef4444',
  'Healthcare': '#14b8a6',
  'Entertainment': '#a855f7',
  'Education': '#6366f1',
  'Other': '#64748b',
};

/**
 * Get a color for a category (with fallback)
 */
export const getCategoryColor = (category) => {
  return categoryColors[category] || '#6366f1';
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Classname helper
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
