'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Archive, Trash2, Edit2, Eye, Calendar, User } from 'lucide-react';
import {
  Announcement,
  AnnouncementPriority,
  AnnouncementStatus,
} from '@/lib/validations/announcement';

type Priority = 'urgent' | 'high' | 'normal' | 'low';
type VisibilityType = 'company_wide' | 'branch_specific' | 'role_specific';

interface EditFormData {
  title: string;
  content: string;
  priority: Priority;
  visibility_type: VisibilityType;
  expiry_date?: string;
}

export default function AnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  async function fetchAnnouncement() {
    try {
      setLoading(true);
      const res = await fetch(`/api/announcements/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch announcement');

      const data = await res.json();
      setAnnouncement(data);
      setEditFormData({
        title: data.title,
        content: data.content,
        priority: data.priority,
        visibility_type: data.visibility_type,
        expiry_date: data.expiry_date || undefined,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcement');
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    if (!editFormData) return false;

    const newErrors: Record<string, string> = {};

    if (editFormData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (editFormData.title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    if (editFormData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    } else if (editFormData.content.length > 5000) {
      newErrors.content = 'Content must not exceed 5000 characters';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSaveChanges() {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify(editFormData),
      });

      if (!res.ok) throw new Error('Failed to update announcement');

      const updated = await res.json();
      setAnnouncement(updated);
      setIsEditing(false);
      setEditErrors({});
    } catch (err) {
      setEditErrors({
        submit: err instanceof Error ? err.message : 'Failed to save changes',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!announcement) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!res.ok) throw new Error('Failed to publish');

      const updated = await res.json();
      setAnnouncement(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this announcement?')) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (!res.ok) throw new Error('Failed to archive');

      router.push('/announcements');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this announcement permanently? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ hard_delete: true }),
      });

      if (!res.ok) throw new Error('Failed to delete');

      router.push('/announcements');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: AnnouncementStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Loading announcement...
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Announcement not found</p>
        <button
          onClick={() => router.push('/announcements')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Announcements
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-900 font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {!isEditing && (
          <div className="flex gap-2">
            {announcement.status === 'draft' && (
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Publish
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
            >
              <Archive size={18} />
              Archive
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {editErrors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          {editErrors.submit}
        </div>
      )}

      {!isEditing ? (
        // View Mode
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{announcement.title}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${getPriorityColor(
                      announcement.priority
                    )}`}
                  >
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(
                      announcement.status
                    )}`}
                  >
                    {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Created</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Calendar size={16} />
                  {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>

              {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Last Updated</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(announcement.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {announcement.published_at && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Published</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(announcement.published_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-600 mb-1">Views</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Eye size={16} />
                  {announcement.view_count}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Visibility</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {announcement.visibility_type === 'company_wide'
                    ? 'Company-Wide'
                    : announcement.visibility_type === 'branch_specific'
                      ? 'Branch-Specific'
                      : 'Role-Specific'}
                </p>
              </div>

              {announcement.expiry_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Expires</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(announcement.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
            <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-6 whitespace-pre-wrap text-gray-700">
              {announcement.content}
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Announcement</h2>

          {editFormData && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, title: e.target.value });
                    if (editErrors.title) setEditErrors({ ...editErrors, title: '' });
                  }}
                  maxLength={255}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    editErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editFormData.title.length}/255 characters
                </p>
                {editErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.title}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Content</label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, content: e.target.value });
                    if (editErrors.content) setEditErrors({ ...editErrors, content: '' });
                  }}
                  maxLength={5000}
                  rows={8}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none ${
                    editErrors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editFormData.content.length}/5000 characters
                </p>
                {editErrors.content && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.content}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Priority</label>
                <div className="grid grid-cols-4 gap-3">
                  {['low', 'normal', 'high', 'urgent'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, priority: p as Priority })}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        editFormData.priority === p
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Visibility</label>
                <div className="space-y-2">
                  {[
                    { value: 'company_wide', label: 'Company-Wide' },
                    { value: 'branch_specific', label: 'Branch-Specific' },
                    { value: 'role_specific', label: 'Role-Specific' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={opt.value}
                        checked={editFormData.visibility_type === opt.value}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            visibility_type: e.target.value as VisibilityType,
                          })
                        }
                        className="mr-2"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={editFormData.expiry_date || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      expiry_date: e.target.value || undefined,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
