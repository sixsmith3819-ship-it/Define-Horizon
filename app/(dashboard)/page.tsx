'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ArrowUpDown, 
  DollarSign, 
  CreditCard,
  Plus,
  FileText,
  Package,
  BarChart3
} from 'lucide-react';

interface DashboardMetrics {
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
  serviceCharges: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MetricCard = ({ title, value, trend, borderColor, icon: Icon }: MetricCardProps) => (
  <div className={`bg-white rounded-lg border-l-4 ${borderColor} p-6 shadow-sm hover:shadow-md transition-shadow`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className="text-sm text-gray-500 mt-2">{trend}</p>
        )}
      </div>
      <div className="ml-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  </div>
);

interface QuickActionProps {
  label: string;
  href: string;
  colorClass: string;
}

const QuickActionButton = ({ label, href, colorClass }: QuickActionProps) => (
  <Link 
    href={href}
    className={` text-gray-700 px-6 py-3 rounded-lg font-medium hover:shadow-md transition-all`}
  >
    {label}
  </Link>
);

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    serviceCharges: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/dashboard/metrics');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.data || data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back to Define Horizon BMS</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers}
          trend="+0% vs last month"
          borderColor="border-blue-500"
          icon={Users}
        />
        
        <MetricCard
          title="Total Transactions"
          value={metrics.totalTransactions}
          trend="+0% vs last month"
          borderColor="border-green-500"
          icon={ArrowUpDown}
        />
        
        <MetricCard
          title="Transaction Revenue"
          value={`$${metrics.totalRevenue.toFixed(2)}`}
          trend="+0% vs last month"
          borderColor="border-purple-500"
          icon={DollarSign}
        />
        
        <MetricCard
          title="Service Charges Collected"
          value={`$${metrics.serviceCharges.toFixed(2)}`}
          trend="+0% vs last month"
          borderColor="border-orange-500"
          icon={CreditCard}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton 
            label="Add Customer" 
            href="/customers/new" 
            colorClass="bg-blue-50 hover:bg-blue-100"
          />
          <QuickActionButton 
            label="Record Transaction" 
            href="/transactions/new" 
            colorClass="bg-green-50 hover:bg-green-100"
          />
          <QuickActionButton 
            label="Manage Inventory" 
            href="/inventory" 
            colorClass="bg-purple-50 hover:bg-purple-100"
          />
          <QuickActionButton 
            label="View Reports" 
            href="/reports" 
            colorClass="bg-orange-50 hover:bg-orange-100"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">No recent activity to display</p>
        </div>
      </div>
    </div>
  );
}
