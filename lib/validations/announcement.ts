// lib/validations/announcement.ts - Zod validation schemas for announcements

import { z } from 'zod';

export const AnnouncementStatusEnum = z.enum(['draft', 'published', 'archived']);
export const AnnouncementPriorityEnum = z.enum(['urgent', 'high', 'normal', 'low']);
export const VisibilityTypeEnum = z.enum(['company_wide', 'branch_specific', 'role_specific']);

export const createAnnouncementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title must not exceed 255 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters').max(5000, 'Content must not exceed 5000 characters'),
  priority: AnnouncementPriorityEnum.default('normal'),
  visibility_type: VisibilityTypeEnum.default('company_wide'),
  visibility_branches: z.array(z.string().uuid()).optional().default([]),
  visibility_roles: z.array(z.string()).optional().default([]),
  expiry_date: z.string().datetime().optional().nullable(),
  status: AnnouncementStatusEnum.optional().default('draft'),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  content: z.string().min(20).max(5000).optional(),
  priority: AnnouncementPriorityEnum.optional(),
  visibility_type: VisibilityTypeEnum.optional(),
  visibility_branches: z.array(z.string().uuid()).optional(),
  visibility_roles: z.array(z.string()).optional(),
  expiry_date: z.string().datetime().optional().nullable(),
  status: AnnouncementStatusEnum.optional(),
});

export const announcementFiltersSchema = z.object({
  status: AnnouncementStatusEnum.optional(),
  priority: AnnouncementPriorityEnum.optional(),
  search: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type AnnouncementFilters = z.infer<typeof announcementFiltersSchema>;
export type AnnouncementStatus = z.infer<typeof AnnouncementStatusEnum>;
export type AnnouncementPriority = z.infer<typeof AnnouncementPriorityEnum>;
export type VisibilityType = z.infer<typeof VisibilityTypeEnum>;

// Response types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  visibility_type: VisibilityType;
  visibility_branches: string[];
  visibility_roles: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  archived_at?: string | null;
  expiry_date?: string | null;
  view_count: number;
}

export interface AnnouncementWithAuthor extends Announcement {
  author?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
}
