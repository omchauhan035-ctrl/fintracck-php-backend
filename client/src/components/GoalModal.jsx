import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button, Input, Select } from './ui';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#06b6d4', // Cyan
];

export default function GoalModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      targetAmount: '',
      targetDate: '',
      icon: 'target',
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSelectedColor(initialData.color || '#6366f1');
        reset({
          title: initialData.title || '',
          targetAmount: (initialData.targetAmountMinor ? initialData.targetAmountMinor / 100 : initialData.targetAmount || '').toString(),
          targetDate: initialData.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : '',
          icon: initialData.icon || 'target',
          status: initialData.status || 'active',
        });
      } else {
        setSelectedColor('#6366f1');
        reset({
          title: '',
          targetAmount: '',
          targetDate: '',
          icon: 'target',
          status: 'active',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        targetAmount: parseFloat(formData.targetAmount),
        targetDate: formData.targetDate || null,
        color: selectedColor,
        icon: formData.icon,
        status: formData.status,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Savings Goal' : 'Create Savings Goal'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Goal Name"
          placeholder="e.g. Emergency Fund, New Car, Bali Vacation"
          error={errors.title?.message}
          {...register('title', { required: 'Goal title is required' })}
        />

        <Input
          label="Target Amount (₹)"
          type="number"
          step="0.01"
          placeholder="e.g. 100000"
          error={errors.targetAmount?.message}
          {...register('targetAmount', {
            required: 'Target amount is required',
            min: { value: 1, message: 'Target amount must be at least ₹1' },
          })}
        />

        <Input
          label="Target Date (Optional)"
          type="date"
          error={errors.targetDate?.message}
          {...register('targetDate')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Goal Theme Color
          </label>
          <div className="flex items-center gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  selectedColor === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {isEditing && (
          <Select label="Status" {...register('status')}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </Select>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
