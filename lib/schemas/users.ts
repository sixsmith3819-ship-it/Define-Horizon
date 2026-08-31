/**
 * User Management Zod Schemas
 *
 * Validation schemas for user CRUD operations and related endpoints
 */

import { z } from 'zod';

/**
 * Create User Request Schema
 */
export const CreateUserRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .describe('User email address'),
  full_name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(255, 'Full name must not exceed 255 characters')
    .describe('User full name'),
  phone_number: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-\(\)]{10,20}$/, 'Invalid phone number format')
    .optional()
    .describe('User phone number'),
  role_id: z.string().uuid('Invalid role ID format').describe('Role ID to assign to user'),
  branch_id: z.string().uuid('Invalid branch ID format').describe('Branch ID to assign to user'),
  department_id: z
    .string()
    .uuid('Invalid department ID format')
    .optional()
    .nullable()
    .describe('Department ID (optional)'),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

/**
 * Update User Request Schema
 */
export const UpdateUserRequestSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(255, 'Full name must not exceed 255 characters')
    .optional()
    .describe('User full name'),
  phone_number: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-\(\)]{10,20}$/, 'Invalid phone number format')
    .optional()
    .nullable()
    .describe('User phone number'),
  role_id: z
    .string()
    .uuid('Invalid role ID format')
    .optional()
    .describe('Role ID to assign to user'),
  branch_id: z
    .string()
    .uuid('Invalid branch ID format')
    .optional()
    .describe('Branch ID to assign to user'),
  department_id: z
    .string()
    .uuid('Invalid department ID format')
    .optional()
    .nullable()
    .describe('Department ID (optional)'),
  version_number: z
    .number()
    .int('Version number must be an integer')
    .nonnegative('Version number must be non-negative')
    .describe('Current version for optimistic locking'),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

/**
 * User Response Schema
 */
export const UserResponseSchema = z.object({
  user_id: z.string().uuid().describe('Unique user identifier'),
  email: z.string().email().describe('User email address'),
  full_name: z.string().describe('User full name'),
  phone_number: z.string().nullable().optional().describe('User phone number'),
  role: z.string().describe('User role name'),
  branch: z.string().describe('User branch name'),
  status: z.string().describe('User status (Active/Inactive)'),
  last_login_timestamp: z.string().datetime().nullable().describe('Last login timestamp'),
  created_at: z.string().datetime().describe('Account creation timestamp'),
  version_number: z.number().int().describe('Version number for optimistic locking'),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * User List Response Schema (with pagination)
 */
export const UserListResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  data: z.array(UserResponseSchema).describe('Array of user profiles'),
  pagination: z.object({
    page: z.number().int().positive().describe('Current page number'),
    pageSize: z.number().int().positive().describe('Page size'),
    total_count: z.number().int().nonnegative().describe('Total number of users'),
    total_pages: z.number().int().nonnegative().describe('Total number of pages'),
  }),
});

export type UserListResponse = z.infer<typeof UserListResponseSchema>;

/**
 * User Details Response Schema (with activity history)
 */
export const UserDetailsResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  data: z.object({
    user_id: z.string().uuid().describe('Unique user identifier'),
    email: z.string().email().describe('User email address'),
    full_name: z.string().describe('User full name'),
    phone_number: z.string().nullable().describe('User phone number'),
    role: z.string().describe('User role name'),
    branch: z.string().describe('User branch name'),
    status: z.string().describe('User status'),
    created_at: z.string().datetime().describe('Account creation timestamp'),
    last_login_timestamp: z.string().datetime().nullable().describe('Last login timestamp'),
    login_history: z
      .array(
        z.object({
          login_timestamp: z.string().datetime().describe('Login time'),
          ip_address: z.string().describe('IP address'),
          device_type: z.string().describe('Device type (desktop/mobile/tablet)'),
          duration_seconds: z.number().int().describe('Session duration in seconds'),
        })
      )
      .describe('Recent login history (last 5)'),
    audit_log: z
      .array(
        z.object({
          timestamp: z.string().datetime().describe('Action timestamp'),
          action_type: z.string().describe('Type of action'),
          description: z.string().describe('Action description'),
        })
      )
      .describe('Recent audit log (last 10)'),
  }),
});

export type UserDetailsResponse = z.infer<typeof UserDetailsResponseSchema>;

/**
 * Change Status Request Schema
 */
export const ChangeStatusRequestSchema = z.object({
  status: z.enum(['Active', 'Inactive']).describe('New user status'),
  suspension_reason: z.string().optional().describe('Reason for suspension if applicable'),
  suspension_notes: z.string().optional().describe('Additional notes about suspension'),
});

export type ChangeStatusRequest = z.infer<typeof ChangeStatusRequestSchema>;

/**
 * Change Status Response Schema
 */
export const ChangeStatusResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  data: z.object({
    user_id: z.string().uuid().describe('User ID'),
    status: z.string().describe('New status'),
  }),
});

export type ChangeStatusResponse = z.infer<typeof ChangeStatusResponseSchema>;

/**
 * Password Reset Request Schema (Admin)
 */
export const ResetPasswordRequestSchema = z.object({
  confirmation: z.boolean().optional().describe('Confirmation flag for password reset'),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

/**
 * Password Reset Response Schema
 */
export const ResetPasswordResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  message: z.string().describe('Success message'),
});

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

/**
 * Force Password Change Request Schema
 */
