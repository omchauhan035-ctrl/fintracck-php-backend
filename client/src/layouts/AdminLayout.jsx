import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, LayoutDashboard, Users, ArrowLeftRight, Tags,
  Activity, ArrowLeft, LogOut, Menu, X, ChevronDown, CheckCircle2,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

const adminNavItems = [
  { path: '/admin', label: 'System Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'User Directory', icon: Users },
  { path: '/admin/transactions', label: 'Global Transactions', icon: ArrowLeftRight },
  { path: '/admin/categories', label: 'Category Master', icon: Tags },
  { path: '/admin/system', label: 'System Health', icon: Activity },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentPage = adminNavItems.find((item) => item.path === location.pathname) || {
    label: 'Admin Console',
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Admin session ended');
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Admin Brand Header */}
          <div className="h-18 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-900/50">
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    FinTrack
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">PHP/MySQL Control Center</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Label */}
          <div className="px-5 pt-5 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Management & Oversight
          </div>

          {/* Admin Navigation */}
          <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Portal Switcher & System Badge */}
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/60">
            {/* Quick switch to User Portal */}
            <Link
              to="/"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all group"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Switch to User View</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* System Status Pill */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>PHP API Active</span>
              </div>
              <span className="text-slate-400 font-mono">Port 5000</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Header */}
        <header className="h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentPage.label}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Platform administration, telemetry, and system directory
              </p>
            </div>
          </div>

          {/* Right Header: Theme Toggle & Admin Profile */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer bg-white dark:bg-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold leading-tight">
                    Super Admin
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {user?.name}
                      </p>
                      <p className="text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <Wallet className="w-4 h-4 text-emerald-500" />
                      <span>User Dashboard</span>
                    </Link>

                    <Link
                      to="/admin/system"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span>System Telemetry</span>
                    </Link>

                    <div className="border-t border-slate-100 dark:border-slate-700/60 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Admin</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Admin View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

