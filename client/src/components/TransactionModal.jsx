import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button, Input, Select } from './ui';
import { categoryAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function TransactionModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: 'expense',
      title: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'upi',
      notes: '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (initialData) {
        reset({
          type: initialData.type || 'expense',
          title: initialData.title || '',
          amount: (initialData.amountMinor ? initialData.amountMinor / 100 : initialData.amount || '').toString(),
          category: initialData.category || '',
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          paymentMethod: initialData.paymentMethod || 'upi',
          notes: initialData.notes || '',
        });
      } else {
        reset({
          type: 'expense',
          title: '',
          amount: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'upi',
          notes: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.data.categories || []);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const filteredCategories = categories.filter((c) => c.type === selectedType);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        amount: parseFloat(formData.amount), // Backend controller multiplies by 100 to get amountMinor
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || '',
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1">
          <button
            type="button"
            onClick={() => reset({ ...watch(), type: 'expense', category: '' })}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedType === 'expense'
                ? 'bg-white dark:bg-gray-800 text-danger-600 dark:text-danger-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => reset({ ...watch(), type: 'income', category: '' })}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedType === 'income'
                ? 'bg-white dark:bg-gray-800 text-success-600 dark:text-success-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Income
          </button>
        </div>

        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g. Grocery run, Monthly salary, Uber ride"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />

        {/* Amount */}
        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
        />

        {/* Category */}
        <Select
          label="Category"
          error={errors.category?.message}
          {...register('category', { required: 'Please select a category' })}
        >
          <option value="">Select category</option>
          {filteredCategories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>

        {/* Date & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />

          <Select
            label="Payment Method"
            error={errors.paymentMethod?.message}
            {...register('paymentMethod')}
          >
            <option value="upi">UPI / GPay / PhonePe</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Net Banking</option>
            <option value="wallet">Digital Wallet</option>
            <option value="other">Other</option>
          </Select>
        </div>

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="Any additional details..."
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
