import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { formatCurrency, getMonthName, getCategoryColor } from '../utils/helpers';
import { Card, CardHeader, CardContent, Skeleton, EmptyState } from '../components/ui';
import { TrendingUp, BarChart2, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [incomeExpenses, setIncomeExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [resIE, resCat, resTrends] = await Promise.all([
        analyticsAPI.getIncomeExpenses({ months }),
        analyticsAPI.getCategories({ type: 'expense' }),
        analyticsAPI.getTrends({ months }),
      ]);

      setIncomeExpenses(resIE.data.data || []);
      setCategories(resCat.data.data || []);
      setTrends(resTrends.data.data || []);
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Process income/expense bar data
  const barData = processIncomeExpense(incomeExpenses);

  function processIncomeExpense(raw) {
    const map = {};
    raw.forEach((item) => {
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

  // Savings trend data
  const trendData = trends.map((t) => ({
    name: `${getMonthName(t.month)} ${t.year.toString().slice(-2)}`,
    savings: t.savings / 100,
    rate: t.savingsRate,
  }));

  // Category Pie Data
  const pieData = categories.map((cat, idx) => ({
    name: cat.category,
    value: cat.total / 100,
    color: getCategoryColor(cat.category) || COLORS[idx % COLORS.length],
    count: cat.count,
    percentage: cat.percentage,
  }));

  const totalExpenseAll = categories.reduce((sum, c) => sum + (c.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Deep dive into your income streams, expense patterns, and savings trajectory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expense Bars */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Income & Expenses Comparison</h3>
              <p className="text-xs text-gray-500">Monthly breakdown in INR</p>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : barData.length === 0 ? (
              <EmptyState title="No cashflow data" description="Start logging transactions to view bar comparisons." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.14)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Savings Trend Line Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <LineIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Net Savings Trend</h3>
              <p className="text-xs text-gray-500">Surplus or deficit accumulated monthly</p>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : trendData.length === 0 ? (
              <EmptyState title="No trend history" description="Savings trend will calculate over multi-month data." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Net Saved']}
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
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    name="Net Savings"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Spending Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-2">
            <PieIcon className="w-5 h-5 text-pink-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Category Distribution</h3>
              <p className="text-xs text-gray-500">Overall expense composition</p>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : pieData.length === 0 ? (
              <EmptyState title="No categories recorded" description="No expenses logged yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Detailed Category Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-white">Category Spending Breakdown</h3>
            <p className="text-xs text-gray-500">Sorted by highest expenditure</p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <EmptyState title="No categories" description="No transactions available to categorize." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 uppercase">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Transactions</th>
                      <th className="py-3 px-4 text-right">Total Spent</th>
                      <th className="py-3 px-4 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {categories.map((c) => (
                      <tr key={c.category} className="hover:bg-primary-500/10 dark:hover:bg-primary-500/15 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoryColor(c.category) }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {c.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500">
                          {c.count}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(c.total)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              {c.percentage}%
                            </span>
                            <div className="w-16 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-primary-500 h-full rounded-full"
                                style={{ width: `${Math.min(c.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
