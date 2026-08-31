// lib/utils/announcements.ts - Announcement utility functions

import {
  Announcement,
  AnnouncementPriority,
  AnnouncementStatus,
} from '@/lib/validations/announcement';

/**
 * Get color class for announcement priority badge
 */
export function getPriorityColor(priority: AnnouncementPriority): string {
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
}

/**
 * Get color class for announcement status badge
 */
export function getStatusColor(status: AnnouncementStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    case 'published':
      return 'bg-green-100 text-green-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get border color for priority
 */
export function getPriorityBorderColor(priority: AnnouncementPriority): string {
  switch (priority) {
    case 'urgent':
      return 'border-red-600';
    case 'high':
      return 'border-orange-600';
    case 'normal':
      return 'border-blue-600';
    case 'low':
      return 'border-gray-600';
  }
}

/**
 * Get text color for priority
 */
export function getPriorityTextColor(priority: AnnouncementPriority): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'normal':
      return 'text-blue-600';
    case 'low':
      return 'text-gray-600';
  }
}

/**
 * Format announcement date for display
 */
export function formatAnnouncementDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get time ago string for announcement
 */
export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatAnnouncementDate(dateString);
}

/**
 * Get priority order for sorting (urgent=4, high=3, normal=2, low=1)
 */
export function getPriorityOrder(priority: AnnouncementPriority): number {
  const order: Record<AnnouncementPriority, number> = {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };
  return order[priority];
}

/**
 * Sort announcements by priority then date
 */
export function sortByPriorityAndDate(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => {
    const priorityDiff = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Truncate announcement content for preview
 */
export function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

/**
 * Check if announcement is active (published and not archived)
 */
export function isAnnouncementActive(announcement: Announcement): boolean {
  return announcement.status === 'published';
}

/**
 * Check if announcement has expired
 */
export function hasAnnouncementExpired(announcement: Announcement): boolean {
  if (!announcement.expiry_date) return false;

  const expiryDate = new Date(announcement.expiry_date);
  const now = new Date();

  return now > expiryDate;
}

/**
 * Get announcement visibility label
 */
export function getVisibilityLabel(visibilityType: string): string {
  switch (visibilityType) {
    case 'company_wide':
      return 'Company-Wide';
    case 'branch_specific':
      return 'Branch-Specific';
    case 'role_specific':
      return 'Role-Specific';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate announcement statistics
 */
export function calculateAnnouncementStats(announcements: Announcement[]) {
  return {
    total: announcements.length,
    published: announcements.filter((a) => a.status === 'published').length,
    draft: announcements.filter((a) => a.status === 'draft').length,
    archived: announcements.filter((a) => a.status === 'archived').length,
    urgent: announcements.filter((a) => a.priority === 'urgent').length,
    totalViews: announcements.reduce((sum, a) => sum + a.view_count, 0),
  };
}

/**
 * Get priority icon/emoji
 */
export function getPriorityIcon(priority: AnnouncementPriority): string {
  switch (priority) {
    case 'urgent':
      return '🔴';
    case 'high':
      return '🟠';
    case 'normal':
      return '🔵';
    case 'low':
      return '⚪';
  }
}
