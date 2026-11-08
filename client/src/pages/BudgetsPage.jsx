import { useState, useEffect, useCallback } from 'react';
import {
  PieChart as PieChartIcon,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { budgetAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Skeleton,
  ConfirmDialog,
  EmptyState
} from '../components/ui';
import BudgetModal from '../components/BudgetModal';
import toast from 'react-hot-toast';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await budgetAPI.getAll();
      setBudgets(data.data.budgets || []);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSaveBudget = async (formData) => {
    if (editingBudget) {
      await budgetAPI.update(editingBudget._id, formData);
      toast.success('Budget updated');
    } else {
      await budgetAPI.create(formData);
      toast.success('Budget created');
    }
    fetchBudgets();
  };

  const handleDeleteBudget = async () => {
    if (!deletingId) return;
    try {
      await budgetAPI.delete(deletingId);
      toast.success('Budget deleted');
      setDeletingId(null);
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  // Calculations for summary stats
  const totalBudgeted = budgets.reduce((acc, b) => acc + (b.amountMinor || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spentAmount || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Planner</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keep your spending under control with proactive budget limits
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Budget</span>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Budgeted
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatCurrency(totalBudgeted)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Across {budgets.length} categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Spent
            </span>
            <div className="text-2xl font-bold text-danger-500 mt-2">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Recorded within budget periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Remaining Safe to Spend
            </span>
            <div className={`text-2xl font-bold mt-2 ${totalRemaining >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {formatCurrency(totalRemaining)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {totalRemaining >= 0 ? 'Within target' : 'Over limit!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Overall Consumption
            </span>
            <div className="text-2xl font-bold text-primary-600 mt-2">
              {overallPercentage}%
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overallPercentage >= 100
                    ? 'bg-danger-500'
                    : overallPercentage >= 80
                    ? 'bg-warning-500'
                    : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={PieChartIcon}
              title="No budgets configured"
              description="Setting limits on categories like Groceries, Dining, and Shopping helps prevent overspending."
              action={
                <Button
                  onClick={() => {
                    setEditingBudget(null);
                    setIsModalOpen(true);
                  }}
                >
                  Create Your First Budget
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const pct = b.percentage || 0;
            const isExceeded = pct >= 100;
            const isWarning = pct >= 80 && !isExceeded;

            return (
              <Card key={b._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                {/* Top Status Strip */}
                <div
                  className={`h-1.5 w-full ${
                    isExceeded ? 'bg-danger-500' : isWarning ? 'bg-warning-500' : 'bg-success-500'
                  }`}
                />

                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">
                        {b.category}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase font-medium text-gray-400">
                          {b.period}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">
                          {formatDate(b.startDate)} - {formatDate(b.endDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBudget(b);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-500/15 dark:hover:bg-primary-500/25 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(b._id)}
                        className="p-1.5 text-gray-400 hover:text-danger-600 rounded-lg hover:bg-danger-500/15 dark:hover:bg-danger-500/25 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xs text-gray-400">Spent:</span>
                      <p className={`text-lg font-bold ${isExceeded ? 'text-danger-500' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(b.spentAmount || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">Limit:</span>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                        {formatCurrency(b.amountMinor)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span
                        className={
                          isExceeded
                            ? 'text-danger-500'
                            : isWarning
                            ? 'text-warning-600'
                            : 'text-success-600'
                        }
                      >
                        {pct}% consumed
                      </span>
                      <span className="text-gray-500">
                        {b.remaining >= 0
                          ? `${formatCurrency(b.remaining)} left`
                          : `${formatCurrency(Math.abs(b.remaining))} over limit`}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isExceeded
                            ? 'bg-danger-500'
                            : isWarning
                            ? 'bg-warning-500'
                            : 'bg-success-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status alert message */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5 text-xs">
                    {isExceeded ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-danger-500" />
                        <span className="text-danger-500 font-medium">Budget exceeded!</span>
                      </>
                    ) : isWarning ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-warning-500" />
                        <span className="text-warning-600 dark:text-warning-400 font-medium">
                          Approaching limit (80%+)
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                        <span className="text-success-600 dark:text-success-400 font-medium">
                          On track
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleSaveBudget}
        initialData={editingBudget}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteBudget}
        title="Delete Budget"
        message="Are you sure you want to remove this budget? Past transactions won't be deleted."
      />
    </div>
  );
}
