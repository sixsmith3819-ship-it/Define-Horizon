'use client';

import { useEffect, useState } from 'react';
import { useUserRole } from '@/lib/hooks/useUserRole';
import {
  Users,
  ArrowUpDown,
  DollarSign,
  CreditCard,
  ArrowDown,
  ArrowUp,
  Loader,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

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

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: string;
  created_at: string;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    serviceCharges: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userRole, isSuperAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem('access_token');

        // Fetch metrics (only if super admin)
        if (isSuperAdmin) {
          const metricsRes = await fetch('/api/dashboard/metrics', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (metricsRes.ok) {
            const data = await metricsRes.json();
            setMetrics(data.data || data);
          }
        }

        // Fetch recent transactions (for all users)
        const txRes = await fetch('/api/transactions?limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (txRes.ok) {
          const data = await txRes.json();
          setTransactions(data.data || data);
        }

        // Fetch announcements (published only, for all users)
        const announcementsRes = await fetch('/api/announcements?status=published&limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (announcementsRes.ok) {
          const data = await announcementsRes.json();
          setAnnouncements(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    // Wait for role to be loaded before fetching dashboard data
    if (!roleLoading) {
      loadDashboard();
    }
  }, [isSuperAdmin, roleLoading]);

  if (loading || roleLoading) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to Define Horizon BMS
          {userRole && <span className="ml-2 text-sm text-gray-500">({userRole.replace('_', ' ')})</span>}
        </p>
      </div>

      {/* Announcements Section - Show for all users */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Recent Announcements
            </h2>
            <Link 
              href="/announcements"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(announcement.priority)}`}>
                    {announcement.priority}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid - Show ONLY for super_admin */}
      {isSuperAdmin && (
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

      {/* Transactions Section - Show for all users */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <Link 
            href="/transactions"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>

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
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Direction</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {tx.customer?.first_name} {tx.customer?.last_name}
                    </td>
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