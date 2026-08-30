'use client';

import Link from 'next/link';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/reports/customers"
          className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow border-t-4 border-blue-500 text-center"
        >
          <div className="text-4xl mb-4">👥</div>
          <h2 className="text-xl font-semibold">Customers</h2>
          <p className="text-gray-600 text-sm mt-2">Customer list and details</p>
        </Link>

        <Link
          href="/reports/transactions"
          className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow border-t-4 border-green-500 text-center"
        >
          <div className="text-4xl mb-4">💳</div>
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-gray-600 text-sm mt-2">Transaction activity and summary</p>
        </Link>

        <Link
          href="/reports/stock"
          className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow border-t-4 border-purple-500 text-center"
        >
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-xl font-semibold">Stock</h2>
          <p className="text-gray-600 text-sm mt-2">Product inventory status</p>
        </Link>

        <Link
          href="/reports/branches"
          className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow border-t-4 border-orange-500 text-center"
        >
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold">Branches</h2>
          <p className="text-gray-600 text-sm mt-2">Branch performance overview</p>
        </Link>
      </div>
    </div>
  );
}
