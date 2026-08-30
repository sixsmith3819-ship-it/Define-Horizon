'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/lib/components/LoadingSpinner';
import { ErrorAlert } from '@/lib/components/ErrorAlert';
import { EmptyState } from '@/lib/components/EmptyState';
import { useToast, ToastContainer } from '@/lib/components/Toast';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLES } from '@/lib/constants/roles';

interface AuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  timestamp: string;
  status: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    user_email: '',
    startDate: '',
    endDate: '',
  });
  const { toasts, addToast, removeToast } = useToast();

  // Only allow super admin and auditor
  useEffect(() => {
    if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN && currentUser.role !== ROLES.AUDITOR) {
      router.push('/dashboard');
      return;
    }
  }, [currentUser, router]);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  async function fetchLogs() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.user_email) params.append('user_email', filters.user_email);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const actionColors: Record<string, string> = {
    'create': 'bg-green-100 text-green-800',
    'read': 'bg-blue-100 text-blue-800',
    'update': 'bg-orange-100 text-orange-800',
    'delete': 'bg-red-100 text-red-800',
    'login': 'bg-purple-100 text-purple-800',
    'logout': 'bg-gray-100 text-gray-800',
  };

  const entityTypeIcons: Record<string, string> = {
    'user': '👤',
    'branch': '🏢',
    'customer': '👥',
    'transaction': '💳',
    'product': '📦',
    'announcement': '📢',
    'default': '📋',
  };

  if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN && currentUser.role !== ROLES.AUDITOR) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Audit Logs</h1>
        <p className='text-gray-600 mt-1'>System activity and changes tracking</p>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchLogs} />}

      {/* Filters */}
      <div className='bg-white rounded-lg shadow p-4 space-y-4'>
        <h2 className='text-lg font-semibold text-gray-900'>Filters</h2>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div>
            <input
              type='text'
              placeholder='Search by email...'
              value={filters.user_email}
              onChange={(e) => setFilters({ ...filters, user_email: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
            />
          </div>

          <div>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
            >
              <option value=''>All Actions</option>
              <option value='create'>Create</option>
              <option value='read'>Read</option>
              <option value='update'>Update</option>
              <option value='delete'>Delete</option>
              <option value='login'>Login</option>
              <option value='logout'>Logout</option>
            </select>
          </div>

          <div>
            <select
              value={filters.entity_type}
              onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
            >
              <option value=''>All Entities</option>
              <option value='user'>User</option>
              <option value='branch'>Branch</option>
              <option value='customer'>Customer</option>
              <option value='transaction'>Transaction</option>
              <option value='product'>Product</option>
              <option value='announcement'>Announcement</option>
            </select>
          </div>

          <div>
            <input
              type='date'
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
            />
          </div>

          <div>
            <input
              type='date'
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
            />
          </div>
        </div>

        {(filters.action || filters.entity_type || filters.user_email || filters.startDate || filters.endDate) && (
          <button
            onClick={() =>
              setFilters({
                action: '',
                entity_type: '',
                user_email: '',
                startDate: '',
                endDate: '',
              })
            }
            className='text-blue-600 hover:text-blue-700 text-sm font-medium'
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : logs.length === 0 ? (
        <EmptyState
          title='No Audit Logs'
          message={filters.action || filters.entity_type || filters.user_email ? 'Try adjusting your filters' : 'No activity recorded yet'}
          icon='📋'
        />
      ) : (
        <div className='bg-white rounded-lg shadow border border-gray-200 overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Timestamp</th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>User</th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Action</th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Entity</th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Details</th>
                <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {logs.map(log => (
                <tr key={log.id} className='hover:bg-gray-50 transition-colors'>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-900'>{log.user_email || '-'}</td>
                  <td className='px-6 py-4'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        actionColors[log.action] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm'>
                    <span className='flex items-center space-x-2'>
                      <span>{entityTypeIcons[log.entity_type] || entityTypeIcons['default']}</span>
                      <span className='text-gray-900 capitalize'>{log.entity_type}</span>
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {log.details ? (
                      <details className='cursor-pointer'>
                        <summary className='text-blue-600 hover:text-blue-700'>
                          View
                        </summary>
                        <pre className='mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-w-md'>
                          {JSON.stringify(JSON.parse(log.details), null, 2)}
                        </pre>
                      </details>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {log.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && logs.length > 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <p className='text-sm text-blue-800'>
            Showing <strong>{logs.length}</strong> audit log(s)
          </p>
        </div>
      )}
    </div>
  );
}
