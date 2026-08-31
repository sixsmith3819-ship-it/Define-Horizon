'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/lib/components/LoadingSpinner';
import { ErrorAlert } from '@/lib/components/ErrorAlert';
import { EmptyState } from '@/lib/components/EmptyState';
import { useToast, ToastContainer } from '@/lib/components/Toast';
import { AuditLogger } from '@/lib/audit/logger';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLES } from '@/lib/constants/roles';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  role: string;
  branch_id?: string;
  branch_name?: string;
  created_at: string;
  last_login_timestamp?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  // Only allow super admin
  useEffect(() => {
    if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN) {
      router.push('/dashboard');
      return;
    }
  }, [currentUser, router]);

  useEffect(() => {
    AuditLogger.logUserManagementViewed();
    fetchUsers();
  }, [roleFilter, statusFilter]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone_number?.includes(searchTerm)) &&
      (!roleFilter || u.role === roleFilter) &&
      (!statusFilter || (statusFilter === 'active' ? u.is_active : !u.is_active))
  );

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update user');

      setUsers(users.map((u) => (u.id === id ? { ...u, is_active: !currentStatus } : u)));
      addToast(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      await AuditLogger.logUserStatusChanged(id, !currentStatus ? 'Active' : 'Inactive');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      addToast(message, 'error');
    }
  }

  if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and access control</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchUsers} />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
              <option value={ROLES.BRANCH_MANAGER}>Branch Manager</option>
              <option value={ROLES.EMPLOYEE}>Employee</option>
              <option value={ROLES.AUDITOR}>Auditor</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            {(searchTerm || roleFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
                className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="No Users Found"
          message={
            searchTerm || roleFilter || statusFilter
              ? 'Try adjusting your filters'
              : 'No users in the system'
          }
          icon="👤"
        />
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Branch</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {user.full_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.branch_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.last_login_timestamp
                      ? new Date(user.last_login_timestamp).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Link
                      href={`/users/${user.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className="text-orange-600 hover:text-orange-900 font-medium"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && filteredUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong>{' '}
            user(s)
          </p>
        </div>
      )}
    </div>
  );
}
