'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '@/lib/components/LoadingSpinner';
import { ErrorAlert } from '@/lib/components/ErrorAlert';
import { useToast, ToastContainer } from '@/lib/components/Toast';
import { AuditLogger } from '@/lib/audit/logger';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLES } from '@/lib/constants/roles';

interface UserDetail {
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

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.user_id as string;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    is_active: true,
  });
  const { toasts, addToast, removeToast } = useToast();

  // Only allow super admin
  useEffect(() => {
    if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN) {
      router.push('/dashboard');
      return;
    }
  }, [currentUser, router]);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      const userData = data.data || data;
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        phone_number: userData.phone_number || '',
        is_active: userData.is_active,
      });
      await AuditLogger.logUserViewed(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update user');
      const data = await res.json();
      setUser(data.data || data);
      setIsEditing(false);
      addToast('User updated successfully', 'success');
      await AuditLogger.logUserUpdated(userId, formData.full_name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      addToast(message, 'error');
    }
  }

  if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className='space-y-6'>
        <Link href='/users' className='text-blue-600 hover:text-blue-700 font-medium'>
          ← Back to Users
        </Link>
        <ErrorAlert message='User not found' onRetry={fetchUser} />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Link href='/users' className='text-blue-600 hover:text-blue-700 font-medium'>
        ← Back to Users
      </Link>

      {error && <ErrorAlert message={error} onRetry={fetchUser} />}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-white rounded-lg shadow p-6 border border-gray-200'>
            <div className='flex justify-between items-start mb-6'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>{user.full_name || user.email}</h1>
                <p className='text-gray-600 mt-1'>{user.email}</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Phone</p>
                  <p className='text-gray-900'>{user.phone_number || '-'}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                  />
                </div>

                <div>
                  <label className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className='w-4 h-4 border border-gray-300 rounded'
                    />
                    <span className='text-sm font-medium text-gray-700'>Active</span>
                  </label>
                </div>

                <div className='flex space-x-3'>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Save Changes
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: user.full_name || '',
                        phone_number: user.phone_number || '',
                        is_active: user.is_active,
                      });
                    }}
                    className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className='space-y-6'>
          <div className='bg-white rounded-lg shadow p-6 border border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Account Details</h2>
            <div className='space-y-4'>
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase'>Role</p>
                <p className='text-sm text-gray-900 capitalize font-medium mt-1'>
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase'>Branch</p>
                <p className='text-sm text-gray-900 font-medium mt-1'>{user.branch_name || '-'}</p>
              </div>
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase'>Joined</p>
                <p className='text-sm text-gray-900 font-medium mt-1'>
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase'>Last Login</p>
                <p className='text-sm text-gray-900 font-medium mt-1'>
                  {user.last_login_timestamp
                    ? new Date(user.last_login_timestamp).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-xs text-blue-600 font-medium uppercase'>User ID</p>
            <p className='text-sm text-blue-900 font-mono mt-1 break-all'>{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
