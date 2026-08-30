// components/inventory/product-form.tsx - Product form component

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, ProductCategory } from '@/lib/validations/product';

interface ProductFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: any;
  mode?: 'create' | 'edit';
}

const CATEGORIES: ProductCategory[] = ['Electronics', 'Software', 'Accessories', 'Services', 'Other'];

export function ProductForm({
  onSubmit,
  isLoading = false,
  defaultValues,
  mode = 'create',
}: ProductFormProps) {
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: defaultValues || {
      status: 'active',
      quantity: 0,
      reorder_level: 5,
    },
  });

  const buyingPrice = watch('buying_price') || 0;
  const sellingPrice = watch('selling_price') || 0;
  const profitMargin = buyingPrice > 0 ? ((sellingPrice - buyingPrice) / buyingPrice) * 100 : 0;

  const handleFormSubmit = async (data: any) => {
    try {
      setError('');
      await onSubmit(data);
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* SKU */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            SKU <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            {...register('sku')}
            placeholder='e.g., PROD-001'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={isLoading || isSubmitting}
          />
          {errors.sku && <p className='text-red-500 text-sm mt-1'>{renderError(errors.sku)}</p>}
        </div>

        {/* Category */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Category <span className='text-red-500'>*</span>
          </label>
          <select
            {...register('category')}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={isLoading || isSubmitting}
          >
            <option value=''>Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className='text-red-500 text-sm mt-1'>{renderError(errors.category)}</p>}
        </div>
      </div>

      {/* Product Name */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Product Name <span className='text-red-500'>*</span>
        </label>
        <input
          type='text'
          {...register('name')}
          placeholder='e.g., Dell Laptop'
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          disabled={isLoading || isSubmitting}
        />
        {errors.name && <p className='text-red-500 text-sm mt-1'>{renderError(errors.name)}</p>}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Buying Price */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Buying Price <span className='text-red-500'>*</span>
          </label>
          <div className='relative'>
            <span className='absolute left-4 top-2.5 text-gray-500'>$</span>
            <input
              type='number'
              step='0.01'
              {...register('buying_price', { valueAsNumber: true })}
              placeholder='0.00'
              className='w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              disabled={isLoading || isSubmitting}
            />
          </div>
          {errors.buying_price && (
            <p className='text-red-500 text-sm mt-1'>{renderError(errors.buying_price)}</p>
          )}
        </div>

        {/* Selling Price */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Selling Price <span className='text-red-500'>*</span>
          </label>
          <div className='relative'>
            <span className='absolute left-4 top-2.5 text-gray-500'>$</span>
            <input
              type='number'
              step='0.01'
              {...register('selling_price', { valueAsNumber: true })}
              placeholder='0.00'
              className='w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              disabled={isLoading || isSubmitting}
            />
          </div>
          {errors.selling_price && (
            <p className='text-red-500 text-sm mt-1'>{renderError(errors.selling_price)}</p>
          )}
        </div>
      </div>

      {/* Profit Margin Display */}
      {buyingPrice > 0 && (
        <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='text-sm text-gray-700'>
            Profit Margin: <span className='font-semibold text-blue-600'>{profitMargin.toFixed(2)}%</span>
          </p>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Initial Quantity */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Initial Quantity</label>
          <input
            type='number'
            {...register('quantity', { valueAsNumber: true })}
            placeholder='0'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={isLoading || isSubmitting}
          />
          {errors.quantity && <p className='text-red-500 text-sm mt-1'>{renderError(errors.quantity)}</p>}
        </div>

        {/* Reorder Level */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Reorder Level (Low-Stock)</label>
          <input
            type='number'
            {...register('reorder_level', { valueAsNumber: true })}
            placeholder='5'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={isLoading || isSubmitting}
          />
          {errors.reorder_level && (
            <p className='text-red-500 text-sm mt-1'>{renderError(errors.reorder_level)}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Description</label>
        <textarea
          {...register('description')}
          placeholder='Optional product description'
          rows={4}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          disabled={isLoading || isSubmitting}
        />
        {errors.description && (
          <p className='text-red-500 text-sm mt-1'>{renderError(errors.description)}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className='flex gap-4'>
        <button
          type='submit'
          disabled={isLoading || isSubmitting}
          className='flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium'
        >
          {isLoading || isSubmitting ? (
            <>
              <span className='inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></span>
              Saving...
            </>
          ) : mode === 'create' ? (
            'Create Product'
          ) : (
            'Update Product'
          )}
        </button>
      </div>
    </form>
  );
}
