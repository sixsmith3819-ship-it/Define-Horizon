// app/(dashboard)/transactions/new/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { CreateTransactionInput, Customer } from '@/lib/validations/transaction';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/utils/api';

export default function NewTransactionPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<Customer[]>('/api/customers');
      setCustomers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    data: CreateTransactionInput & { serviceCharge: number; totalAmount: number }
  ) => {
    setIsSubmitting(true);
    setError(null);
    setErrorDetails(null);
    setSuccess(null);

    try {
      console.log('Submitting transaction data:', data);
      
      const result = await apiRequest<{ id: string }>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log('Transaction created:', result);
      setSuccess(`Transaction created successfully! ID: ${result.id}`);

      // Redirect to transaction detail page after a brief delay
      setTimeout(() => {
        router.push(`/transactions/${result.id}`);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error creating transaction:', errorMessage, err);
      
      // Try to parse additional error details
      try {
        const errorObj = err as any;
        if (errorObj.details) {
          setErrorDetails(JSON.stringify(errorObj.details, null, 2));
        }
      } catch {}
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/transactions"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Transaction</h1>
        <p className="mt-2 text-gray-600">
          Fill in the form below to create a new transaction. Service charges will be calculated
          automatically.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
          <p className="text-green-700 text-sm mt-1">Redirecting...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          {errorDetails && (
            <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
              {errorDetails}
            </pre>
          )}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No customers found. Please create a customer first.
            </p>
            <Link
              href="/customers/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Customer
            </Link>
          </div>
        ) : (
          <TransactionForm customers={customers} onSubmit={handleSubmit} isLoading={isSubmitting} />
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Service Charge Rates:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Domestic transactions: 8%</li>
          <li>• International transactions: 10%</li>
        </ul>
        <p className="text-xs text-blue-700 mt-3">
          The service charge will be calculated automatically based on the transaction type and
          amount you enter.
        </p>
      </div>
    </div>
  );
}