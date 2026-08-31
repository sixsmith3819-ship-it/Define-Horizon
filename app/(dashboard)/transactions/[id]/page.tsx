// app/(dashboard)/transactions/[id]/page.tsx

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TransactionWithCustomer, TransactionStatus } from '@/lib/validations/transaction';
import { format } from 'date-fns';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TransactionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionWithCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus>('pending');
  const [updateReason, setUpdateReason] = useState('');

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transaction');
      }

      const data = await response.json();
      setTransaction(data);
      setSelectedStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching transaction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!transaction || selectedStatus === transaction.status) {
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          reason: updateReason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      const updated = await response.json();
      setTransaction(updated);
      setUpdateReason('');
      alert('Transaction status updated successfully');
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating transaction:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading transaction...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-4">
        <Link
          href="/transactions"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
        </Link>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-red-700 text-sm mt-1">{error || 'Transaction not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
    const colors: Record<TransactionStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/transactions"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
        </Link>
        <StatusBadge status={transaction.status} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Transaction ID */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Transaction #{transaction.id.slice(0, 8)}...
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Created on {format(new Date(transaction.created_at), 'MMMM dd, yyyy h:mm a')}
              </p>
            </div>

            {/* Customer Info */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">
                    {transaction.customer?.first_name} {transaction.customer?.last_name}
                  </span>
                </div>
                {transaction.customer?.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{transaction.customer.email}</span>
                  </div>
                )}
                {transaction.customer?.phone_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">
                      {transaction.customer.phone_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">
                    {transaction.transaction_type === 'domestic' ? 'Domestic' : 'International'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-900">
                    {transaction.payment_method.replace('_', ' ').charAt(0).toUpperCase() +
                      transaction.payment_method.replace('_', ' ').slice(1)}
                  </span>
                </div>
                {transaction.reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium text-gray-900">{transaction.reference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="border-t pt-6 bg-blue-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount Breakdown</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Amount:</span>
                  <span className="font-medium text-gray-900">${transaction.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Service Charge ({transaction.transaction_type === 'domestic' ? '8%' : '10%'}):
                  </span>
                  <span className="font-medium text-blue-600">
                    +${transaction.service_charge.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-blue-200 my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${transaction.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {transaction.description && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{transaction.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Update Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>

            {updateError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{updateError}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="status-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Status
              </label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TransactionStatus)}
                disabled={isUpdating}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {selectedStatus !== 'pending' && (
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  id="reason"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Why is this transaction being updated?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            )}

            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating || selectedStatus === transaction.status}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </button>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                <strong>Note:</strong> Status transitions follow a one-way path: pending → completed
                or failed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}