'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Branch {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  address: string;
  phone_number?: string;
  is_active: boolean;
}

interface Stats {
  employeeCount: number;
  customerCount: number;
  transactionCount: number;
}

export default function BranchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [stats, setStats] = useState<Stats>({
    employeeCount: 0,
    customerCount: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchBranch();
  }, [id]);

  async function fetchBranch() {
    try {
      const res = await fetch(`/api/branches?id=${id}`);
      const data = await res.json();
      setBranch(data[0] || null);

      const statsRes = await fetch(`/api/branches/stats?branch_id=${id}`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!branch) return <div className="text-center py-8">Branch not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          ← Back
        </button>
        <h1 className="text-3xl font-bold">{branch.branch_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Branch Information</h2>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {branch.branch_name}
            </p>
            <p>
              <strong>Code:</strong> {branch.branch_code}
            </p>
            <p>
              <strong>Address:</strong> {branch.address}
            </p>
            <p>
              <strong>Phone:</strong> {branch.phone_number || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {branch.is_active ? '🟢 Active' : '🔴 Inactive'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-gray-600 text-sm font-medium">Employees</div>
            <div className="text-3xl font-bold">{stats.employeeCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-gray-600 text-sm font-medium">Customers</div>
            <div className="text-3xl font-bold">{stats.customerCount}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-gray-600 text-sm font-medium">Transactions</div>
            <div className="text-3xl font-bold">{stats.transactionCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
