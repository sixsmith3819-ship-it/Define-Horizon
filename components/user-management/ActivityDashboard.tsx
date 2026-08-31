'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, AlertCircle, Users, UserCheck, UserX } from 'lucide-react';
import clsx from 'clsx';

interface DashboardMetrics {
  summary: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    pending_invitations: number;
    new_this_month: number;
  };
  trends: {
    new_users: {
      current: number;
      previous: number;
      trend: 'up' | 'down' | 'stable';
      percentage_change: number;
    };
  };
  recent_activity: Array<{
    timestamp: string;
    user_id: string;
  }>;
  recent_deactivations: Array<{
    user_id: string;
    name: string;
    email: string;
    deactivated_at: string;
    reason?: string;
  }>;
}

interface ActivityDashboardProps {
  refreshInterval?: number; // Auto-refresh in ms
  onQuickAction?: (action: string) => void;
}

/**
 * User Management Activity Dashboard
 * Displays metrics, trends, and quick actions
 */
export function ActivityDashboard({
  refreshInterval = 60000,
  onQuickAction,
}: ActivityDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        if (data.success) {
          setMetrics(data.data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch metrics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  if (loading && !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 border border-slate-200 animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-2 w-24" />
            <div className="h-8 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <MetricCard
          title="Total Users"
          value={metrics.summary.total_users}
          icon={<Users className="text-blue-600" size={24} />}
          href="/users/list"
        />

        {/* Active Users */}
        <MetricCard
          title="Active Users"
          value={metrics.summary.active_users}
          icon={<UserCheck className="text-green-600" size={24} />}
          href="/users/list?status=active"
        />

        {/* Inactive Users */}
        <MetricCard
          title="Inactive Users"
          value={metrics.summary.inactive_users}
          icon={<UserX className="text-orange-600" size={24} />}
          href="/users/list?status=inactive"
        />

        {/* Pending Invitations */}
        <MetricCard
          title="Pending Invitations"
          value={metrics.summary.pending_invitations}
          icon={<AlertCircle className="text-yellow-600" size={24} />}
        />

        {/* New This Month */}
        <MetricCard
          title="New This Month"
          value={metrics.summary.new_this_month}
          trend={metrics.trends.new_users}
          icon={<TrendingUp className="text-purple-600" size={24} />}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionButton
            label="Create User"
            href="/users/new"
            onClick={() => onQuickAction?.('create')}
          />
          <QuickActionButton
            label="Export Users"
            href="/users/export"
            onClick={() => onQuickAction?.('export')}
          />
          <QuickActionButton
            label="View Audit Log"
            href="/users/audit"
            onClick={() => onQuickAction?.('audit')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deactivations */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Deactivations</h2>
          {metrics.recent_deactivations.length > 0 ? (
            <div className="space-y-3">
              {metrics.recent_deactivations.slice(0, 5).map((deactivation) => (
                <div
                  key={deactivation.user_id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{deactivation.name}</p>
                      <p className="text-sm text-slate-600">{deactivation.email}</p>
                      {deactivation.reason && (
                        <p className="text-sm text-slate-500 mt-1">Reason: {deactivation.reason}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(deactivation.deactivated_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">No recent deactivations</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {metrics.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {metrics.recent_activity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">User Login</p>
                    <p className="text-xs text-slate-600">{activity.user_id}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatTime(activity.timestamp)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
  trend?: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    percentage_change: number;
  };
}

/**
 * Metric Card Component
 */
function MetricCard({ title, value, icon, href, trend }: MetricCardProps) {
  const content = (
    <div className="h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {trend && (
          <div
            className={clsx('flex items-center gap-1 text-sm font-medium', {
              'text-green-600': trend.trend === 'up',
              'text-red-600': trend.trend === 'down',
              'text-slate-600': trend.trend === 'stable',
            })}
          >
            {trend.trend === 'up' && <TrendingUp size={16} />}
            {trend.trend === 'down' && <TrendingDown size={16} />}
            {trend.percentage_change > 0 && `+${trend.percentage_change}%`}
            {trend.percentage_change < 0 && `-${trend.percentage_change}%`}
            {trend.percentage_change === 0 && '0%'}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block bg-white rounded-lg p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
      >
        {content}
      </Link>
    );
  }

  return <div className="bg-white rounded-lg p-6 border border-slate-200">{content}</div>;
}

interface QuickActionButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Quick Action Button Component
 */
function QuickActionButton({ label, href, onClick }: QuickActionButtonProps) {
  const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors text-sm';
  const hoverClass = 'bg-blue-600 text-white hover:bg-blue-700';

  if (href) {
    return (
      <Link href={href} className={clsx(baseClass, hoverClass)} onClick={onClick}>
        {label}
      </Link>
    );
  }

  return (
    <button className={clsx(baseClass, hoverClass)} onClick={onClick}>
      {label}
    </button>
  );
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time to readable string
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
