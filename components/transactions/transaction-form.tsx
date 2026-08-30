// components/transactions/transaction-form.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTransactionSchema, CreateTransactionInput, Customer } from '@/lib/validations/transaction';
import { calculateServiceCharge, calculateTotalAmount } from '@/lib/utils/service-charge';
import { ServiceChargeCalculator } from './service-charge-calculator';

interface TransactionFormProps {
  customers: Customer[];
  onSubmit: (data: CreateTransactionInput & { serviceCharge: number; totalAmount: number }) => Promise<void>;
  isLoading?: boolean;
}

export function TransactionForm({
  customers,
  onSubmit,
  isLoading = false,
}: TransactionFormProps) {
  const [serviceCharge, setServiceCharge] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      amount: 0,
      transaction_type: 'domestic',
      payment_method: 'bank_transfer',
    },
  });

  const amount = watch('amount');
  const transactionType = watch('transaction_type');

  // Update service charge and total when amount or type changes
  useEffect(() => {
    if (amount && amount > 0) {
      const charge = calculateServiceCharge(amount, transactionType);
      const total = calculateTotalAmount(amount, transactionType);
      setServiceCharge(charge);
      setTotalAmount(total);
    } else {
      setServiceCharge(0);
      setTotalAmount(0);
    }
  }, [amount, transactionType]);

  const handleFormSubmit = async (data: CreateTransactionInput) => {
    await onSubmit({
      ...data,
      serviceCharge,
      totalAmount,
    });
    reset();
    setServiceCharge(0);
    setTotalAmount(0);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Customer Selection */}
      <div>
        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-2">
          Customer *
        </label>
        <select
          id="customer_id"
          {...register('customer_id')}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="">Select a customer...</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.first_name} {customer.last_name}
              {customer.email ? ` (${customer.email})` : ''}
            </option>
          ))}
        </select>
        {errors.customer_id && (
          <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount *
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          {...register('amount', { valueAsNumber: true })}
          disabled={isLoading}
          placeholder="0.00"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Transaction Type */}
      <div>
        <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Type *
        </label>
        <select
          id="transaction_type"
          {...register('transaction_type')}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="domestic">Domestic (8% charge)</option>
          <option value="international">International (10% charge)</option>
        </select>
        {errors.transaction_type && (
          <p className="mt-1 text-sm text-red-600">{errors.transaction_type.message}</p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method *
        </label>
        <select
          id="payment_method"
          {...register('payment_method')}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="cheque">Cheque</option>
        </select>
        {errors.payment_method && (
          <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
        )}
      </div>

      {/* Reference */}
      <div>
        <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
          Reference Number
        </label>
        <input
          id="reference"
          type="text"
          {...register('reference')}
          disabled={isLoading}
          placeholder="e.g., TXN-12345"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        {errors.reference && (
          <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description/Notes
        </label>
        <textarea
          id="description"
          {...register('description')}
          disabled={isLoading}
          placeholder="Add any additional notes about this transaction..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Service Charge Calculator */}
      {amount && amount > 0 && (
        <ServiceChargeCalculator
          amount={amount}
          transactionType={transactionType}
          serviceCharge={serviceCharge}
          totalAmount={totalAmount}
        />
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !amount || amount <= 0}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Creating Transaction...' : 'Create Transaction'}
      </button>
    </form>
  );
}
