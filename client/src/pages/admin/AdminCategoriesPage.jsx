import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Plus, Trash2, RefreshCw, Tag
} from 'lucide-react';
import {
  Card, CardContent, Button, Input, Select,
  LoadingSpinner, Modal
} from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [customCount, setCustomCount] = useState(0);
  const [usageStats, setUsageStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('tag');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getCategories();
      setCategories(data.data.defaultCategories);
      setCustomCount(data.data.customCategoriesCount);
      setUsageStats(data.data.categoryUsage || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error('Please provide a category name');
    }
    try {
      setSaving(true);
      await adminAPI.createCategory({ name: name.trim(), type, color, icon });
      toast.success('Global category added successfully');
      setAddModalOpen(false);
      setName('');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Delete default category "${catName}"?`)) return;
    try {
      await adminAPI.deleteCategory(id);
      toast.success('Category removed');
      fetchCategories();
    } catch {
      toast.error('Failed to remove category');
    }
  };

  const getUsageCount = (catName) => {
    const found = usageStats.find((s) => s._id?.toLowerCase() === catName?.toLowerCase());
    return found ? found.count : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Category Master Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage system-wide default categories seeded to all registered users in MySQL
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchCategories}
            className="cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Default Category</span>
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Default Categories</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {categories.length}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Seeded to every new user account</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Custom User Categories</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {customCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Created independently by users</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Category Types</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Income, Expense, Both
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Universal budget & ledger taxonomy</p>
        </Card>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const usage = getUsageCount(cat.name);
            return (
              <Card
                key={cat._id || cat.id}
                className="hover:border-indigo-400/80 transition-all shadow-xs group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      >
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {cat.name}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            cat.type === 'income'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : cat.type === 'expense'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {cat.type}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(cat.id || cat._id, cat.name)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete default category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Usage in Platform:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {usage} transactions
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Global Default Category"
        size="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Subscriptions, Groceries, Dividends"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Category Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="expense">Expense Category</option>
            <option value="income">Income Category</option>
            <option value="both">Both (Income & Expense)</option>
          </Select>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Badge Color Palette
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800"
              />
              <span className="text-xs font-mono text-slate-500">{color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAddModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

