import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { formatDate, formatCurrencyMinor } from '../../utils/helpers';
import {
  Users, Search, Shield, ShieldCheck,
  UserX, UserCheck, Trash2, RefreshCw, AlertTriangle
} from 'lucide-react';
import {
  Card, CardContent, Button, LoadingSpinner, Modal
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 10,
      });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      await adminAPI.updateUserStatus(user.id || user._id, newStatus);
      toast.success(`User ${user.name} is now ${newStatus}`);
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === (user.id || user._id) ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUserRole(user.id || user._id, newRole);
      toast.success(`User ${user.name} role changed to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === (user.id || user._id) ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await adminAPI.deleteUser(userToDelete.id || userToDelete._id);
      toast.success(`User ${userToDelete.name} deleted`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            User Accounts Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Total {pagination.total} registered users in MySQL
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={fetchUsers}
          className="self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user name or email..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">All Roles</option>
                <option value="user">Standard Users</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="blocked">Suspended Only</option>
              </select>

              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No users found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search keyword or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Financial Flow</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isCurrent = String(u.id || u._id) === String(currentAdmin?.id || currentAdmin?._id);
                  return (
                    <tr
                      key={u._id || u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Users className="w-3.5 h-3.5" />
                          )}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>

                      {/* Transactions count */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {u.transactionCount || 0}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">entries</span>
                      </td>

                      {/* Financial flow */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{formatCurrencyMinor(u.totalIncomeMinor || 0)}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            -{formatCurrencyMinor(u.totalSpentMinor || 0)}
                          </p>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleStatusToggle(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.status === 'active'
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.status === 'active' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>

                          {/* Toggle Role */}
                          <button
                            onClick={() => handleRoleToggle(u)}
                            disabled={isCurrent}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteModalOpen(true);
                            }}
                            disabled={isCurrent}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete User and Associated Records"
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

        {/* Pagination Footer */}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm User Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>
              Warning: Deleting <strong>{userToDelete?.name}</strong> will permanently erase all their transactions,
              budgets, and savings goals from MySQL.
            </p>
          </div>
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
              onClick={handleDeleteUser}
              disabled={deleting}
              className="cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete User Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

