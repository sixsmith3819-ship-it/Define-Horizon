// app/(dashboard)/transactions/page.tsx

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { TransactionWithCustomer, TransactionStatus } from '@/lib/validations/transaction';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    status: '' as TransactionStatus | '',
    transaction_type: '' as 'domestic' | 'international' | '',
    searchCustomer: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.status) {
        params.append('status', filters.status);
      }

      if (filters.transaction_type) {
        params.append('transaction_type', filters.transaction_type);
      }

      const response = await fetch(`/api/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      let data = result.data || [];

      // Client-side filtering for customer search
      if (filters.searchCustomer) {
        const searchLower = filters.searchCustomer.toLowerCase();
        data = data.filter(
          (tx: TransactionWithCustomer) =>
            `${tx.customer?.first_name} ${tx.customer?.last_name}`
              .toLowerCase()
              .includes(searchLower) || tx.customer?.email?.toLowerCase().includes(searchLower)
        );
      }

      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">Manage and track all financial transactions</p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Transaction
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value as TransactionStatus) || '',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              id="type-filter"
              value={filters.transaction_type}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  transaction_type: (e.target.value as 'domestic' | 'international') || '',
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="domestic">Domestic (8%)</option>
              <option value="international">International (10%)</option>
            </select>
          </div>

          {/* Customer Search */}
          <div>
            <label
              htmlFor="customer-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Customer
            </label>
            <input
              id="customer-search"
              type="text"
              placeholder="Name or email..."
              value={filters.searchCustomer}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  searchCustomer: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.status || filters.transaction_type || filters.searchCustomer) && (
          <button
            onClick={() =>
              setFilters({
                status: '',
                transaction_type: '',
                searchCustomer: '',
              })
            }
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div>
        <TransactionTable transactions={transactions} isLoading={isLoading} />
      </div>

      {/* Results Summary */}
      {!isLoading && transactions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Showing <strong>{transactions.length}</strong> transaction(s)
          </p>
        </div>
      )}
    </div>
  );
}
