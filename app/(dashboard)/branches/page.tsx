'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/lib/components/LoadingSpinner';
import { ErrorAlert } from '@/lib/components/ErrorAlert';
import { EmptyState } from '@/lib/components/EmptyState';
import { useToast, ToastContainer } from '@/lib/components/Toast';
import { AuditLogger } from '@/lib/audit/logger';

interface Branch {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  phone_number?: string;
  is_active: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    address: '',
    phone_number: '',
  });
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    AuditLogger.logBranchViewed('list');
    fetchBranches();
  }, [search]);

  async function fetchBranches() {
    try {
      setLoading(true);
      setError(null);
      const url = search ? `/api/branches?search=${search}` : '/api/branches';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch branches');
      setBranches(await res.json());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load branches';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create branch');
      const newBranch = await res.json();

      await AuditLogger.logBranchCreated(newBranch.branch_id, newBranch.branch_name);

      setFormData({ branch_name: '', branch_code: '', address: '', phone_number: '' });
      setShowForm(false);
      fetchBranches();
      addToast(`Branch "${newBranch.branch_name}" created successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create branch';
      setError(message);
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Branches</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Branch'}
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchBranches} />}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Create New Branch</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Branch Name"
              required
              value={formData.branch_name}
              onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Branch Code"
              required
              value={formData.branch_code}
              onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Phone (optional)"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Save Branch'}
            </button>
          </form>
        </div>
      )}

      <input
        type="text"
        placeholder="🔍 Search branches..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <LoadingSpinner />
      ) : branches.length === 0 ? (
        <EmptyState
          title="No Branches Found"
          message={search ? 'Try adjusting your search' : 'Create your first branch to get started'}
          icon="🏢"
        />
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Address</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {branches.map((branch) => (
                <tr key={branch.branch_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{branch.branch_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{branch.branch_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{branch.address}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{branch.phone_number || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        branch.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {branch.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/branches/${branch.branch_id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
