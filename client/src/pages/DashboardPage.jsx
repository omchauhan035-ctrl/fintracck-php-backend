import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Plus,
  ArrowRight,
  ChevronDown,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { dashboardAPI, transactionAPI } from '../services/api';
import { formatCurrency, formatDate, getDateRange, getMonthName, getCategoryColor } from '../utils/helpers';
import { Card, CardHeader, CardContent, Button, Skeleton, Badge, EmptyState } from '../components/ui';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This Month', desc: 'Current billing cycle', badge: 'Active' },
  { value: 'last_month', label: 'Last Month', desc: 'Previous 30 days', badge: 'Past' },
  { value: 'this_year', label: 'This Year', desc: 'Jan - Dec current year', badge: 'YTD' },
  { value: 'all', label: 'All Time', desc: 'Complete history', badge: 'Lifetime' },
];

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState('this_month');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if opened via query param ?action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const range = getDateRange(period);
      const params = {};
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;

      const res = await dashboardAPI.getSummary(params);
      setData(res.data.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateTransaction = async (formData) => {
    try {
      await transactionAPI.create(formData);
      toast.success('Transaction added successfully!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add transaction');
      throw error;
    }
  };

  // Format monthly chart data
  const chartData = data?.monthlyData ? processMonthlyChart(data.monthlyData) : [];

  function processMonthlyChart(rawMonthly) {
    const map = {};
    rawMonthly.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!map[key]) {
        map[key] = {
          name: `${getMonthName(item._id.month)} ${item._id.year.toString().slice(-2)}`,
          income: 0,
          expense: 0,
        };
      }
      if (item._id.type === 'income') {
        map[key].income = item.total / 100;
      } else if (item._id.type === 'expense') {
        map[key].expense = item.total / 100;
      }
    });
    return Object.values(map);
  }

  // Format category pie data
  const pieData = (data?.categoryBreakdown || []).map((cat, idx) => ({
    name: cat._id,
    value: cat.total / 100,
    color: getCategoryColor(cat._id) || COLORS[idx % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Overview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and optimize your cash flow</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Custom Styled Timeframe Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:border-primary-400 dark:hover:border-primary-500 hover:shadow transition-all duration-200 text-sm font-semibold text-gray-800 dark:text-gray-100 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span>{PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'This Month'}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  periodDropdownOpen ? 'rotate-180 text-primary-600' : ''
                }`}
              />
            </button>

            {periodDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setPeriodDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 z-40 fade-in">
                  <div className="px-3 py-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Select Timeframe
                  </div>
                  <div className="space-y-1">
                    {PERIOD_OPTIONS.map((opt) => {
                      const isActive = period === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setPeriod(opt.value);
                            setPeriodDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold shadow-xs'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-primary-500/10 dark:hover:bg-primary-500/20 hover:text-primary-700 dark:hover:text-primary-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{opt.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                                  isActive
                                    ? 'bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                          {isActive && (
                            <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <Card className="hover:border-primary-400 dark:hover:border-primary-500/50 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Net Balance
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/15 border border-primary-100 dark:border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400 dark:shadow-[0_0_16px_rgba(99,102,241,0.25)] dark:ring-1 dark:ring-primary-400/20 transition-all duration-200">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-3" />
            ) : (
              <div className="mt-3">
                <div className={`text-2xl font-bold ${(data?.balance || 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-danger-500'}`}>
                  {formatCurrency(data?.balance || 0)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Income minus expenses</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card className="hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Income
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-100 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 dark:shadow-[0_0_16px_rgba(16,185,129,0.25)] dark:ring-1 dark:ring-emerald-400/20 transition-all duration-200">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-3" />
            ) : (
              <div className="mt-3">
                <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                  +{formatCurrency(data?.totalIncome || 0)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Cash earned in period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="hover:border-rose-400 dark:hover:border-rose-500/50 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Expenses
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-100 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 dark:shadow-[0_0_16px_rgba(244,63,94,0.25)] dark:ring-1 dark:ring-rose-400/20 transition-all duration-200">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-3" />
            ) : (
              <div className="mt-3">
                <div className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                  -{formatCurrency(data?.totalExpenses || 0)}
                </div>
                <p className="text-xs text-gray-400 mt-1">{data?.transactionCount || 0} total transactions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Savings Rate
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 dark:shadow-[0_0_16px_rgba(99,102,241,0.25)] dark:ring-1 dark:ring-indigo-400/20 transition-all duration-200">
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-3" />
            ) : (
              <div className="mt-3">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {data?.savingsRate || 0}%
                </div>
                <p className="text-xs text-gray-400 mt-1">Percentage of income saved</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Income vs Expenses</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recent cashflow comparison</p>
            </div>
            <Link to="/analytics" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Detailed Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : chartData.length === 0 ? (
              <EmptyState title="No trend data" description="Start adding transactions to visualize income and expenses." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" name="Income" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" name="Expense" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Category Breakdown */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-white">Expense by Category</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Where your money goes</p>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : pieData.length === 0 ? (
              <EmptyState title="No expense breakdown" description="No expenses recorded for this period." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Latest activity from your accounts</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.recentTransactions || data.recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Add your first income or expense to see it here."
              action={
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  Add Transaction
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.recentTransactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between p-4 hover:bg-primary-500/10 dark:hover:bg-primary-500/15 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isExpense
                            ? 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400'
                            : 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                        }`}
                      >
                        {isExpense ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{tx.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(tx.date)}
                          </span>
                          <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                          <Badge variant={isExpense ? 'danger' : 'success'}>
                            {tx.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          isExpense ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(tx.amountMinor)}
                      </p>
                      <span className="text-xs uppercase text-gray-400 font-medium">
                        {tx.paymentMethod?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransaction}
      />
    </div>
  );
}
