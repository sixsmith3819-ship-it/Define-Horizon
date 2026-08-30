'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  customer_type: string;
  address: string;
  created_at: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  }

  return (
    // NO CHANGE - Already using max-w-7xl from dashboard layout
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Customers</h1>
          <p className='text-gray-600 mt-1'>Manage customer information</p>
        </div>
        <Link
          href='/customers/new'
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          + Add Customer
        </Link>
      </div>

      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
          {error}
        </div>
      )}

      <div className='bg-white rounded-lg shadow'>
        {/* Search Bar */}
        <div className='p-4 border-b border-gray-200'>
          <input
            type='text'
            placeholder='Search by name, email, or phone...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className='p-8 text-center text-gray-600'>Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className='p-8 text-center text-gray-600'>
            {customers.length === 0 ? 'No customers yet. Create one to get started.' : 'No customers match your search.'}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Name</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Email</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Phone</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Type</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Date Added</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className='border-b border-gray-200 hover:bg-gray-50'>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {customer.first_name} {customer.last_name}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>{customer.email}</td>
                    <td className='px-6 py-4 text-sm text-gray-600'>{customer.phone}</td>
                    <td className='px-6 py-4 text-sm'>
                      <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium'>
                        {customer.customer_type || 'Individual'}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-sm space-x-2'>
                      <Link
                        href={`/customers/${customer.id}`}
                        className='text-blue-600 hover:text-blue-900 font-medium'
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className='text-red-600 hover:text-red-900 font-medium'
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
