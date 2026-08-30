'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  customer_type: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    customer_type: 'individual',
    address: '',
  });

  // Fetch customer data on mount
  useEffect(() => {
    async function fetchCustomer() {
      try {
        setLoading(true);
        const res = await fetch(`/api/customers/${customerId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Customer not found');
          }
          throw new Error('Failed to fetch customer');
        }
        const data: Customer = await res.json();
        setCustomer(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || '',
          phone: data.phone,
          customer_type: data.customer_type || 'individual',
          address: data.address || '',
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [customerId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.first_name.trim()) {
        throw new Error('First name is required');
      }
      if (!formData.last_name.trim()) {
        throw new Error('Last name is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone is required');
      }

      // Validate phone format
      const phoneRegex = /^\+?263\d{9,10}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
        throw new Error('Please enter a valid Zimbabwe phone number (e.g., +263771234567)');
      }

      // Validate email if provided
      if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Please enter a valid email address');
      }

      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim(),
          customer_type: formData.customer_type,
          address: formData.address.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update customer');
      }

      const updatedCustomer = await res.json();
      setCustomer(updatedCustomer);
      setError(null);
      // Show success message (can be replaced with toast)
      alert('Customer updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete customer');
      }

      router.push('/customers');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Edit Customer</h1>
        </div>
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='text-center text-gray-600'>Loading customer...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Customer Not Found</h1>
        </div>
        <div className='bg-white rounded-lg shadow p-6'>
          <p className='text-gray-600 mb-4'>The customer you're looking for doesn't exist.</p>
          <Link
            href='/customers'
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Edit Customer</h1>
          <p className='text-gray-600 mt-1'>
            {customer.first_name} {customer.last_name}
          </p>
        </div>
        <Link
          href='/customers'
          className='text-gray-600 hover:text-gray-900'
        >
          ← Back to Customers
        </Link>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg shadow p-6'>
            {error && (
              <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* First Name */}
                <div>
                  <label htmlFor='first_name' className='block text-sm font-medium text-gray-700 mb-2'>
                    First Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='first_name'
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor='last_name' className='block text-sm font-medium text-gray-700 mb-2'>
                    Last Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='last_name'
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                    Email
                  </label>
                  <input
                    type='email'
                    id='email'
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Optional</p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
                    Phone <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='tel'
                    id='phone'
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>Zimbabwe format (e.g., +263771234567)</p>
                </div>

                {/* Customer Type */}
                <div>
                  <label htmlFor='customer_type' className='block text-sm font-medium text-gray-700 mb-2'>
                    Customer Type <span className='text-red-500'>*</span>
                  </label>
                  <select
                    id='customer_type'
                    value={formData.customer_type}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_type: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                  >
                    <option value='individual'>Individual</option>
                    <option value='business'>Business</option>
                    <option value='organization'>Organization</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor='address' className='block text-sm font-medium text-gray-700 mb-2'>
                    Address
                  </label>
                  <input
                    type='text'
                    id='address'
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Optional</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className='flex gap-4 pt-6 border-t border-gray-200'>
                <button
                  type='submit'
                  disabled={submitting}
                  className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  href='/customers'
                  className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center'
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Customer Info Card */}
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='font-semibold text-gray-900 mb-4'>Customer Information</h3>
            <div className='space-y-3 text-sm'>
              <div>
                <p className='text-gray-600'>ID</p>
                <p className='font-mono text-gray-900 break-all'>{customer.id}</p>
              </div>
              <div>
                <p className='text-gray-600'>Created</p>
                <p className='text-gray-900'>
                  {new Date(customer.created_at).toLocaleDateString()} at{' '}
                  {new Date(customer.created_at).toLocaleTimeString()}
                </p>
              </div>
              {customer.updated_at && (
                <div>
                  <p className='text-gray-600'>Last Updated</p>
                  <p className='text-gray-900'>
                    {new Date(customer.updated_at).toLocaleDateString()} at{' '}
                    {new Date(customer.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className='bg-white rounded-lg shadow p-6 border border-red-200'>
            <h3 className='font-semibold text-red-900 mb-4'>Danger Zone</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Deleting a customer cannot be undone. Please be certain.
            </p>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                deleteConfirm
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {deleteConfirm
                ? 'Click again to confirm delete'
                : 'Delete Customer'}
            </button>
            {deleteConfirm && (
              <button
                onClick={() => setDeleteConfirm(false)}
                className='w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
