import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Button, Input } from './ui';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ContributionModal({ isOpen, onClose, onSubmit, goal, mode = 'contribution' }) {
  const isWithdraw = mode === 'withdrawal';
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      amount: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ amount: '', notes: '' });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (formData) => {
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        notes: formData.notes || (isWithdraw ? 'Withdrawal' : 'Goal Contribution'),
      };
      await onSubmit(goal._id, payload, mode);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transaction failed');
    }
  };

  if (!goal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isWithdraw ? `Withdraw from ${goal.title}` : `Add Money to ${goal.title}`}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center">
          <span>Current Saved:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(goal.currentAmountMinor)}
          </span>
        </div>

        <Input
          label={isWithdraw ? 'Withdrawal Amount (₹)' : 'Contribution Amount (₹)'}
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 1, message: 'Amount must be at least ₹1' },
            validate: isWithdraw
              ? (val) =>
                  parseFloat(val) * 100 <= goal.currentAmountMinor ||
                  'Withdrawal amount cannot exceed current saved balance'
              : undefined,
          })}
        />

        <Input
          label="Notes (Optional)"
          placeholder={isWithdraw ? 'Reason for withdrawal' : 'Monthly savings, bonus, etc.'}
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isWithdraw ? 'danger' : 'primary'}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : isWithdraw ? 'Withdraw Funds' : 'Add to Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
