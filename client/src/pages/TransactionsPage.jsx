import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Filter,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  X
} from 'lucide-react';
import { transactionAPI, categoryAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  ConfirmDialog,
  Skeleton,
  EmptyState
} from '../components/ui';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and pagination state
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await categoryAPI.getAll();
        setCategories(data.data.categories || []);
      } catch {
        // ignore
      }
    }
    loadCategories();
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (type) params.type = type;
      if (category) params.category = category;
      if (paymentMethod) params.paymentMethod = paymentMethod;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await transactionAPI.getAll(params);
      setTransactions(data.data.transactions || []);
      setPagination(data.data.pagination || { total: 0, pages: 1 });
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, search, type, category, paymentMethod, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSearch('');
    setType('');
    setCategory('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSaveTransaction = async (formData) => {
    if (editingTransaction) {
      await transactionAPI.update(editingTransaction._id, formData);
      toast.success('Transaction updated');
    } else {
      await transactionAPI.create(formData);
      toast.success('Transaction created');
    }
    fetchTransactions();
  };

  const handleDeleteTransaction = async () => {
    if (!deletingId) return;
    try {
      await transactionAPI.delete(deletingId);
      toast.success('Transaction deleted');
      setDeletingId(null);
      fetchTransactions();
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  // Format YYYY-MM-DD into DD/MM/YYYY for display
  const formatInputDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View, filter, and manage all your revenue and expenditures
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-primary-500"
              />
            </div>

            {/* Type selector */}
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="expense">Expense Only</option>
              <option value="income">Income Only</option>
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Payment Method */}
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
            >
              <option value="">All Payment Methods</option>
              <option value="upi">UPI</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="wallet">Wallet</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Secondary Filter Line (Dates, Sorting & Reset) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* From Date Pill */}
              <div
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  input?.showPicker?.();
                }}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/90 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500/60 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-150 shadow-2xs cursor-pointer group"
              >
                <Calendar className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-gray-500 dark:text-gray-400 font-medium">From:</span>
                <span className={`text-xs font-semibold ${startDate ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {startDate ? formatInputDate(startDate) : 'DD/MM/YYYY'}
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-auto"
                />
                {startDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartDate('');
                      setPage(1);
                    }}
                    className="relative z-20 p-0.5 text-gray-400 hover:text-danger-500 rounded-full hover:bg-danger-500/10 transition-colors ml-0.5 cursor-pointer"
                    title="Clear start date"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* To Date Pill */}
              <div
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  input?.showPicker?.();
                }}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/90 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500/60 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-150 shadow-2xs cursor-pointer group"
              >
                <Calendar className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-gray-500 dark:text-gray-400 font-medium">To:</span>
                <span className={`text-xs font-semibold ${endDate ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {endDate ? formatInputDate(endDate) : 'DD/MM/YYYY'}
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-auto"
                />
                {endDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEndDate('');
                      setPage(1);
                    }}
                    className="relative z-20 p-0.5 text-gray-400 hover:text-danger-500 rounded-full hover:bg-danger-500/10 transition-colors ml-0.5 cursor-pointer"
                    title="Clear end date"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-500 font-medium">Sort by:</span>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('_');
                  setSortBy(sb);
                  setSortOrder(so);
                }}
                className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amountMinor_desc">Highest Amount</option>
                <option value="amountMinor_asc">Lowest Amount</option>
              </select>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 px-2.5 py-1 rounded-lg hover:bg-primary-500/10 dark:hover:bg-primary-500/20 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table / List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description="Try adjusting your filters or create a new transaction."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsModalOpen(true);
                  }}
                >
                  Add Transaction
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Transaction</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                  {transactions.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    return (
                      <tr
                        key={tx._id}
                        className="hover:bg-primary-500/10 dark:hover:bg-primary-500/15 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isExpense
                                  ? 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400'
                                  : 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                              }`}
                            >
                              {isExpense ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white leading-snug">
                                {tx.title}
                              </p>
                              {tx.notes && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                                  {tx.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={isExpense ? 'danger' : 'success'}>
                            {tx.category}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(tx.date)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs uppercase font-medium text-gray-600 dark:text-gray-400">
                            {tx.paymentMethod?.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold">
                          <span className={isExpense ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}>
                            {isExpense ? '-' : '+'}
                            {formatCurrency(tx.amountMinor)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-500/15 dark:hover:bg-primary-500/25 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(tx._id)}
                              className="p-1.5 text-gray-400 hover:text-danger-600 rounded-lg hover:bg-danger-500/15 dark:hover:bg-danger-500/25 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2 py-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                  className="px-2 py-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
}
