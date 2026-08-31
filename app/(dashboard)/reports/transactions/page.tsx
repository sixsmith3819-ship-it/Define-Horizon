'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/lib/components/LoadingSpinner';
import { ErrorAlert } from '@/lib/components/ErrorAlert';
import { EmptyState } from '@/lib/components/EmptyState';
import { useToast, ToastContainer } from '@/lib/components/Toast';
import { AuditLogger } from '@/lib/audit/logger';

export default function TransactionsReportPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    total: 0,
    amount: 0,
    charges: 0,
    local: 0,
    international: 0,
  });
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    AuditLogger.logReportGenerated('transactions', 'Full report view');
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/reports/transactions');
      if (!res.ok) throw new Error('Failed to fetch report');
      const data = await res.json();
      setTransactions(data.data || []);

      const total = data.data?.length || 0;
      const amount = data.data?.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0;
      const charges = data.data?.reduce((s: number, t: any) => s + (t.service_charge || 0), 0) || 0;
      const local = data.data?.filter((t: any) => t.is_local).length || 0;
      const intl = total - local;

      setMetrics({ total, amount, charges, local, international: intl });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load report';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <h1 className="text-3xl font-bold">Transaction Report</h1>

      {error && <ErrorAlert message={error} onRetry={fetchTransactions} />}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-xs font-medium">Total</div>
          <div className="text-2xl font-bold">{metrics.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-xs font-medium">Amount</div>
          <div className="text-2xl font-bold">${metrics.amount.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-xs font-medium">Charges</div>
          <div className="text-2xl font-bold">${metrics.charges.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-xs font-medium">Local</div>
          <div className="text-2xl font-bold">{metrics.local}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500 hover:shadow-lg transition-shadow">
          <div className="text-gray-600 text-xs font-medium">International</div>
          <div className="text-2xl font-bold">{metrics.international}</div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No Transactions Found"
          message="No transaction data available for this period"
          icon="💳"
        />
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Reference</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Charge</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.reference || t.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{t.transaction_type}</td>
                  <td className="px-4 py-3">${(t.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">${(t.service_charge || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">
                    ${((t.amount || 0) + (t.service_charge || 0)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
