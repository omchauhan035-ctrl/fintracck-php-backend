import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatCurrencyMinor, formatDate } from '../../utils/helpers';
import {
  Users, ArrowLeftRight, TrendingUp, TrendingDown, Shield,
  Activity, ArrowUpRight, CheckCircle2, AlertTriangle, RefreshCw,
  Wallet, Layers, ArrowRight, Tags
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { Card, CardHeader, CardContent, Badge, Button, LoadingSpinner } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const { data } = await adminAPI.getStats();
      setStats(data.data);
    } catch {
      toast.error('Failed to load admin metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Admin Metrics</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
          Failed to fetch platform metrics from the PHP backend. Please check that your PHP server is running on port 5000 and MySQL is active in XAMPP.
        </p>
        <Button onClick={fetchStats} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer mx-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          <span>Retry Connection</span>
        </Button>
      </div>
    );
  }

  // Format monthly trend data for Recharts
  const chartData = (stats?.monthlyTrends || []).reduce((acc, curr) => {
    if (!curr?._id?.year || !curr?._id?.month) return acc;
    const monthName = new Date(curr._id.year, curr._id.month - 1).toLocaleString('default', {
      month: 'short',
    });
    let existing = acc.find((item) => item.month === monthName);
    if (!existing) {
      existing = { month: monthName, income: 0, expense: 0 };
      acc.push(existing);
    }
    if (curr._id.type === 'income') {
      existing.income += (curr.totalMinor || 0) / 100;
    } else {
      existing.expense += (curr.totalMinor || 0) / 100;
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                System Administrator Console
              </span>
              <span className="text-xs text-slate-400">• Database: MySQL (XAMPP Connected)</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">FinTrack Executive Command Center</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Platform-wide telemetry, user directory controls, global transactions ledger, and infrastructure health monitoring.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchStats}
              disabled={refreshing}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </Button>
            <Link to="/admin/users">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md">
                <Users className="w-4 h-4" />
                <span>Manage Users</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Users
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {stats?.users?.total || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {stats?.users?.active || 0} Active
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                {stats?.users?.admins || 0} Admins
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total System Transactions */}
        <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  System Transactions
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {stats?.transactions?.total || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>Budgets: {stats?.budgets?.total || 0}</span>
              <span>Goals: {stats?.goals?.total || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Inflow Volume */}
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total System Inflow
                </p>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrencyMinor(stats?.transactions?.totalIncomeMinor || 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              Aggregated income registered across all user ledgers
            </p>
          </CardContent>
        </Card>

        {/* Total Outflow Volume */}
        <Card className="border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total System Outflow
                </p>
                <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrencyMinor(stats?.transactions?.totalExpenseMinor || 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              Aggregated expenses recorded across all categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Platform Cash Flow Trend */}
      {chartData.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Platform-Wide Monthly Cash Flow Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gross Inflow vs Outflow recorded across all user accounts
              </p>
            </div>
            <Badge variant="primary">Multi-Account Aggregation</Badge>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      val != null ? `₹${Number(val).toLocaleString('en-IN')}` : '₹0',
                      '',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Platform Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Platform Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Columns: Recent Registered Users & Recent System Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent User Accounts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest registrations in MySQL</p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View All ({stats?.users?.total})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(stats?.recentUsers || []).map((u) => (
                <div key={u._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        u.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Global Transactions */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Global Transaction Feed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live system-wide activity</p>
            </div>
            <Link
              to="/admin/transactions"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Audit Feed ({stats?.transactions?.total})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto">
              {(stats?.recentTransactions || []).map((tx) => (
                <div key={tx._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {tx.userId?.name || 'User'} • {tx.category} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p
                      className={`text-xs font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrencyMinor(tx.amountMinor)}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">{tx.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          to="/admin/users"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">User Directory & Roles</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search users, toggle admin permissions, and manage account suspensions.
          </p>
        </Link>

        <Link
          to="/admin/categories"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Tags className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Category Master</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure system-wide default expense & income categories with custom palettes.
          </p>
        </Link>

        <Link
          to="/admin/system"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">System Health & Telemetry</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect real-time memory usage, database connection state, and server uptime.
          </p>
        </Link>
      </div>
    </div>
  );
}

