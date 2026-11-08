import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { categoryAPI } from '../services/api';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  ConfirmDialog,
  Modal
} from '../components/ui';
import { User, Lock, Tags, Plus, Trash2, Shield, Moon, Sun, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState(null);

  // Profile Form
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Password Form
  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    watch: watchPass,
    formState: { errors: passErrors },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Category Form
  const {
    register: regCat,
    handleSubmit: handleCatSubmit,
    reset: resetCat,
    formState: { errors: catErrors, isSubmitting: loadingCat },
  } = useForm({
    defaultValues: {
      name: '',
      type: 'expense',
      color: '#6366f1',
    },
  });

  const newPassVal = watchPass('newPassword');

  // Load Categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.data.categories || []);
    } catch {
      // ignore
    }
  };

  const onUpdateProfile = async (formData) => {
    setLoadingProfile(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const onChangePassword = async (formData) => {
    setLoadingPassword(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      toast.success('Password changed successfully');
      resetPass();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoadingPassword(false);
    }
  };

  const onAddCategory = async (formData) => {
    try {
      await categoryAPI.create(formData);
      toast.success('Category created');
      setIsCategoryModalOpen(false);
      resetCat();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  const onDeleteCategory = async () => {
    if (!deletingCatId) return;
    try {
      await categoryAPI.delete(deletingCatId);
      toast.success('Category deleted');
      setDeletingCatId(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your personal details, security credentials, and categories
        </p>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Profile Information</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4 max-w-lg">
            <Input
              label="Full Name"
              error={profileErrors.name?.message}
              {...regProfile('name', { required: 'Name is required' })}
            />

            <Input
              label="Email Address"
              type="email"
              error={profileErrors.email?.message}
              {...regProfile('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
              })}
            />

            <Button type="submit" disabled={loadingProfile}>
              {loadingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security & Password */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Security & Password</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePassSubmit(onChangePassword)} className="space-y-4 max-w-lg">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              error={passErrors.currentPassword?.message}
              {...regPass('currentPassword', { required: 'Current password is required' })}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              error={passErrors.newPassword?.message}
              {...regPass('newPassword', {
                required: 'New password is required',
                minLength: { value: 6, message: 'Must be at least 6 characters' },
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              error={passErrors.confirmPassword?.message}
              {...regPass('confirmPassword', {
                required: 'Please confirm new password',
                validate: (v) => v === newPassVal || 'Passwords do not match',
              })}
            />

            <Button type="submit" disabled={loadingPassword}>
              {loadingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Manage Custom Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-pink-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
              <p className="text-xs text-gray-500">Manage expense and income tags</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div
                key={c._id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color || '#6366f1' }}
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">{c.name}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">({c.type})</span>
                {c.isCustom && (
                  <button
                    onClick={() => setDeletingCatId(c._id)}
                    className="ml-1 text-gray-400 hover:text-danger-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Creation Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Custom Category"
      >
        <form onSubmit={handleCatSubmit(onAddCategory)} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Freelance Consulting, Gym, Pet Care"
            error={catErrors.name?.message}
            {...regCat('name', { required: 'Category name is required' })}
          />

          <Select label="Type" {...regCat('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>

          <Input
            label="Color Hex Code"
            type="color"
            className="h-10 p-1 cursor-pointer w-24"
            {...regCat('color')}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loadingCat}>
              {loadingCat ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCatId}
        onClose={() => setDeletingCatId(null)}
        onConfirm={onDeleteCategory}
        title="Delete Custom Category"
        message="Are you sure you want to remove this category? Existing transactions will retain their name."
      />
    </div>
  );
}