export const ForcePasswordChangeRequestSchema = z.object({
  confirmation: z.boolean().optional().describe('Confirmation flag'),
});

export type ForcePasswordChangeRequest = z.infer<typeof ForcePasswordChangeRequestSchema>;

/**
 * Force Password Change Response Schema
 */
export const ForcePasswordChangeResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  message: z.string().describe('Success message'),
});

export type ForcePasswordChangeResponse = z.infer<typeof ForcePasswordChangeResponseSchema>;

/**
 * Delete User Request Schema
 */
export const DeleteUserRequestSchema = z.object({
  confirm_email: z.string().email('Invalid email format').describe('User email for confirmation'),
});

export type DeleteUserRequest = z.infer<typeof DeleteUserRequestSchema>;

/**
 * Delete User Response Schema
 */
export const DeleteUserResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  message: z.string().describe('Success message'),
});

export type DeleteUserResponse = z.infer<typeof DeleteUserResponseSchema>;

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false).describe('Operation success flag'),
  error: z.string().describe('Error message'),
  details: z.any().optional().describe('Additional error details'),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Conflict Response Schema (Optimistic Lock Conflict)
 */
export const ConflictResponseSchema = z.object({
  success: z.literal(false).describe('Operation success flag'),
  error: z.string().describe('Conflict error message'),
  current_version: z.number().int().describe('Current version in database'),
  your_version: z.number().int().describe('Version you tried to update'),
  latest_data: UserResponseSchema.optional().describe('Latest user data'),
});

export type ConflictResponse = z.infer<typeof ConflictResponseSchema>;

/**
 * Bulk Actions Request Schema
 */
export const BulkActionsRequestSchema = z.object({
  user_ids: z
    .array(z.string().uuid('Invalid user ID format'))
    .min(1, 'At least one user ID is required')
    .max(500, 'Cannot perform bulk action on more than 500 users at once')
    .describe('Array of user IDs to perform action on'),
  action: z
    .enum(['assign_role', 'assign_branch', 'change_status', 'reset_password', 'export', 'delete'])
    .describe('Bulk action to perform'),
  role_id: z
    .string()
    .uuid('Invalid role ID format')
    .optional()
    .describe('Role ID for assign_role action'),
  branch_id: z
    .string()
    .uuid('Invalid branch ID format')
    .optional()
    .describe('Branch ID for assign_branch action'),
  status: z.enum(['Active', 'Inactive']).optional().describe('Status for change_status action'),
  suspension_reason: z
    .string()
    .optional()
    .describe('Reason for suspension if changing to Inactive'),
  format: z.enum(['csv', 'excel', 'pdf']).optional().describe('Export format for export action'),
});

export type BulkActionsRequest = z.infer<typeof BulkActionsRequestSchema>;

/**
 * Bulk Actions Response Schema
 */
export const BulkActionsResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  data: z.object({
    action: z.string().describe('Action performed'),
    total_users: z.number().int().describe('Total users in request'),
    successful_count: z.number().int().describe('Number of users successfully updated'),
    failed_count: z.number().int().describe('Number of users that failed'),
    failed_users: z
      .array(
        z.object({
          user_id: z.string().describe('User ID'),
          error: z.string().describe('Error message'),
        })
      )
      .optional()
      .describe('Details of failed users'),
    export_url: z.string().optional().describe('Download URL for export action'),
  }),
});

export type BulkActionsResponse = z.infer<typeof BulkActionsResponseSchema>;

/**
 * Export Users Request Schema
 */
export const ExportUsersRequestSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']).default('csv').describe('Export file format'),
  user_ids: z
    .array(z.string().uuid())
    .optional()
    .describe('Specific user IDs to export (if not provided, uses current filters)'),
  search: z.string().optional().describe('Search query applied to export'),
  role: z.string().uuid().optional().describe('Role filter applied to export'),
  branch: z.string().uuid().optional().describe('Branch filter applied to export'),
  status: z.string().optional().describe('Status filter applied to export'),
});

export type ExportUsersRequest = z.infer<typeof ExportUsersRequestSchema>;

/**
 * Export Users Response Schema
 */
export const ExportUsersResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  data: z.object({
    filename: z.string().describe('Export filename'),
    format: z.string().describe('Export format'),
    record_count: z.number().int().describe('Number of records exported'),
    export_timestamp: z.string().datetime().describe('When export was generated'),
    download_url: z.string().optional().describe('URL to download file'),
  }),
});

export type ExportUsersResponse = z.infer<typeof ExportUsersResponseSchema>;

/**
 * Role with Permissions Response Schema
 */
export const RoleResponseSchema = z.object({
  role_id: z.string().uuid().describe('Unique role identifier'),
  name: z.string().describe('Role name'),
  description: z.string().optional().describe('Role description'),
  permissions: z
    .array(
      z.object({
        permission_id: z.string().uuid().describe('Permission ID'),
        permission_code: z.string().describe('Permission code'),
        permission_name: z.string().describe('Permission name'),
        category: z.string().describe('Permission category'),
      })
    )
    .describe('Permissions assigned to role'),
});

export type RoleResponse = z.infer<typeof RoleResponseSchema>;

/**
 * Roles List Response Schema
 */
export const RolesListResponseSchema = z.object({
  success: z.literal(true).describe('Operation success flag'),
  data: z.array(RoleResponseSchema).describe('Array of roles with permissions'),
});

export type RolesListResponse = z.infer<typeof RolesListResponseSchema>;
