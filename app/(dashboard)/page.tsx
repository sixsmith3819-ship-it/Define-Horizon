'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowUpDown,
  DollarSign,
  CreditCard,
  ArrowDown,
  ArrowUp,
  Loader,
} from 'lucide-react';

interface DashboardMetrics {
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
  serviceCharges: number;
}

interface Transaction {
  id: string;
  amount: number;
  direction: 'inbound' | 'outbound';
  provider: {
    name: string;
  };
  status: string;
  created_at: string;
  customer?: {
    first_name: string;
    last_name: string;
  };
}

interface UserProfile {
  user_id: string;
  role: {
    name: string;
  };
  full_name: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MetricCard = ({ title, value, borderColor, icon: Icon }: MetricCardProps) => (
  <div
    className={`bg-white rounded-lg border-l-4 ${borderColor} p-6 shadow-sm hover:shadow-md transition-shadow`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="ml-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    serviceCharges: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Get user profile
        const profileRes = await fetch('/api/auth/profile');
        if (!profileRes.ok) {
          router.push('/login');
          return;
        }
        const profile = await profileRes.json();
        setUserProfile(profile);

        // Fetch metrics
        const metricsRes = await fetch('/api/dashboard/metrics');
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data.data || data);
        }

        // Fetch transactions based on role
        let txUrl = '/api/transactions';
        if (profile.role?.name === 'employee') {
          // Employees only see transactions they recorded
          txUrl += `?recorded_by=${profile.user_id}`;
        }

        const txRes = await fetch(txUrl);
        if (txRes.ok) {
          const data = await txRes.json();
          setTransactions(data.data || data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const isAdmin = userProfile?.role?.name === 'admin';
  const isEmployee = userProfile?.role?.name === 'employee';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {userProfile?.full_name} (
          {userProfile?.role?.name === 'admin' ? 'Administrator' : 'Employee'})
        </p>
      </div>

      {/* Metrics Grid - Only show for Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Customers"
            value={metrics.totalCustomers}
            borderColor="border-blue-500"
            icon={Users}
          />
          <MetricCard
            title="Total Transactions"
            value={metrics.totalTransactions}
            borderColor="border-green-500"
            icon={ArrowUpDown}
          />
          <MetricCard
            title="Transaction Revenue"
            value={`$${metrics.totalRevenue.toFixed(2)}`}
            borderColor="border-purple-500"
            icon={DollarSign}
          />
          <MetricCard
            title="Service Charges"
            value={`$${metrics.serviceCharges.toFixed(2)}`}
            borderColor="border-orange-500"
            icon={CreditCard}
          />
        </div>
      )}

      {/* Transactions Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isAdmin ? 'All Transactions' : 'Your Transactions'}
        </h2>

        {transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  {isAdmin && (
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Direction</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {tx.customer?.first_name} {tx.customer?.last_name}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      ${parseFloat(tx.amount.toString()).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {tx.direction === 'inbound' ? (
                          <>
                            <ArrowDown className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Inbound</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600 font-medium">Outbound</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {tx.provider?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.status}
                      </span>
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
