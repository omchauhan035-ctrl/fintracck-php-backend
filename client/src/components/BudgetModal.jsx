import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button, Input, Select } from './ui';
import { categoryAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function BudgetModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: '',
      amount: '',
      period: 'monthly',
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (initialData) {
        reset({
          category: initialData.category || '',
          amount: (initialData.amountMinor ? initialData.amountMinor / 100 : initialData.amount || '').toString(),
          period: initialData.period || 'monthly',
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : defaultStartDate,
          endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : defaultEndDate,
        });
      } else {
        reset({
          category: '',
          amount: '',
          period: 'monthly',
          startDate: defaultStartDate,
          endDate: defaultEndDate,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryAPI.getAll({ type: 'expense' });
      setCategories(data.data.categories || []);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Budget' : 'Create Budget'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Select
          label="Expense Category"
          error={errors.category?.message}
          {...register('category', { required: 'Please select a category' })}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>

        <Input
          label="Budget Limit (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 15000"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 1, message: 'Amount must be at least ₹1' },
          })}
        />

        <Select
          label="Budget Period"
          error={errors.period?.message}
          {...register('period', { required: 'Period is required' })}
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate', { required: 'Start date is required' })}
          />
          <Input
            label="End Date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate', { required: 'End date is required' })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Budget' : 'Set Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
