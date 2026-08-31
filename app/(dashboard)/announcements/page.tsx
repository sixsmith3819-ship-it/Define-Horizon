'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Archive, Trash2, Eye, Plus, Search } from 'lucide-react';
import {
  Announcement,
  AnnouncementPriority,
  AnnouncementStatus,
} from '@/lib/validations/announcement';

type SortOption = 'newest' | 'oldest' | 'priority-high' | 'priority-low';

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('employee');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [page, setPage] = useState(1);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await fetch(`/api/announcements?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } 
      });
      
      if (!res.ok) throw new Error('Failed to fetch announcements');

      const result = await res.json();
      setAnnouncements(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    // Decode JWT to get user role (only runs once on mount or when dependencies change)
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.user_metadata?.role || payload.role || 'employee';
        setUserRole(role);
      } catch (e) {
        console.error('Failed to decode token:', e);
        setUserRole('employee'); // Default to employee on error
      }
    }
    
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  async function handleArchive(id: string) {
    if (!confirm('Archive this announcement?')) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (!res.ok) throw new Error('Failed to archive');
      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive announcement');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement permanently? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify({ hard_delete: true }),
      });

      if (!res.ok) throw new Error('Failed to delete');
      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
    }
  }

  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: AnnouncementStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityOrder = (priority: AnnouncementPriority) => {
    const order: Record<AnnouncementPriority, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };
    return order[priority];
  };

  const sorted = [...announcements];
  if (sortBy === 'priority-high') {
    sorted.sort((a, b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority));
  } else if (sortBy === 'priority-low') {
    sorted.sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority));
  } else if (sortBy === 'oldest') {
    sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="glass-lg rounded-2xl p-6 animate-slideInUp">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient-primary mb-2">Announcements</h1>
            <p className="text-slate-600 text-lg">Company-wide communications and updates</p>
          </div>
          {isSuperAdmin && (
            <Link 
              href="/announcements/new" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              New Announcement
            </Link>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-lg rounded-xl p-4 border-l-4 border-red-500 bg-red-50/50 animate-slideInUp">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="glass-lg rounded-2xl p-6 space-y-4 animate-slideInUp">
        {/* Search and Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as AnnouncementStatus | 'all');
              setPage(1);
            }}
            className="px-4 py-2.5 bg-white/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as AnnouncementPriority | 'all');
              setPage(1);
            }}
            className="px-4 py-2.5 bg-white/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2.5 bg-white/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority-high">Priority: High First</option>
            <option value="priority-low">Priority: Low First</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm font-medium text-slate-600 mr-2">View:</span>
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'card'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="glass-lg rounded-2xl p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Loading announcements...</p>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-lg rounded-2xl p-12">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Announcements Found</h3>
            <p className="text-slate-600 mb-6">
              {announcements.length === 0
                ? 'No announcements yet. Create one to get started.'
                : 'No announcements match your filters.'}
            </p>
            {announcements.length === 0 && isSuperAdmin && (
              <Link
                href="/announcements/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Your First Announcement
              </Link>
            )}
          </div>
        </div>
      ) : viewMode === 'card' ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((announcement, index) => (
            <div
              key={announcement.id}
              className="glass-lg rounded-xl overflow-hidden hover-lift animate-slideInUp group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2 flex-1">
                    {announcement.title}
                  </h3>
                  {announcement.priority === 'urgent' && (
                    <div className="text-2xl flex-shrink-0">⚠️</div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                      announcement.priority
                    )}`}
                  >
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      announcement.status
                    )}`}
                  >
                    {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 line-clamp-3">{announcement.content}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{announcement.view_count}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-slate-200/50 flex items-center gap-2">
                <Link
                  href={`/announcements/${announcement.id}`}
                  className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                >
                  View Details
                </Link>
                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => handleArchive(announcement.id)}
                      title="Archive"
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      title="Delete"
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="glass-lg rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Views
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sorted.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium max-w-md">
                      <div className="line-clamp-1">{announcement.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                          announcement.priority
                        )}`}
                      >
                        {announcement.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          announcement.status
                        )}`}
                      >
                        {announcement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {announcement.view_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/announcements/${announcement.id}`}
                          className="text-cyan-600 hover:text-cyan-900 font-medium transition-colors"
                        >
                          View
                        </Link>
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleArchive(announcement.id)}
                              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                            >
                              Archive
                            </button>
                            <button
                              onClick={() => handleDelete(announcement.id)}
                              className="text-red-600 hover:text-red-900 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="glass-lg rounded-xl p-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-600 font-medium">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}