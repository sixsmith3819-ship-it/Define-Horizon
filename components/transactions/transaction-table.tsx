// components/transactions/transaction-table.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { TransactionWithCustomer, TransactionStatus } from '@/lib/validations/transaction';
import { format } from 'date-fns';
import { Eye, Edit } from 'lucide-react';

interface TransactionTableProps {
  transactions: TransactionWithCustomer[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  const colors: Record<TransactionStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colors = {
    domestic: 'bg-blue-100 text-blue-800',
    international: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

export function TransactionTable({
  transactions,
  isLoading = false,
  onDelete,
}: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 mb-2">No transactions found</p>
        <Link href="/transactions/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Create your first transaction →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
              Charge
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Method
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="text-gray-900 font-medium">
                  {transaction.customer?.first_name} {transaction.customer?.last_name}
                </div>
                <div className="text-gray-500 text-xs">
                  {transaction.customer?.email || 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <TypeBadge type={transaction.transaction_type} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                {transaction.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 font-medium">
                {transaction.service_charge.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                {transaction.total_amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {transaction.payment_method.replace('_', ' ').charAt(0).toUpperCase() + 
                 transaction.payment_method.replace('_', ' ').slice(1)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={transaction.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Link
                    href={`/transactions/${transaction.id}`}
                    className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title="View transaction"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {transaction.status === 'pending' && (
                    <Link
                      href={`/transactions/${transaction.id}/edit`}
                      className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="Edit transaction"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
