'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/lib/components/LoadingSpinner';
import { useToast, ToastContainer } from '@/lib/components/Toast';

export default function ProfilePage() {
  const { session, user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState({full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  if (!session || !user) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  const safeUser = user;

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
      // Refresh user data
      window.location.reload();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      addToast('Password changed successfully', 'success');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='space-y-6'>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        <h1 className='text-3xl font-bold text-gray-900'>My Profile</h1>
        <p className='text-gray-600 mt-1'>Manage your account settings and preferences</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Profile Card */}
        <div className='lg:col-span-2 space-y-6'>
          {/* User Info */}
          <div className='bg-white rounded-lg shadow p-6 border border-gray-200'>
            <div className='flex justify-between items-start mb-6'>
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>{user.full_name || 'User'}</h2>
                <p className='text-gray-600 mt-1'>{user.email}</p>
              </div>
              {!isEditing && !isChangingPassword && (
                <button
                  onClick={() => setIsEditing(true)}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Edit Profile
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Phone Number</p>
                  <p className='text-gray-900 mt-1'>{user.phone_number || 'Not set'}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Email Address</p>
                  <p className='text-gray-900 mt-1'>{user.email}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className='space-y-4'>
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

                <div className='flex space-x-3'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: user.full_name || '',
                        phone_number: user.phone_number || '',
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

          {/* Change Password */}
          <div className='bg-white rounded-lg shadow p-6 border border-gray-200'>
            <div className='flex justify-between items-start mb-6'>
              <h2 className='text-lg font-semibold text-gray-900'>Security</h2>
              {!isChangingPassword && !isEditing && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={handleChangePassword} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Current Password
                  </label>
                  <input
                    type='password'
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    New Password
                  </label>
                  <input
                    type='password'
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>Must be at least 8 characters</p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Confirm Password
                  </label>
                  <input
                    type='password'
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    required
                  />
                </div>

                <div className='flex space-x-3'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors'
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
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

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Account Info */}
          <div className='bg-white rounded-lg shadow p-6 border border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Account Info</h3>
            <div className='space-y-4'>
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase'>Role</p>
                <p className='text-sm text-gray-900 font-medium mt-1 capitalize'>
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase'>Branch</p>
                <p className='text-sm text-gray-900 font-medium mt-1'>{user.branch_name || '-'}</p>
              </div>
              <div>
                <p className='text-xs font-medium text-gray-500 uppercase'>Status</p>
                <p className='text-sm text-gray-900 font-medium mt-1'>
                  {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                </p>
              </div>
            </div>
          </div>

          {/* Account ID */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-xs text-blue-600 font-medium uppercase'>Account ID</p>
            <p className='text-xs text-blue-900 font-mono mt-2 break-all'>{user.id}</p>
          </div>

          {/* Help */}
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <p className='text-sm font-medium text-gray-900 mb-3'>Need Help?</p>
            <p className='text-xs text-gray-600'>
              Contact your system administrator if you need additional assistance with your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
