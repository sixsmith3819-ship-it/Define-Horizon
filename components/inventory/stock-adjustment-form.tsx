// components/inventory/stock-adjustment-form.tsx - Stock adjustment form component

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const STOCK_REASONS = ['purchase', 'sale', 'damage', 'loss', 'return', 'correction', 'other'];

const stockAdjustmentSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reason: z.string().min(1, 'Please select a reason'),
  reference: z.string().optional(),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentFormProps {
  productId: string;
  currentQuantity: number;
  adjustmentType: 'in' | 'out';
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function StockAdjustmentForm({
  productId,
  currentQuantity,
  adjustmentType,
  onSubmit,
  isLoading = false,
}: StockAdjustmentFormProps) {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      reason: adjustmentType === 'in' ? 'purchase' : 'sale',
    },
  });

  const quantity = watch('quantity') || 0;
  const resultingQuantity = adjustmentType === 'in' ? currentQuantity + quantity : currentQuantity - quantity;

  const handleFormSubmit = async (data: StockAdjustmentFormData) => {
    try {
      setError('');
      setSuccess('');

      // Validate stock availability for removal
      if (adjustmentType === 'out' && quantity > currentQuantity) {
        setError(`Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`);
        return;
      }

      await onSubmit({
        ...data,
        movement_type: adjustmentType,
      });

      setSuccess(`Stock ${adjustmentType === 'in' ? 'added' : 'removed'} successfully`);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const renderError = (error: any) => {
    if (error && typeof error.message === 'string') {
      return error.message;
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
      {error && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
          {error}
        </div>
      )}

      {success && (
        <div className='p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm'>
          {success}
        </div>
      )}

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Quantity <span className='text-red-500'>*</span>
        </label>
        <input
          type='number'
          {...register('quantity', { valueAsNumber: true })}
          placeholder='0'
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          disabled={isLoading || isSubmitting}
        />
        {errors.quantity && <p className='text-red-500 text-sm mt-1'>{renderError(errors.quantity)}</p>}
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Reason <span className='text-red-500'>*</span>
        </label>
        <select
          {...register('reason')}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          disabled={isLoading || isSubmitting}
        >
          {STOCK_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason.charAt(0).toUpperCase() + reason.slice(1)}
            </option>
          ))}
        </select>
        {errors.reason && <p className='text-red-500 text-sm mt-1'>{renderError(errors.reason)}</p>}
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Reference / Document</label>
        <input
          type='text'
          {...register('reference')}
          placeholder='e.g., Invoice #, Reference number'
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          disabled={isLoading || isSubmitting}
        />
      </div>

      {/* Result Preview */}
      <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg'>
        <p className='text-xs text-gray-600 mb-1'>Result:</p>
        <div className='flex justify-between items-center'>
          <span className='text-sm text-gray-700'>
            Current: <strong>{currentQuantity}</strong>
          </span>
          <span className='text-gray-400'>→</span>
          <span
            className={`text-sm font-semibold ${
              resultingQuantity < 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {resultingQuantity >= 0 ? 'New: ' : 'Warning: '}
            <strong>{resultingQuantity}</strong>
          </span>
        </div>
      </div>

      <button
        type='submit'
        disabled={isLoading || isSubmitting || resultingQuantity < 0}
        className={`w-full px-4 py-2 rounded-lg font-medium text-white transition ${
          adjustmentType === 'in'
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
            : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
        }`}
      >
        {isLoading || isSubmitting ? (
          <>
            <span className='inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></span>
            Processing...
          </>
        ) : (
          `${adjustmentType === 'in' ? 'Add' : 'Remove'} Stock`
        )}
      </button>
    </form>
  );
}
