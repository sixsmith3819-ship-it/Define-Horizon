# User Management Module - Implementation Tasks

## Overview

This document outlines all implementation tasks for the User Management module of Define Horizon BMS. Tasks are organized into 11 phases, progressing from foundational database work through API development to frontend UI components. Each task is designed to be completed independently while building incrementally toward full feature parity with the design specification.

## Prerequisites

- Next.js 16.3.3 with TypeScript
- Supabase account with PostgreSQL database
- Environment variables configured (.env.local with SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
- Existing DH-BMS codebase with Customers, Transactions, Stock, Announcements modules
- Development database access with full permissions

---

## Phase 1: Database Infrastructure & Migrations

- [x] 1.1 Create database migration for user management core tables
  - Create `auth.users` integration via Supabase Auth (already managed by Supabase)
  - Create `public.roles` table with role definitions (super_admin, branch_manager, employee, auditor)
  - Create `public.profiles` table linking to auth.users with full_name, phone_number, role_id, branch_id, is_active
  - Create `public.branches` table with location, manager_id, staff_count
  - Add proper indexes on branch_id, role_id, is_active, email
  - Add foreign key constraints and cascade rules
  - **Validates: Requirements 12.1, 12.2, 14.1, 15.1**

- [x] 1.2 Create database migration for audit logging tables
  - Create `public.audit_logs` table with action_type, resource_type, resource_id, old_values, new_values, ip_address, created_at
  - Create `public.login_history` table with timestamp, user_id, ip_address, device_type, duration
  - Create `public.user_invitations` table with email, invited_by, token, expires_at, status
  - Create `public.saved_searches` table for user-saved filter combinations
  - Add indexes on created_at, user_id, action_type, resource_id
  - **Validates: Requirements 18.1, 18.2, 12.4**

- [x] 1.3 Implement Row-Level Security (RLS) policies for user data
  - Enable RLS on all user-related tables (profiles, roles, branches, login_history, audit_logs)
  - Create RLS policy: Super admins see all profiles
  - Create RLS policy: Branch managers see profiles in their branch only
  - Create RLS policy: Employees see only their own profile
  - Create RLS policy: Audit logs visible to Auditors only; others see own actions
  - Create RLS policy: Insert permissions for user creation by admins
  - Test RLS policies prevent unauthorized access
  - **Validates: Requirements 15.7, 14.6, 14.7**

- [ ] 1.4 Create database triggers for automatic audit logging
  - Create trigger on profiles for INSERT: auto-log user creation with new_values
  - Create trigger on profiles for UPDATE: auto-log changes with old_values and new_values
  - Create trigger on profiles for DELETE: auto-log deletion with old_values
  - Create trigger on audit_logs to prevent direct deletion (immutable audit log)
  - Create trigger on branches for INSERT/UPDATE: auto-log branch changes
  - Test triggers capture all changes automatically
  - **Validates: Requirements 18.1, 18.4, 18.6**

- [x] 1.5 Seed system roles and permissions in database
  - Insert Super Administrator role with all permissions
  - Insert Branch Manager role with branch-scoped permissions
  - Insert Employee/Agent role with limited permissions
  - Insert Auditor role with read-only permissions
  - Verify all roles created with correct permission sets
  - Document permission matrix for reference
  - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

---

## Phase 2: Core Authentication API Routes

- [ ] 2.1 Implement POST /api/auth/login endpoint
  - Validate email and password using Zod schema
  - Authenticate against Supabase Auth using signInWithPassword
  - Verify user profile exists and is_active = true
  - Reject login if user is inactive with appropriate error message
  - Log successful login to login_history with IP address and timestamp
  - Return JWT tokens and user profile data
  - Handle invalid credentials without disclosing whether email or password is wrong
  - **Validates: Requirements 17.2, 17.3, 17.4, 18.1**

- [ ] 2.2 Implement POST /api/auth/logout endpoint
  - Invalidate current session token via Supabase Auth
  - Log logout event to login_history
  - Clear authentication cookies
  - Return success response
  - **Validates: Requirements 17.5, 18.1**

- [ ] 2.3 Implement POST /api/auth/password-reset endpoint
  - Accept email address as input
  - Validate email exists in system
  - Generate secure reset token via Supabase Auth
  - Send password reset email with secure link
  - Log password reset request to audit_logs
  - Return success message (do not indicate if email exists)
  - **Validates: Requirements 17.7, 18.1**

- [ ] 2.4 Implement POST /api/auth/set-password endpoint
  - Accept reset token and new password
  - Validate password meets security standards (min 8 chars, uppercase, lowercase, number, special char)
  - Verify token is valid and not expired
  - Update password via Supabase Auth
  - Log password change to audit_logs
  - Mark user_invitations as accepted if from invitation flow
  - Return success and redirect to login
  - **Validates: Requirements 12.5, 17.8, 18.1**

- [ ] 2.5 Implement POST /api/auth/verify-session endpoint
  - Accept current session/JWT token
  - Validate token with Supabase Auth
  - Return user profile and role info if valid
  - Return 401 if token expired or invalid
  - Support token refresh using refresh_token
  - **Validates: Requirements 17.4, 17.5, 17.6**

---

## Phase 3: User Management CRUD API Routes

- [ ] 3.1 Implement GET /api/users endpoint (list users with pagination & filters)
  - Authenticate request and verify user permission
  - Support pagination with page, pageSize (25/50/100/250)
  - Support search by full_name and email (case-insensitive partial match)
  - Support filters: role, branch, status (active/inactive), date_created_range
  - Support sorting by: created_at, full_name, email
  - Apply branch context: non-admins see only their branch users
  - Return paginated response with total count
  - **Validates: Requirements 12.1, 15.2, 15.6**

- [ ] 3.2 Implement POST /api/users endpoint (create new user)
  - Verify requester is Super Administrator
  - Validate input: email unique, valid format, required fields
  - Generate unique temporary password (not stored, only for email)
  - Create auth.users entry via Supabase Auth with email and temporary password
  - Create profiles entry with full_name, phone_number, role_id, branch_id, is_active=false
  - Send invitation email with registration link and temporary password
  - Create user_invitations record with secure token
  - Log user creation to audit_logs
  - Return created user profile (without password)
  - **Validates: Requirements 12.2, 12.3, 12.4, 18.1**

- [ ] 3.3 Implement GET /api/users/:user_id endpoint (get user details)
  - Authenticate request
  - Verify permission to view requested user (self, admin, or branch manager of user's branch)
  - Return full user profile including role, branch, status, created_at
  - Include login_history summary (last 5 logins)
  - Include audit_log summary (last 10 actions)
  - Apply RLS policies to ensure data visibility
  - **Validates: Requirements 12.7, 18.3**

- [ ] 3.4 Implement PUT /api/users/:user_id endpoint (update user)
  - Authenticate request and verify permission (admin, branch manager, or self)
  - Validate input: email, phone_number, branch_id, role_id
  - Implement optimistic locking: check version_number to prevent concurrent updates
  - Update profiles table with validated data
  - Log changes to audit_logs with old_values and new_values
  - Return updated profile with new version_number
  - Handle conflict (version mismatch) with 409 response
  - **Validates: Requirements 12.7, 19.8**

- [ ] 3.5 Implement DELETE /api/users/:user_id endpoint (delete user account)
  - Verify requester is Super Administrator
  - Soft-delete: mark profiles.is_active = false, set deleted_at timestamp
  - Do NOT actually delete record (preserve audit trail)
  - Log deletion to audit_logs
  - Invalidate all active sessions for deleted user
  - Return success response
  - **Validates: Requirements 13.7**

- [ ] 3.6 Implement POST /api/users/:user_id/change-status endpoint
  - Verify permission (admin or branch manager of user's branch)
  - Accept status: active or inactive
  - Update profiles.is_active
  - If changing to inactive: invalidate all active sessions
  - If changing to active: clear any inactive flags
  - Log status change to audit_logs with reason
  - Return updated profile
  - **Validates: Requirements 13.2, 13.3, 13.5**

- [ ] 3.7 Implement POST /api/users/:user_id/reset-password endpoint (admin reset)
  - Verify requester is Super Administrator or Branch Manager
  - Generate new temporary password
  - Update password via Supabase Auth
  - Set force_password_change = true in profiles
  - Send password reset email to user
  - Log action to audit_logs
  - Return success message
  - **Validates: Requirements 12.6**

- [ ] 3.8 Implement POST /api/users/:user_id/force-password-change endpoint
  - Verify permission (admin only)
  - Set force_password_change = true in profiles
  - On user's next login, they must change password before accessing system
  - Log action to audit_logs
  - Return success response
  - **Validates: Requirements 12.6**

---

## Phase 4: Advanced User Management API Routes

- [ ] 4.1 Implement POST /api/users/bulk-actions endpoint
  - Verify requester is Super Administrator
  - Support bulk operations: assign_role, assign_branch, change_status, reset_password, export, delete
  - Accept array of user_ids and action parameters
  - Validate all users exist and are accessible
  - Execute action atomically for all users
  - Log each action individually to audit_logs
  - Support pagination and progress reporting
  - Return results with success/failure count
  - **Validates: Requirements 15.6**

- [ ] 4.2 Implement GET /api/users/export endpoint
  - Verify permission (admin or auditor)
  - Support format: CSV, Excel, PDF
  - Accept filters (applied by previous GET /api/users call)
  - For CSV: include headers, proper escaping, BOM for UTF-8 compatibility
  - For Excel: add formatting, multiple sheets for different user types
  - For PDF: add headers, footers, filters applied, summary section
  - Stream large exports (>100k rows) without loading all into memory
  - Log export action to audit_logs
  - Return file download with proper content-type and filename
  - **Validates: Requirements 11.3, 11.4, 11.5**

- [ ] 4.3 Implement GET /api/roles endpoint (list roles with permissions)
  - Return all roles with permission matrices
  - Include role_id, name, description, permissions array
  - Support filtering by role name
  - Return permission hierarchy and conflicts
  - **Validates: Requirements 14.1**

- [ ] 4.4 Implement PUT /api/roles/:role_id/permissions endpoint
  - Verify requester is Super Administrator
  - Update permissions for given role
  - Validate no permission conflicts
  - Log role permission changes to audit_logs
  - Invalidate cached role permissions
  - Apply new permissions to all users with that role immediately
  - **Validates: Requirements 14.1, 14.2**

- [ ] 4.5 Implement GET /api/activity/login-history/:user_id endpoint
  - Verify permission to view user (self, admin, or branch manager)
  - Return login history with pagination (default 90 days)
  - Include timestamp, duration, ip_address, device_type, success/failure status
  - Support filtering by date range and success/failure
  - Sort by timestamp descending (most recent first)
  - **Validates: Requirements 18.1, 18.2**

- [ ] 4.6 Implement GET /api/audit-log endpoint (list audit events)
  - Verify permission: Auditor sees all, others see only own actions
  - Support filtering: date_range, user, action_type, resource_type, resource_id
  - Support pagination with timestamp-based cursor for large datasets
  - Return action with before/after values for modifications
  - Include audit trail for deletes (preserved from when user was active)
  - **Validates: Requirements 18.3, 18.7**

- [ ] 4.7 Implement GET /api/dashboard/metrics endpoint (user management metrics)
  - Return core metrics: total_users, active_users, inactive_users, pending_invitations, new_this_month
  - Calculate trends: comparison to previous period with trend indicator
  - Apply branch context for branch managers
  - Cache results for 5 minutes
  - Load within 2 seconds for datasets up to 10,000 users
  - **Validates: Requirements 9.2, 9.3, 9.6**

---

## Phase 5: Activity & Directory API Routes

- [ ] 5.1 Implement GET /api/directory/search endpoint (user directory)
  - Accept search query (partial match on name, email)
  - Return limited results (name, email, role, branch, status)
  - Apply role-based visibility: show only users in same branch unless admin
  - Support debouncing (results updated only on final query after 300ms)
  - **Validates: Requirements 14.1**

- [ ] 5.2 Implement GET /api/directory/:user_id endpoint (user profile for directory)
  - Verify visibility permissions
  - Return user profile info: name, email, phone, branch, role, department
  - Hide sensitive info for non-admins
  - Include user's recent activity summary
  - **Validates: Requirements 14.1**

---

## Phase 6: Frontend - Dashboard & Layout

- [ ] 6.1 Create UserManagementLayout component
  - Responsive main layout with sidebar navigation
  - Navigation items: Users, Roles, Activity, Audit Log, Branches (admin only)
  - Include breadcrumb navigation
  - Include user menu (profile, logout) in top-right
  - Support mobile: collapse sidebar, show hamburger menu
  - Support tablet: sidebar always visible but narrow
  - Support desktop: full sidebar with icons and text
  - **Validates: Requirements 20.2, 20.3, 20.4, 20.5**

- [ ] 6.2 Create ActivityDashboard component
  - Display metric cards: total_users, active_users, inactive_users, pending_invitations, new_this_month
  - Show trend indicators (up/down/stable) with percentage change
  - Include pending invitations widget with list
  - Include recent deactivations list (last 5 with timestamps)
  - Include quick action buttons (Create User, Assign Role, etc.)
  - Show only metrics relevant to user's role
  - Load metrics with spinners while fetching
  - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 6.3 Create top-level dashboard page (/users)
  - Display ActivityDashboard component as main content
  - Show branch context indicator
  - Include quick filters (Active/Inactive toggle)
  - Link to detailed lists and reports
  - **Validates: Requirements 12.1, 9.2, 9.3**

---

## Phase 7: Frontend - User List & Search

- [ ] 7.1 Create UserList component with search and pagination
  - Display table with columns: Name, Email, Role, Branch, Status, Last Login, Actions
  - Implement real-time search (debounced 300ms) across full_name and email
  - Support pagination with page size selector (25/50/100/250)
  - Sort by any column (name, email, created_at, last_login)
  - Display loading state while fetching
  - Handle empty state
  - Include status badge (Active/Inactive) with color coding
  - Include action buttons: Edit, View, Deactivate/Activate, Delete
  - **Validates: Requirements 12.1, 15.2, 19.6**

- [ ] 7.2 Create UserSearch component (advanced filters)
  - Debounced search input with suggestions
  - Support filters by: role, branch, status, created_date_range
  - Include "Save Search" button to save current filter combination
  - Load previously saved searches
  - Apply/Clear buttons with keyboard shortcuts
  - Show applied filters as badges
  - Clear individual filters by clicking badge
  - **Validates: Requirements 12.1, 15.2**

- [ ] 7.3 Create FilterPanel component (collapsible)
  - Role multi-select dropdown
  - Branch dropdown (filter by user's branch if not admin)
  - Status toggle (Active/Inactive)
  - Date range picker (created_at)
  - Apply and Clear buttons
  - Show count of applied filters
  - Mobile-friendly: stacked on small screens
  - **Validates: Requirements 12.1, 15.2**

- [ ] 7.4 Create SavedSearches component
  - Display list of saved filter combinations
  - Each saved search shows: name, filter summary, last_used
  - Click to load saved search (apply filters and search)
  - Rename/delete buttons with confirmation dialogs
  - Max 10 saved searches per user
  - Show empty state if no saved searches
  - **Validates: Requirements 12.1**

- [ ] 7.5 Implement full UserList page (/users)
  - Integrate UserList, UserSearch, FilterPanel, SavedSearches components
  - Manage state: selected filters, search query, page, page_size, sort_by
  - Fetch users via GET /api/users with filters
  - Handle loading and error states
  - Show pagination info (X of Y results)
  - Responsive layout for all screen sizes
  - **Validates: Requirements 12.1, 15.2, 20.2, 20.3, 20.4**

---

## Phase 8: Frontend - User Form & Dialogs

- [ ] 8.1 Create UserForm component (create/edit mode)
  - Input fields: full_name (required), email (required, validated), phone_number (Zimbabwe format validation)
  - Role select dropdown (filter by super_admin for branch managers)
  - Branch cascading select (only branches user can assign to)
  - Department select (if available)
  - Status toggle (Active/Inactive)
  - Profile picture upload (optional, max 2MB)
  - Client-side validation using Zod schema
  - Optimistic lock handling: display version_number, compare before save
  - Edit mode: pre-fill all fields with current values
  - Show validation errors in real-time
  - Disable submit button until form valid
  - **Validates: Requirements 12.2, 12.7, 19.1, 19.2, 19.6**

- [ ] 8.2 Create CreateUserDialog component
  - Modal wrapper around UserForm in create mode
  - Title: "Create New User"
  - UserForm pre-filled with defaults (role: Employee, status: Active)
  - Confirm/Cancel buttons
  - On submit: call POST /api/users
  - Show success toast and close dialog
  - Show error toast if creation fails
  - **Validates: Requirements 12.2, 12.3, 12.4**

- [ ] 8.3 Create EditUserDialog component
  - Modal wrapper around UserForm in edit mode
  - Title: "Edit User"
  - Load user data via GET /api/users/:user_id
  - Pre-fill form with user data
  - On submit: call PUT /api/users/:user_id
  - Handle optimistic lock conflicts with error message
  - Show success toast and close dialog
  - **Validates: Requirements 12.7**

- [ ] 8.4 Create ConfirmDeleteDialog component
  - Modal for delete confirmation
  - Display user name and email
  - Require user to type "DELETE" to confirm (prevent accidental deletion)
  - Warning message about data retention
  - Delete and Cancel buttons
  - On confirm: call DELETE /api/users/:user_id
  - Show loading state during deletion
  - Close dialog and refresh list on success
  - **Validates: Requirements 13.7**

- [ ] 8.5 Create PasswordResetDialog component
  - Modal for requesting password reset
  - Display message: "Reset password link will be sent to user's email"
  - Confirm/Cancel buttons
  - On confirm: call POST /api/users/:user_id/reset-password
  - Show success message with confirmation
  - Close dialog after 2 seconds
  - **Validates: Requirements 12.6**

- [ ] 8.6 Create InvitationDialog component
  - Modal for resending invitation to pending user
  - Display user email and last_invitation_sent date
  - Message explaining new invitation will be sent
  - Resend/Cancel buttons
  - On confirm: call POST /api/users/:user_id/resend-invitation
  - Show success message
  - Close dialog after 2 seconds
  - **Validates: Requirements 12.4**

- [ ] 8.7 Implement full User Create page (/users/new)
  - Display CreateUserDialog as full-page form
  - Back button to return to user list
  - **Validates: Requirements 12.2, 12.3, 12.4**

---

## Phase 9: Frontend - User Profile & Details

- [ ] 9.1 Create UserProfile component with tabbed interface
  - Tab 1: Overview
    - Display: full_name, email, phone_number, role, branch, department, status
    - Show created_at, updated_at timestamps
    - Edit button (open EditUserDialog)
    - Deactivate/Activate button (toggle status)
  - Tab 2: Activity
    - Display recent login history
    - Show last login time and duration
    - Include IP address and device info
  - Tab 3: Audit
    - Display modification history for this user
    - Show who made changes, when, and what changed
  - Tab 4: Invitations (admin only)
    - Show invitation status if user not yet activated
    - Display resend invitation button
  - **Validates: Requirements 12.7, 18.1, 18.2**

- [ ] 9.2 Create LoginHistory component
  - Display table: Timestamp, Duration, Status, IP Address, Device Type
  - Pagination (25 entries default, 90 days default)
  - Date range filter
  - Toggle to show/hide failed login attempts
  - Sort by timestamp (most recent first)
  - Responsive table layout
  - **Validates: Requirements 18.1, 18.2**

- [ ] 9.3 Create AuditLog component (user-scoped)
  - Display table: Timestamp, Action, Field, Old Value, New Value, Admin/User
  - Filter by date range, action type
  - Show color-coded action types (CREATE=blue, UPDATE=orange, DELETE=red, LOGIN=green)
  - Display "Before/After" state for modifications
  - Pagination with load more
  - Empty state if no audit logs
  - **Validates: Requirements 18.2, 18.3, 18.4**

- [ ] 9.4 Implement User Detail page (/users/:user_id)
  - Display UserProfile component with all tabs
  - Back button to return to list
  - Responsive layout for all screen sizes
  - **Validates: Requirements 12.7, 18.1, 18.2**

---

## Phase 10: Frontend - Advanced Features & Polish

- [ ] 10.1 Create BulkActionsBar component
  - Display when users selected in UserList (checkbox column)
  - Show count of selected users
  - Dropdown menu with bulk actions: Assign Role, Assign Branch, Change Status, Reset Password, Export, Delete
  - Require confirmation before executing action
  - Show progress bar during bulk operation
  - Display results: X successful, Y failed
  - **Validates: Requirements 15.6**

- [ ] 10.2 Implement bulk role assignment
  - Add checkbox column to UserList
  - Checkbox header to select/deselect all
  - BulkActionsBar appears when selections > 0
  - Bulk role assignment: POST /api/users/bulk-actions with action: assign_role
  - Progress indication during operation
  - Toast notification on completion
  - **Validates: Requirements 15.6**

- [ ] 10.3 Implement bulk status change
  - Bulk status change via BulkActionsBar: POST /api/users/bulk-actions with action: change_status
  - Confirmation dialog showing selected count and new status
  - Progress indication
  - Toast notification on completion
  - **Validates: Requirements 15.6**

- [ ] 10.4 Implement bulk password reset
  - Bulk reset password via BulkActionsBar: POST /api/users/bulk-actions with action: reset_password
  - Send password reset emails to all selected users
  - Progress indication
  - Toast notification with count of emails sent
  - **Validates: Requirements 15.6**

- [ ] 10.5 Implement bulk export
  - Export selected users to CSV/PDF
  - Include export format selector (CSV, PDF)
  - Call GET /api/users/export with selected user IDs
  - Trigger file download
  - **Validates: Requirements 11.3, 11.4, 11.5, 15.6**

- [ ] 10.6 Create Directory component
  - Search/filter user directory
  - Display user list view: name, email, role, branch, status
  - Optional: org chart view showing reporting relationships
  - Role-based information visibility (hide sensitive info for non-admins)
  - Export directory to PDF/CSV
  - **Validates: Requirements 14.1**

- [ ] 10.7 Create RoleManager component (admin only)
  - Display all roles with permission matrix
  - Show role: name, description, permissions list
  - Edit button to update role permissions
  - Permission matrix display: rows=roles, columns=permissions
  - Checkboxes for permission assignment
  - Save changes: PUT /api/roles/:role_id/permissions
  - Toast notification on success
  - **Validates: Requirements 14.1, 14.2**

- [ ] 10.8 Create Branches management page (/admin/branches)
  - List all branches with: name, location, manager, staff_count
  - Create button to add new branch
  - Edit button for each branch
  - Delete button with confirmation
  - Show branch performance metrics summary
  - **Validates: Requirements 16.1, 16.2, 16.3**

- [ ] 10.9 Implement responsive design for mobile
  - Mobile breakpoint (<640px): stack all content vertically
  - Hamburger navigation menu
  - Collapse sidebar to icons-only
  - Single-column layouts for forms and tables
  - Large touch-friendly buttons (min 48px)
  - Font sizes optimized for mobile viewing
  - **Validates: Requirements 20.2, 20.3, 20.4, 20.5**

- [ ] 10.10 Implement responsive design for tablet
  - Tablet breakpoint (640px-1024px): collapsible sidebar
  - Two-column layouts where appropriate
  - Compact table display with horizontal scroll
  - Medium-sized buttons (44px)
  - **Validates: Requirements 20.3, 20.5**

- [ ] 10.11 Add form validation styling & UX
  - Real-time validation feedback (red outline for invalid fields)
  - Inline error messages below fields
  - Password strength indicator with visual meter
  - Show/hide password toggle
  - Confirm password field for new passwords
  - Clear success feedback after form submission
  - **Validates: Requirements 19.1, 19.2, 19.7**

- [ ] 10.12 Add toast notifications system
  - Toast for user creation success
  - Toast for user update success
  - Toast for user deletion success
  - Toast for role assignment success
  - Toast for bulk operations success/failure
  - Error toasts with clear messages
  - Warning toasts for confirmations
  - Auto-dismiss after 4 seconds or manual close
  - **Validates: Requirements 19.5**

- [ ] 10.13 Implement error boundaries and fallbacks
  - Global error boundary for UI crashes
  - Fallback UI: "Something went wrong, try again"
  - Error logging for debugging
  - Graceful degradation when API unavailable
  - Retry button for failed API calls
  - **Validates: Requirements 19.4, 19.5**

---

## Phase 11: Testing & Quality Assurance

- [ ] 11.1 Write unit tests for permission checking
  - Test Super Admin role has all permissions
  - Test Branch Manager role limited to own branch
  - Test Employee role cannot modify users
  - Test Auditor role read-only access
  - Test permission inheritance
  - **Validates: Requirements 14.6, 14.7, 15.4, 15.5**

- [ ] 11.2 Write unit tests for form validation
  - Test email format validation
  - Test phone number Zimbabwe format validation
  - Test password strength requirements
  - Test required fields validation
  - Test unique email constraint
  - **Validates: Requirements 19.1, 19.2, 19.3**

- [ ] 11.3 Write unit tests for password hashing & security
  - Test passwords hashed via Supabase Auth
  - Test plaintext passwords not stored
  - Test invalid credentials rejection
  - Test password reset token generation
  - Test reset token expiration
  - **Validates: Requirements 17.9, 17.8**

- [ ] 11.4 Write integration tests for user creation workflow
  - Test: Create user → Send invitation → Accept invitation → Set password → Login
  - Verify user created with correct role and branch
  - Verify invitation email sent
  - Verify password reset link works
  - Verify user can login after password set
  - **Validates: Requirements 12.2, 12.3, 12.4, 12.5, 17.2, 17.4**

- [ ] 11.5 Write integration tests for audit trail completeness
  - Test: Create user, verify audit log entry created
  - Test: Update user, verify audit log shows old and new values
  - Test: Login, verify login_history entry created
  - Test: Delete user, verify audit log shows deletion
  - Test: RLS policies prevent audit log tampering
  - **Validates: Requirements 18.1, 18.2, 18.4, 18.6**

- [ ] 11.6 Write integration tests for database RLS policies
  - Test: Branch Manager cannot see other branch users
  - Test: Employee cannot access admin functions
  - Test: Auditor can read all data but not modify
  - Test: Super Admin sees all data across branches
  - Test: Direct database access respects RLS policies
  - **Validates: Requirements 15.7, 14.6, 14.7**

- [ ] 11.7 Write property-based tests for data integrity
  - **Property: User creation round-trip**
  - **Validates: Requirements 12.2, 12.3**
  - For any valid user input, creating and then fetching should return equivalent user

- [ ] 11.8 Write property-based tests for permission consistency
  - **Property: Permission hierarchy consistency**
  - **Validates: Requirements 14.1, 14.2**
  - For any role, permission checks should be consistent across login, action attempts, and audit logs

- [ ] 11.9 Write property-based tests for audit log immutability
  - **Property: Audit log record integrity**
  - **Validates: Requirements 18.6**
  - For any audit log entry, attempting to modify or delete should fail

- [ ] 11.10 Write end-to-end tests for core user workflows
  - Test: Complete user provisioning flow (create → invite → register → login)
  - Test: User deactivation prevents login
  - Test: Password reset flow
  - Test: Bulk user operations
  - Test: Dashboard metrics accuracy
  - **Validates: Requirements 12.1-12.8, 13.1-13.7, 17.1-17.9**

- [ ] 11.11 Write performance tests for user list pagination
  - Test: Loading user list with 10k users loads in <500ms
  - Test: Search with 10k users returns results in <300ms
  - Test: Dashboard metrics load in <2 seconds
  - Test: Bulk operations handle 1000+ users without timeout
  - **Validates: Requirements 9.6, 20.2**

- [ ] 11.12 Create test coverage report
  - Target >80% code coverage for auth and permission logic
  - Document critical paths requiring manual testing
  - Identify edge cases not covered by automated tests
  - **Validates: Requirements 19.1-19.8**

- [ ] 11.13 Checkpoint - Ensure all unit and integration tests pass
  - Run full test suite
  - Verify test coverage meets threshold
  - Fix any failing tests
  - Document test execution results
  - **Validates: Requirements 19.1-19.8**

- [ ] 11.14 Write browser compatibility tests
  - Test on Chrome, Firefox, Safari, Edge (latest versions)
  - Test responsive layouts on actual devices
  - Verify form inputs work across browsers
  - Test keyboard navigation (Tab, Enter, Escape)
  - **Validates: Requirements 20.1, 20.2, 20.3, 20.4**

- [ ] 11.15 Verify accessibility compliance (WCAG 2.1 AA)
  - Test keyboard navigation throughout user management
  - Verify screen reader compatibility (NVDA, JAWS)
  - Check color contrast ratios (min 4.5:1 for text)
  - Verify all form labels properly associated
  - Test form error messages accessible
  - **Validates: Requirements 20.1, 20.2**

- [ ] 11.16 Final checkpoint - Ensure all tests pass & requirements met
  - Run full test suite
  - Verify all requirements have acceptance criteria met
  - Manual testing of all major workflows
  - Performance testing under load
  - **Validates: All Requirements**

---

## Task Dependency Graph

```
Wave 0: [1.1, 1.2]
Wave 1: [1.3, 1.4, 1.5]
Wave 2: [2.1, 2.2, 2.3, 2.4, 2.5]
Wave 3: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8]
Wave 4: [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7]
Wave 5: [5.1, 5.2]
Wave 6: [6.1, 6.2, 6.3]
Wave 7: [7.1, 7.2, 7.3, 7.4, 7.5]
Wave 8: [8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7]
Wave 9: [9.1, 9.2, 9.3, 9.4]
Wave 10: [10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13]
Wave 11: [11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11, 11.12, 11.13, 11.14, 11.15, 11.16]
```

---

## Estimated Effort

- **Waves 0-2** (Database & Security): 16-20 hours
- **Waves 3-5** (API Routes): 32-40 hours
- **Waves 6-10** (Frontend): 40-48 hours
- **Wave 11** (Testing & QA): 24-32 hours
- **Total Estimated Effort**: 120-150 hours (~3-4 weeks with 1 developer)

---

## Notes

- **Database-First Approach**: All database infrastructure (migrations, RLS, triggers) completed before API development
- **Incremental Feature Development**: Features build progressively: CRUD → Advanced Operations → Frontend
- **Testing Throughout**: Tests written as components complete, not as a final phase
- **Security by Design**: Authentication, RLS policies, audit logging integrated early
- **Responsive Design**: Mobile/tablet/desktop support integrated throughout frontend implementation
- **Branch Context**: All queries respect user's branch context after authentication
- **Audit Trail**: Every modification logged for compliance and debugging
- **Error Handling**: All API errors caught and user-friendly messages returned
- **Performance**: Pagination, caching, and indexes implemented for scalability
