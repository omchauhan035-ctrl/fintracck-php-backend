import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  History
} from 'lucide-react';
import { goalAPI } from '../services/api';
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
import GoalModal from '../components/GoalModal';
import ContributionModal from '../components/ContributionModal';
import toast from 'react-hot-toast';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [activeGoalForContrib, setActiveGoalForContrib] = useState(null);
  const [contribMode, setContribMode] = useState('contribution');
  const [deletingId, setDeletingId] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await goalAPI.getAll(params);
      setGoals(data.data.goals || []);
    } catch {
      toast.error('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSaveGoal = async (formData) => {
    if (editingGoal) {
      await goalAPI.update(editingGoal._id, formData);
      toast.success('Savings goal updated');
    } else {
      await goalAPI.create(formData);
      toast.success('Savings goal created');
    }
    fetchGoals();
  };

  const handleGoalTransaction = async (goalId, payload, mode) => {
    if (mode === 'withdrawal') {
      await goalAPI.addWithdrawal(goalId, payload);
      toast.success('Funds withdrawn from goal');
    } else {
      await goalAPI.addContribution(goalId, payload);
      toast.success('Savings added to goal!');
    }
    fetchGoals();
  };

  const handleDeleteGoal = async () => {
    if (!deletingId) return;
    try {
      await goalAPI.delete(deletingId);
      toast.success('Goal deleted');
      setDeletingId(null);
      fetchGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  // KPI Calculations
  const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmountMinor || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + (g.currentAmountMinor || 0), 0);
  const completedCount = goals.filter((g) => g.status === 'completed').length;
  const activeCount = goals.filter((g) => g.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set ambitious targets and track your journey to financial milestones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <Button
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Saved In Goals
            </span>
            <div className="text-2xl font-bold text-primary-600 mt-2">
              {formatCurrency(totalSaved)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Accumulated savings balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Targets
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatCurrency(totalTarget)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Across all goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Goals
            </span>
            <div className="text-2xl font-bold text-indigo-600 mt-2">
              {activeCount}
            </div>
            <p className="text-xs text-gray-400 mt-1">In progress targets</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Completed Goals
            </span>
            <div className="text-2xl font-bold text-success-600 mt-2">
              {completedCount}
            </div>
            <p className="text-xs text-gray-400 mt-1">Milestones accomplished</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Target}
              title="No savings goals yet"
              description="Whether it's an emergency fund, retirement, or a dream vacation, set a target and watch your money grow."
              action={
                <Button
                  onClick={() => {
                    setEditingGoal(null);
                    setIsGoalModalOpen(true);
                  }}
                >
                  Create Your First Goal
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const pct = g.percentage || 0;
            const isCompleted = g.status === 'completed' || pct >= 100;

            return (
              <Card key={g._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                {/* Accent Header Line */}
                <div className="h-2 w-full" style={{ backgroundColor: g.color || '#6366f1' }} />

                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                        {g.title}
                      </h4>
                      {g.targetDate && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Target: {formatDate(g.targetDate)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(g);
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-500/15 dark:hover:bg-primary-500/25 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(g._id)}
                        className="p-1.5 text-gray-400 hover:text-danger-600 rounded-lg hover:bg-danger-500/15 dark:hover:bg-danger-500/25 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-gray-400">Current Saved</span>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(g.currentAmountMinor)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">Target</span>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {formatCurrency(g.targetAmountMinor)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={isCompleted ? 'text-success-600' : 'text-primary-600'}>
                        {pct}% achieved
                      </span>
                      <span className="text-gray-400">
                        {g.remaining > 0 ? `${formatCurrency(g.remaining)} needed` : 'Goal reached! 🎉'}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: g.color || '#6366f1',
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setActiveGoalForContrib(g);
                        setContribMode('contribution');
                        setIsContribModalOpen(true);
                      }}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Add Money</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={g.currentAmountMinor <= 0}
                      className="flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setActiveGoalForContrib(g);
                        setContribMode('withdrawal');
                        setIsContribModalOpen(true);
                      }}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      <span>Withdraw</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Add / Edit Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleSaveGoal}
        initialData={editingGoal}
      />

      {/* Contribution / Withdrawal Modal */}
      <ContributionModal
        isOpen={isContribModalOpen}
        onClose={() => {
          setIsContribModalOpen(false);
          setActiveGoalForContrib(null);
        }}
        onSubmit={handleGoalTransaction}
        goal={activeGoalForContrib}
        mode={contribMode}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this goal and its transaction logs? This action is permanent."
      />
    </div>
  );
}
