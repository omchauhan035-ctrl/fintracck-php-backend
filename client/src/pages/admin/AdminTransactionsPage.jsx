import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate, formatCurrencyMinor } from '../../utils/helpers';
import {
  ArrowLeftRight, Search, TrendingUp, TrendingDown, Trash2,
  RefreshCw
} from 'lucide-react';
import {
  Card, CardContent, Button, LoadingSpinner, Modal
} from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getTransactions({
        search,
        type: typeFilter,
        category: categoryFilter,
        page,
        limit: 15,
      });
      setTransactions(data.data.transactions);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleDelete = async () => {
    if (!txToDelete) return;
    try {
      setDeleting(true);
      await adminAPI.deleteTransaction(txToDelete.id || txToDelete._id);
      toast.success('Transaction removed successfully');
      setDeleteModalOpen(false);
      setTxToDelete(null);
      fetchTransactions();
    } catch {
      toast.error('Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Global Transactions Audit
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Platform-wide transaction monitor ({pagination.total} records total in MySQL)
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={fetchTransactions}
          className="self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, description, or payment method..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expense Only</option>
              </select>

              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ArrowLeftRight className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No transactions recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Transaction Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id || tx._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {tx.userId?.name || 'Unknown User'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{tx.userId?.email}</p>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {tx.title}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{tx.type}</span>
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {tx.category}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold">
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrencyMinor(tx.amountMinor)}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {tx.paymentMethod}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(tx.date)}
                    </td>

                    {/* Delete */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setTxToDelete(tx);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Transaction"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to delete the transaction <strong>"{txToDelete?.title}"</strong> (
            {formatCurrencyMinor(txToDelete?.amountMinor || 0)}) recorded by{' '}
            <strong>{txToDelete?.userId?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete Record'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

