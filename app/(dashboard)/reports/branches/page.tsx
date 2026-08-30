'use client';

import { useEffect, useState } from 'react';

export default function BranchesReportPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/branches');
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Branch Report</h1>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : branches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No branches found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Branch</th>
                <th className="px-4 py-3 text-left font-semibold">Code</th>
                <th className="px-4 py-3 text-left font-semibold">Location</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {branches.map((b: any) => (
                <tr key={b.branch_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{b.branch_name}</td>
                  <td className="px-4 py-3">{b.branch_code}</td>
                  <td className="px-4 py-3">{b.address}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${b.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
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
