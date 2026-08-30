'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Eye } from 'lucide-react';

type Priority = 'urgent' | 'high' | 'normal' | 'low';
type VisibilityType = 'company_wide' | 'branch_specific' | 'role_specific';

interface FormData {
  title: string;
  content: string;
  priority: Priority;
  visibility_type: VisibilityType;
  expiry_date?: string;
}

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    priority: 'normal',
    visibility_type: 'company_wide',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [publishMode, setPublishMode] = useState<'draft' | 'publish'>('draft');

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    if (formData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    } else if (formData.content.length > 5000) {
      newErrors.content = 'Content must not exceed 5000 characters';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    if (!formData.visibility_type) {
      newErrors.visibility_type = 'Visibility is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        status: publishMode,
      };

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create announcement');
      }

      const announcement = await res.json();

      // Redirect to detail page
      router.push(`/announcements/${announcement.id}`);
      router.refresh();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to create announcement',
      });
    } finally {
      setLoading(false);
    }
  }

  const priorityColors: Record<Priority, string> = {
    urgent: 'text-red-600',
    high: 'text-orange-600',
    normal: 'text-blue-600',
    low: 'text-gray-600',
  };

  const charCount = formData.content.length;
  const charLimit = 5000;
  const charPercentage = (charCount / charLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Announcement</h1>
        <p className="text-gray-600 mt-1">Create and publish a company-wide announcement</p>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                placeholder="Enter announcement title"
                maxLength={255}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-xs text-gray-500">Min 5 characters, Max 255 characters</p>
                <p className={`text-xs ${formData.title.length >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.title.length}/255
                </p>
              </div>
              {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Content <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value });
                  if (errors.content) setErrors({ ...errors, content: '' });
                }}
                placeholder="Enter announcement content..."
                maxLength={5000}
                rows={10}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="mt-3 space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      charPercentage > 90 ? 'bg-red-600' : charPercentage > 70 ? 'bg-orange-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(charPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Min 20 characters, Max 5000 characters</p>
                  <p
                    className={`text-xs ${charCount >= 20 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {charCount}/{charLimit}
                  </p>
                </div>
              </div>
              {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content}</p>}
            </div>

            {/* Options */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Priority <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['low', 'normal', 'high', 'urgent'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p as Priority })}
                      className={`px-3 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.priority === p
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`capitalize ${priorityColors[p as Priority]}`}>
                        {p === 'urgent' && '🔴 '}
                        {p === 'high' && '🟠 '}
                        {p === 'normal' && '🔵 '}
                        {p === 'low' && '⚪ '}
                        {p}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.priority && <p className="mt-2 text-sm text-red-600">{errors.priority}</p>}
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Visibility <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'company_wide', label: 'Company-Wide', desc: 'All users see this' },
                    { value: 'branch_specific', label: 'Branch-Specific', desc: 'Only selected branches' },
                    { value: 'role_specific', label: 'Role-Specific', desc: 'Only selected roles' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="visibility"
                        value={opt.value}
                        checked={formData.visibility_type === opt.value}
                        onChange={(e) =>
                          setFormData({ ...formData, visibility_type: e.target.value as VisibilityType })
                        }
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-600">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.visibility_type && <p className="mt-2 text-sm text-red-600">{errors.visibility_type}</p>}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Expiry Date <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiry_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value || undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Announcement will automatically archive after this date
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle size={20} />
                {errors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPublishMode('draft');
                    if (validateForm()) {
                      handleSubmit({
                        preventDefault: () => {},
                      } as React.FormEvent);
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  <Save size={18} className="inline mr-2" />
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPublishMode('publish');
                    if (validateForm()) {
                      handleSubmit({
                        preventDefault: () => {},
                      } as React.FormEvent);
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6 space-y-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
              >
                <Eye size={18} />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>

              {showPreview && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Preview</h3>

                  {/* Preview Cards */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Card View Preview */}
                    <div className="bg-white border-t-4 border-blue-600">
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
                          {formData.title || 'Your title here...'}
                        </h4>
                        <div className="flex gap-2 mb-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              formData.priority === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : formData.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : formData.priority === 'normal'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {formData.priority}
                          </span>
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            draft
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {formData.content || 'Your content preview...'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                      {formData.content || 'Content will appear here...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Publishing Info */}
              <div className="border-t border-gray-200 pt-4 text-xs text-gray-600 space-y-2">
                <p className="font-semibold text-gray-900">Publishing Options:</p>
                <ul className="space-y-1">
                  <li>• <span className="font-medium">Save as Draft:</span> Not visible to users yet</li>
                  <li>• <span className="font-medium">Publish:</span> Visible to all immediately</li>
                  <li className="pt-2">Status can be changed later by editing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
