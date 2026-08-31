'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Megaphone, Eye, ChevronRight } from 'lucide-react';
import { Announcement } from '@/lib/validations/announcement';
import {
  getPriorityColor,
  getPriorityIcon,
  truncateContent,
  getTimeAgo,
  sortByPriorityAndDate,
} from '@/lib/utils/announcements';

export default function AnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const res = await fetch('/api/announcements?status=published&limit=5');
      if (!res.ok) throw new Error('Failed to fetch announcements');

      const result = await res.json();
      const sorted = sortByPriorityAndDate(result.data);
      setAnnouncements(sorted.slice(0, 5));
      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone size={20} className="text-orange-600" />
            Latest Announcements
          </h2>
        </div>
        <div className="text-center py-8 text-gray-600">Loading announcements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone size={20} className="text-orange-600" />
            Latest Announcements
          </h2>
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          Failed to load announcements
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone size={20} className="text-orange-600" />
            Latest Announcements
          </h2>
          <Link
            href="/announcements"
            className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Content */}
      {announcements.length === 0 ? (
        <div className="p-6 text-center text-gray-600">
          <p>No announcements yet</p>
          <Link
            href="/announcements/new"
            className="text-blue-600 hover:text-blue-900 text-sm font-medium mt-2 inline-block"
          >
            Create one
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {announcements.map((announcement) => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className="p-4 hover:bg-gray-50 transition-colors block group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Priority Badge + Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getPriorityColor(announcement.priority)}`}
                    >
                      {getPriorityIcon(announcement.priority)}
                    </span>
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      {announcement.title}
                    </h3>
                  </div>

                  {/* Content Preview */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {truncateContent(announcement.content, 80)}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{getTimeAgo(announcement.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {announcement.view_count}
                    </span>
                  </div>
                </div>

                {/* Urgent Badge */}
                {announcement.priority === 'urgent' && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ⚠️ Urgent
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <Link
          href="/announcements"
          className="text-center w-full text-blue-600 hover:text-blue-900 text-sm font-medium py-2 hover:bg-blue-50 rounded transition-colors block"
        >
          View All Announcements →
        </Link>
      </div>
    </div>
  );
}
