# Technical Design Document: User Management Module

**Feature:** User Management for Define Horizon Business Management System  
**Version:** 1.0  
**Date:** 2026  
**Technology Stack:** Next.js 16.3.3, TypeScript, Supabase, Tailwind CSS v4  
**Status:** Design Phase

---

## Overview

The User Management module is a comprehensive system for provisioning, managing, and controlling user access within Define Horizon Business Management System. It extends the existing Supabase authentication foundation with role-based access control (RBAC), departmental organization, activity tracking, and complete audit trails.

### Key Objectives

- **User Lifecycle Management**: Complete provisioning, modification, and deactivation workflows
- **Role-Based Access Control**: Four-tier role system with permission-based authorization
- **Branch/Department Scoping**: Hierarchical data access control for multi-branch operations
- **Security & Compliance**: Bcrypt password hashing, audit logging, 7-year retention
- **User Activity Tracking**: Login history, session management, last activity timestamps
- **Operational Efficiency**: Bulk operations, search/filtering, saved searches, exports
- **Data Integrity**: Optimistic locking for concurrent updates, atomic bulk operations

### Design Principles

1. **Security First**: Passwords via Supabase Auth, bcrypt hashing, RLS at database level
2. **Auditability**: Every user management action logged with before/after state
3. **Scalability**: Efficient queries, pagination, background exports for large datasets
4. **Usability**: Responsive design, intuitive workflows, helpful error messages
5. **Consistency**: Optimistic locking, atomic transactions for bulk operations
6. **Multi-tenancy**: Branch-scoped access, department hierarchies, role-based visibility

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  (React Components, Forms, Dashboard, Directory)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Next.js Routes)                  │
│  /api/users/* (CRUD operations)                             │
│  /api/roles/* (Role management)                             │
│  /api/audit-log/* (Audit access)                            │
│  /api/activity/* (Activity tracking)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────────┐  ┌──────────┐
   │ Supabase│    │  RLS Policies │  │ Triggers │
   │  Auth   │    │  (Row-Level   │  │ (Audit   │
   │(Password)    │   Security)   │  │ Logging) │
   └─────────┘    └──────────────┘  └──────────┘
        │                │                │
        └────────────────┼────────────────┘
                         ▼
         ┌───────────────────────────────┐
         │   Supabase PostgreSQL         │
         │  (Database & RLS Enforcement) │
         └───────────────────────────────┘
```

### Key Layers

**Frontend Layer**

- React components for user management features
- Form validation and error handling
- Responsive UI (desktop, tablet, mobile)
- Real-time search and filtering
- Activity dashboard

**API Layer**

- RESTful endpoints for all operations
- Request validation and authentication
- Permission checks before database access
- Response formatting and error handling
- Service role key for sensitive operations

**Database Layer**

- PostgreSQL via Supabase
- Row-Level Security (RLS) policies
- Automatic audit logging via triggers
- Optimistic locking with version fields
- Foreign key constraints for data integrity

**Authentication Layer**

- Supabase Auth for password management
- JWT tokens for session management
- 30-minute inactivity timeout
- Failed login attempt throttling

---

## Components and Interfaces

### React Components Architecture

#### 1. **UserList** (Main Container Component)

```typescript
interface UserListProps {
  onUserSelect?: (user: User) => void;
  onBulkActionSelect?: (action: string, userIds: string[]) => void;
  refreshTrigger?: number;
}

// State Management
- selectedUserIds: Set<string> (for multi-select)
- currentPage: number
- pageSize: number (default: 25)
- sortBy: 'created' | 'name' | 'email'
- sortOrder: 'asc' | 'desc'
- activeFilters: FilterState
- searchQuery: string
- isLoading: boolean

// Key Methods
- handleSelectAll(): Select all visible users
- handleSelectUser(userId): Toggle single user selection
- handlePageChange(page): Navigate to page
- handleFilter(filters): Apply advanced filters
- handleBulkAction(action): Trigger bulk operation
- handleRefresh(): Reload user list
```

**Features:**

- Real-time search across full_name and email
- Multi-select with "Select All" for current view
- Filter by role, branch, department, status, date range
- Pagination with 25/50/100/250 per page options
- Sorting by created date, name, or email
- Bulk action dropdown when users selected (visible only when 1+ users selected)
- Save/load current search combination
- Context menu on user rows (Edit, Delete, View Details, Reset Password)

---

#### 2. **UserForm** (Create/Edit Component)

```typescript
interface UserFormProps {
  initialData?: User;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  onCancel?: () => void;
}

// State Management
- formData: UserFormData
- validationErrors: Record<string, string[]>
- passwordStrength: 'weak' | 'medium' | 'strong'
- showPassword: boolean
- emailCheckInProgress: boolean
- departmentOptions: Department[] (cascaded from branch)
- version_number: number (for optimistic locking in edit mode)

// Key Methods
- handleEmailChange(): Async validation for uniqueness
- handlePasswordChange(): Real-time strength calculation
- handleBranchChange(): Update department options
- handleValidate(): Validate all fields
- handleSubmit(): Submit form with version check
```

**Features:**

- Real-time email uniqueness validation (debounced)
- Phone number format validation (Zimbabwe patterns: +263, 0)
- Real-time password strength indicator (minimum 8 chars, mixed case, numbers, special chars)
- Password visibility toggle
- Branch → Department cascading selection (department list updates when branch changes)
- Profile picture upload with preview (max 5MB, auto-resize to 256x256px)
- Edit mode includes version_number for optimistic locking
- Form-level validation error messages
- Submit button disabled while validating or loading
- Cancel button to discard changes

---

#### 3. **UserProfile** (Detail View Component)

```typescript
interface UserProfileProps {
  userId: string;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onResetPassword?: () => void;
}

// State Management
- userDetails: User
- activeTab: 'overview' | 'activity' | 'audit'
- isLoading: boolean

// Key Methods
- loadUserDetails(): Fetch user with full details
- handleEdit(): Open edit modal
- handleDelete(): Show delete confirmation
- handleResetPassword(): Show password reset dialog
```

**Features:**

- Displays full user profile information
- Tabbed interface: Overview, Activity, Audit History
- Overview tab shows: personal info, role, branch, department, status, permissions
- Activity tab shows: login history, last activity timestamp, session info
- Audit tab shows: user modification history with before/after state
- Action buttons: Edit, Reset Password, Delete, Resend Invitation
- Status badge (Active/Inactive) with suspension reason if applicable
- Profile picture display with fallback

---

#### 4. **ActivityDashboard** (Metrics Dashboard)

```typescript
interface ActivityDashboardProps {
  refreshInterval?: number; // Auto-refresh in milliseconds
  onQuickAction?: (action: string) => void;
}

// State Management
- metrics: DashboardMetrics
- isLoading: boolean
- lastRefresh: Date
- trends: {
  active_vs_last_month: 'up' | 'down' | 'stable',
  new_users_trend: 'up' | 'down' | 'stable'
}

// Key Methods
- loadMetrics(): Fetch dashboard metrics
- handleQuickAction(action): Navigate or trigger action
- handleRefresh(): Manual refresh
```

**Data Displayed:**

- Total users count (clickable to filter list)
- Active users count
- Inactive users count
- Pending activation count
- New users this month
- Pending invitations (with Resend option)
- Users requiring password reset
- Recent deactivations list (last 5)
- Trend indicators (↑ ↓ → compared to previous month)
- Quick action buttons: Create User, Export All, View Audit Log

**Features:**

- Click any metric to filter the user list accordingly
- Auto-refresh metrics every 5 minutes
- Manual refresh button
- Trend analysis with visual indicators
- Recent deactivations list with date and reason

---

#### 5. **LoginHistory** (Activity Tab Component)

```typescript
interface LoginHistoryProps {
  userId: string;
  daysRange?: number; // Default 90, max 365
  pageSize?: number; // Default 50
}

// State Management
- sessions: LoginHistoryRecord[]
- currentPage: number
- pageSize: number
- isLoading: boolean
- showFailedAttempts: boolean
- totalCount: number

// Key Methods
- loadLoginHistory(): Fetch paginated login history
- toggleFailedAttempts(): Show/hide failed logins
- handlePageChange(page): Navigate pagination
```

**Features:**

- Paginated list of login events (50 per page default)
- Display: timestamp, session duration, IP address, device type, browser, location
- Failed login attempts shown separately (toggle visibility)
- Session status indicator (logged in / logged out / expired)
- Current session highlighted
- Session duration displayed in human-readable format (e.g., "8h 30m")
- Filter by date range (default: last 90 days, max 365 days)
- IP geolocation display if available

---

#### 6. **AuditLog** (Audit History Component)

```typescript
interface AuditLogProps {
  userId?: string; // If provided, filter to this user's changes
  actionType?: string; // If provided, filter to this action
  pageSize?: number; // Default 50, max 250
}

// State Management
- auditEntries: AuditLogEntry[]
- currentPage: number
- pageSize: number
- isLoading: boolean
- filters: AuditLogFilters
- expandedEntryId?: string

// Key Methods
- loadAuditLog(): Fetch paginated audit log
- handleFilter(filters): Apply filters
- handleExpand(entryId): Show detailed before/after state
- handlePageChange(page): Navigate pagination
```

**Features:**

- Paginated audit log viewer (50 per page)
- Filter by: action type, affected user, admin performer, date range
- Display: timestamp, action type, affected user, admin who performed it, description
- Expandable entries to view before/after state as formatted JSON
- Color-coded action types: create (green), modify (blue), delete (red), status-change (orange)
- IP address and session ID display
- Admin user linked to view their profile
- Affected user linked to view their profile
- Export audit log to CSV (up to 250 entries per export)

---

#### 7. **RoleManager** (Role Configuration Component)

```typescript
interface RoleManagerProps {
  onRoleUpdated?: () => void;
  readOnly?: boolean;
}

// State Management
- roles: Role[]
- selectedRole?: Role
- permissions: Permission[]
- selectedPermissions: UUID[]
- isLoading: boolean
- isSaving: boolean

// Key Methods
- loadRoles(): Fetch all roles with permissions
- loadPermissions(): Fetch all available permissions
- handleRoleSelect(roleId): Select role to edit
- handlePermissionToggle(permissionId): Toggle permission
- handleSave(): Save role-permission mapping
```

**Features:**

- Display all roles (Admin, Manager, Staff, Viewer)
- System roles cannot be deleted, can be modified
- Drag-and-drop permission assignment UI
- Permission categories (user_management, data_management, reports, settings, audit)
- Permission matrix view (roles vs permissions)
- Bulk permission assignment
- Audit trail of role changes

---

#### 8. **Directory** (Company Directory Component)

```typescript
interface DirectoryProps {
  searchQuery?: string;
  branchFilter?: UUID;
  departmentFilter?: UUID;
}

// State Management
- users: DirectoryUser[]
- isLoading: boolean
- viewMode: 'list' | 'org-chart'
- expandedDepartments: Set<string>

// Key Methods
- loadDirectory(): Fetch searchable directory
- handleSearch(query): Search by name/email (restricted by permissions)
- handleDepartmentExpand(deptId): Toggle department visibility
- handleViewModeChange(mode): Switch between list and org-chart
```

**Features:**

- Search user directory by name or email (permissions-based restrictions)
- Filter by branch and department
- Toggle between List view and Org Chart view
- Org Chart displays: manager → direct reports
- Click user to view profile (if permitted)
- Display: full name, role, department, branch, phone (if permitted)
- Manager relationships highlighted
- Inactive users shown with visual distinction

---

#### 9. **BulkActionsBar** (Toolbar Component)

```typescript
interface BulkActionsBarProps {
  selectedCount: number;
  selectedUserIds: string[];
  onActionSelect: (action: string, userIds: string[]) => void;
  onCancel: () => void;
}

// State Management
- isOpen: boolean
- selectedAction?: string
- isProcessing: boolean
- actionProgress: {
  completed: number,
  total: number,
  currentStatus: string
}

// Key Methods
- handleActionSelect(action): Trigger action
- handleCancel(): Close toolbar and deselect users
```

**Features:**

- Visible only when 1+ users selected
- Dropdown actions:
  - Assign Role
  - Assign Branch
  - Assign Department
  - Change Status (Active/Inactive)
  - Reset Password
  - Force Password Change
  - Export Selected
  - Delete Selected
- Confirmation dialog before action execution
- Progress indicator during bulk operation
- Rollback on error (all changes rolled back if any fail)

---

#### 10. **UserSearch** (Search Component)

```typescript
interface UserSearchProps {
  onSearch: (query: string) => void;
  onSavedSearchSelect: (search: SavedSearch) => void;
  debounceMs?: number; // Default 300ms
}

// State Management
- searchQuery: string
- suggestions: User[]
- recentSearches: SavedSearch[]
- isOpen: boolean

// Key Methods
- handleInput(query): Debounced search
- handleSuggestionSelect(user): Apply search
- handleSavedSearchSelect(search): Load saved search
- handleSaveCurrent(): Save current search
```

**Features:**

- Real-time search suggestions (debounced to 300ms)
- Display recent searches
- Save current search + filters for quick access
- Clear recent searches option
- Keyboard navigation (arrow keys, enter to select)

---

#### 11. **FilterPanel** (Advanced Filters Component)

```typescript
interface FilterPanelProps {
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  currentFilters?: FilterState;
}

// State Management
- role: UUID | null
- branch: UUID | null
- department: UUID | null
- status: 'Active' | 'Inactive' | 'All'
- dateRange: { from: Date, to: Date } | null
- customFilters: Record<string, any>

// Key Methods
- handleRoleChange(roleId): Update role filter
- handleBranchChange(branchId): Update branch filter
- handleDepartmentChange(deptId): Update department filter
- handleStatusChange(status): Update status filter
- handleDateRangeChange(range): Update date filter
- handleApply(): Apply all filters
- handleClear(): Clear all filters
```

**Features:**

- Filter by role (with autocomplete)
- Filter by branch (cascading select)
- Filter by department (cascading from branch)
- Filter by status (Active/Inactive/All)
- Filter by creation date range (date picker)
- Filter combinations saved as "Saved Searches"
- Clear all filters button
- Apply button triggers list refresh

---

#### 12. **SavedSearches** (Saved Filter Management)

```typescript
interface SavedSearchesProps {
  onSearchSelect: (search: SavedSearch) => void;
  onSearchDelete: (searchId: string) => void;
  onSearchUpdate: (searchId: string, name: string) => void;
}

// State Management
- savedSearches: SavedSearch[]
- isLoading: boolean
- editingId?: string

// Key Methods
- loadSavedSearches(): Fetch user's saved searches
- handleSelect(search): Apply saved search
- handleDelete(searchId): Remove saved search
- handleRename(searchId, name): Rename saved search
```

**Features:**

- Display list of user's saved searches
- Click to apply saved search and filter list
- Rename saved search
- Delete saved search
- Show search criteria preview on hover
- Most recently used searches displayed first
- Maximum 20 saved searches per user

---

### API Client Hooks

```typescript
// User Management Hooks
useGetUsers(page, pageSize, filters, sortBy, sortOrder);
useGetUser(userId);
useCreateUser(data);
useUpdateUser(userId, data, versionNumber);
useDeleteUser(userId);
useBulkUserAction(userIds, action, params);
useExportUsers(format, scope, filters);

// Activity & Audit Hooks
useGetLoginHistory(userId, daysRange);
useGetAuditLog(filters, page, pageSize);

// Role & Permission Hooks
useGetRoles();
useGetPermissions();
useUpdateRolePermissions(roleId, permissionIds);

// Dashboard Hooks
useGetDashboardMetrics(refreshInterval);
useGetDirectory(searchQuery, branchFilter);

// Utility Hooks
useUserCache(); // Client-side caching
useUserPermissions(); // Current user permissions
useBulkActionProgress(); // Track bulk operation progress
```

---

## Data Models

### Database Schema Overview

#### Core Tables

**users**

- Primary key: `user_id` (UUID)
- Foreign keys: `role_id`, `branch_id`, `department_id`, `created_by_admin_id`, `modified_by_admin_id`
- Indexes: email (unique), branch_id, department_id, role_id, status, date_created
- Purpose: User profiles and access control metadata

**roles**

- Primary key: `role_id` (UUID)
- Values: Admin, Manager, Staff, Viewer (system roles, immutable)
- Relationships: Many users → One role
- Purpose: Define role definitions and role hierarchy

**permissions**

- Primary key: `permission_id` (UUID)
- Unique field: `permission_code`
- Categories: user_management, data_management, reports, settings, audit
- Purpose: Define granular permission capabilities

**role_permissions**

- Primary key: `role_permission_id` (UUID)
- Foreign keys: `role_id`, `permission_id` (composite unique)
- Purpose: Map permissions to roles (many-to-many relationship)

**branches**

- Primary key: `branch_id` (UUID)
- Unique field: `branch_code`
- Foreign key: `manager_id`
- Purpose: Multi-branch organizational structure
- Relationships: One branch → Many users, Many departments

**departments**

- Primary key: `department_id` (UUID)
- Foreign key: `branch_id` (unique with department_name)
- Foreign key: `manager_id`
- Purpose: Department structure within branches
- Relationships: One branch → Many departments, One department → Many users

**login_history**

- Primary key: `login_history_id` (UUID)
- Foreign key: `user_id`
- Indexes: user_id, login_timestamp, session_id
- Purpose: Track all login/logout events and sessions
- Auto-delete: Entries older than 1 year via maintenance job

**audit_log**

- Primary key: `audit_log_id` (UUID)
- Foreign keys: `user_id_affected`, `admin_user_id`
- Indexes: timestamp, user_id_affected, action_type, admin_user_id
- Purpose: Complete audit trail of all user management actions
- Retention: 7 years (compliance requirement)
- Immutable: Entries cannot be modified after creation

**user_invitations**

- Primary key: `invitation_id` (UUID)
- Foreign key: `user_id`, `created_by_admin_id`
- Unique field: `invitation_token`
- Purpose: Track user invitations and acceptance
- Expiration: 7 days from creation
- Cascade delete: When user is deleted

**saved_searches**

- Primary key: `saved_search_id` (UUID)
- Foreign key: `user_id`
- Unique: (user_id, search_name)
- Purpose: Store user's saved filter combinations
- JSONB field: Stores search_criteria for quick restoration

---

### Table Relationships Diagram

```
users ──┬─→ roles (Many-to-One)
        ├─→ branches (Many-to-One)
        ├─→ departments (Many-to-One)
        ├─→ users (Self-reference: created_by_admin_id)
        ├─→ users (Self-reference: modified_by_admin_id)
        ├─→ users (Self-reference: manager_id in branches/departments)
        └─→ login_history (One-to-Many)
           └─→ audit_log (One-to-Many as user_id_affected)
           └─→ audit_log (One-to-Many as admin_user_id)
           └─→ user_invitations (One-to-Many)
           └─→ saved_searches (One-to-Many)

roles ──→ role_permissions ──→ permissions (Many-to-Many)

branches ──┬─→ departments (One-to-Many)
           ├─→ users (One-to-Many)
           └─→ users (manager_id reference)

departments ──┬─→ users (One-to-Many)
              └─→ users (manager_id reference)
```

---

### Data Integrity Constraints

```sql
-- Foreign Key Constraints
- users.role_id references roles (no cascade delete - prevent orphaned users)
- users.branch_id references branches (no cascade - prevent orphaned users)
- users.department_id references departments (cascade delete)
- users.created_by_admin_id references users (on delete set null)
- users.modified_by_admin_id references users (on delete set null)
- role_permissions.role_id references roles (cascade delete)
- role_permissions.permission_id references permissions (cascade delete)
- branches.manager_id references users (on delete set null)
- departments.manager_id references users (on delete set null)
- login_history.user_id references users (cascade delete)
- audit_log.user_id_affected references users (on delete set null)
- audit_log.admin_user_id references users (no cascade - preserve audit trail)
- user_invitations.user_id references users (cascade delete)
- user_invitations.created_by_admin_id references users (no cascade)
- saved_searches.user_id references users (cascade delete)

-- Check Constraints
- users.status IN ('Active', 'Inactive')
- login_history.login_status IN ('success', 'failed')
- user_invitations.status IN ('pending', 'accepted', 'expired')
- users.phone_number matches regex for Zimbabwe format

-- Unique Constraints
- users.email (globally unique)
- roles.role_name (unique)
- permissions.permission_code (unique)
- branches.branch_code (unique)
- departments (branch_id, department_name) composite unique
- role_permissions (role_id, permission_id) composite unique
- user_invitations.invitation_token (unique)
- saved_searches (user_id, search_name) composite unique
```

---

### Row-Level Security (RLS) Policies Summary

```sql
-- users table
- Admin users can access all users
- Manager users can access users in their branch only
- Staff can access own profile + team directory (limited info)
- Viewer role cannot access users table

-- audit_log table
- Admin users can access all audit logs
- Viewer role can access audit logs (read-only)
- Other roles denied access

-- login_history table
- Users can access own login history
- Admin users can access all login history
- Other roles denied access

-- All policies enforce permission checks via role_permissions table
```

---

### Performance Optimization

```sql
-- Composite Indexes for Common Query Patterns
CREATE INDEX idx_users_branch_status ON users(branch_id, status);
CREATE INDEX idx_users_role_status ON users(role_id, status);
CREATE INDEX idx_audit_log_user_date ON audit_log(user_id_affected, timestamp DESC);
CREATE INDEX idx_login_history_user_date ON login_history(user_id, login_timestamp DESC);
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id, last_used_at DESC);

-- Partial Indexes for Common Filters
CREATE INDEX idx_users_active ON users(user_id) WHERE status = 'Active';
CREATE INDEX idx_login_history_recent ON login_history(user_id) WHERE login_timestamp > now() - interval '90 days';
CREATE INDEX idx_departments_active ON departments(branch_id) WHERE is_active = true;
CREATE INDEX idx_branches_active ON branches(branch_id) WHERE is_active = true;
```

---

## Database Schema

### Core Tables

#### 1. `users` (User Profiles)

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  profile_picture_url TEXT,
  display_preferences JSONB DEFAULT '{}',

  -- Role and Access
  role_id UUID NOT NULL REFERENCES roles(role_id),
  branch_id UUID NOT NULL REFERENCES branches(branch_id),
  department_id UUID REFERENCES departments(department_id),

  -- Status Management
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  suspension_reason VARCHAR(255),
  suspension_date TIMESTAMP,
  suspension_notes TEXT,

  -- Password Management
  force_password_change BOOLEAN DEFAULT false,
  password_last_changed TIMESTAMP,
  password_history TEXT[], -- Array of bcrypt hashes (last 5)

  -- Tracking
  date_created TIMESTAMP DEFAULT now(),
  date_modified TIMESTAMP DEFAULT now(),
  created_by_admin_id UUID REFERENCES users(user_id),
  modified_by_admin_id UUID REFERENCES users(user_id),

  -- Optimistic Locking
  version_number INTEGER DEFAULT 1,

  -- Activity
  last_activity_timestamp TIMESTAMP,
  last_login_timestamp TIMESTAMP,
  login_count INTEGER DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_date_created ON users(date_created DESC);
```

#### 2. `roles` (Role Definitions)

```sql
CREATE TABLE roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT true, -- Cannot be deleted
  date_created TIMESTAMP DEFAULT now(),
  date_modified TIMESTAMP DEFAULT now()
);

INSERT INTO roles (role_name, description) VALUES
  ('Admin', 'System Administrator with full access'),
  ('Manager', 'Branch Manager with branch-scoped access'),
  ('Staff', 'Staff member with operational access'),
  ('Viewer', 'Read-only access for auditing');
```

#### 3. `permissions` (Permission Definitions)

```sql
CREATE TABLE permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code VARCHAR(50) UNIQUE NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'user_management', 'data_management', 'reports', 'settings', 'audit'
  date_created TIMESTAMP DEFAULT now()
);

INSERT INTO permissions (permission_code, permission_name, category) VALUES
  -- User Management
  ('create_user', 'Create User', 'user_management'),
  ('read_user', 'Read User', 'user_management'),
  ('update_user', 'Update User', 'user_management'),
  ('delete_user', 'Delete User', 'user_management'),
  ('manage_roles', 'Manage Roles', 'user_management'),
  ('manage_permissions', 'Manage Permissions', 'user_management'),
  ('view_audit_log', 'View Audit Log', 'user_management'),
  ('manage_branch_assignment', 'Manage Branch Assignment', 'user_management'),
  ('bulk_actions', 'Perform Bulk Actions', 'user_management'),
  ('export_users', 'Export Users', 'user_management'),
  ('view_activity_log', 'View Activity Log', 'user_management'),
  -- Data Management
  ('view_branch_data', 'View Branch Data', 'data_management'),
  ('view_subordinate_activity', 'View Subordinate Activity', 'data_management'),
  -- Reports
  ('export_reports', 'Export Reports', 'reports'),
  ('view_reports', 'View Reports', 'reports');
```

#### 4. `role_permissions` (Role-Permission Mapping)

```sql
CREATE TABLE role_permissions (
  role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  date_assigned TIMESTAMP DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
```

#### 5. `branches` (Branch/Location Data)

```sql
CREATE TABLE branches (
  branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_name VARCHAR(255) NOT NULL,
  branch_code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone_number VARCHAR(20),
  manager_id UUID REFERENCES users(user_id),
  is_active BOOLEAN DEFAULT true,
  date_created TIMESTAMP DEFAULT now(),
  date_modified TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_branches_is_active ON branches(is_active);
```

#### 6. `departments` (Department/Team Data)

```sql
CREATE TABLE departments (
  department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name VARCHAR(255) NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(branch_id),
  manager_id UUID REFERENCES users(user_id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  date_created TIMESTAMP DEFAULT now(),
  date_modified TIMESTAMP DEFAULT now(),
  UNIQUE(branch_id, department_name)
);

CREATE INDEX idx_departments_branch_id ON departments(branch_id);
CREATE INDEX idx_departments_is_active ON departments(is_active);
```

#### 7. `login_history` (Login and Session Tracking)

```sql
CREATE TABLE login_history (
  login_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  login_timestamp TIMESTAMP NOT NULL DEFAULT now(),
  logout_timestamp TIMESTAMP,
  ip_address INET,
  browser_user_agent TEXT,
  device_type VARCHAR(50), -- 'desktop', 'tablet', 'mobile'
  session_id VARCHAR(255) UNIQUE,
  login_status VARCHAR(20) DEFAULT 'success' CHECK (login_status IN ('success', 'failed')),
  failure_reason VARCHAR(255), -- 'invalid_credentials', 'account_inactive', etc.
  session_duration_seconds INTEGER,
  location VARCHAR(255) -- If geolocation available
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_timestamp ON login_history(login_timestamp DESC);
CREATE INDEX idx_login_history_session_id ON login_history(session_id);
```

#### 8. `audit_log` (Comprehensive Audit Trail)

```sql
CREATE TABLE audit_log (
  audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  user_id_affected UUID REFERENCES users(user_id),
  admin_user_id UUID NOT NULL REFERENCES users(user_id),
  timestamp TIMESTAMP NOT NULL DEFAULT now(),
  before_state JSONB, -- Previous values
  after_state JSONB,  -- New values
  description TEXT,
  ip_address INET,
  session_id VARCHAR(255)
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_user_id_affected ON audit_log(user_id_affected);
CREATE INDEX idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX idx_audit_log_admin_user_id ON audit_log(admin_user_id);
```

#### 9. `user_invitations` (Invitation Tracking)

```sql
CREATE TABLE user_invitations (
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL, -- 7 days from creation
  accepted_at TIMESTAMP,
  created_by_admin_id UUID NOT NULL REFERENCES users(user_id)
);

CREATE INDEX idx_user_invitations_user_id ON user_invitations(user_id);
CREATE INDEX idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);
```

#### 10. `saved_searches` (User-Saved Filter Combinations)

```sql
CREATE TABLE saved_searches (
  saved_search_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  search_name VARCHAR(255) NOT NULL,
  search_criteria JSONB NOT NULL, -- {searchText: "", filters: {...}}
  created_at TIMESTAMP DEFAULT now(),
  last_used_at TIMESTAMP,
  UNIQUE(user_id, search_name)
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can access all users
CREATE POLICY admin_access_all_users ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN users u ON u.role_id = rp.role_id
      WHERE u.user_id = auth.uid()
      AND rp.permission_id = (SELECT permission_id FROM permissions WHERE permission_code = 'read_user')
      AND EXISTS (SELECT 1 FROM users u2 WHERE u2.user_id = auth.uid() AND u2.role_id = (SELECT role_id FROM roles WHERE role_name = 'Admin'))
    )
  );

-- Policy: Manager can access users in their branch
CREATE POLICY manager_access_branch_users ON users
  FOR SELECT USING (
    branch_id = (SELECT branch_id FROM users WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Manager'))
  );

-- Policy: Staff can access own profile
CREATE POLICY staff_access_own_profile ON users
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Admin can access all audit logs
CREATE POLICY admin_access_audit_log ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Admin')
    )
  );

-- Policy: Viewer can access audit logs
CREATE POLICY viewer_access_audit_log ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Viewer')
    )
  );

-- Policy: Users can only access own login history
CREATE POLICY users_access_own_login_history ON login_history
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Admin can access all login history
CREATE POLICY admin_access_all_login_history ON login_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Admin')
    )
  );
```

---

## API Route Specifications

### Authentication & Session Endpoints

#### `POST /api/auth/login`

**Purpose:** Authenticate user and create session  
**Access:** Public  
**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "session": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "Manager",
      "branch_id": "uuid",
      "permissions": ["read_user", "update_user", ...]
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### `POST /api/auth/logout`

**Purpose:** Terminate user session  
**Access:** Authenticated  
**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `POST /api/auth/password-reset`

**Purpose:** Request password reset  
**Access:** Public  
**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### `POST /api/auth/set-password`

**Purpose:** Set password from invitation link  
**Access:** Public (with valid token)  
**Request:**

```json
{
  "invitation_token": "token",
  "password": "NewSecure123!",
  "password_confirmation": "NewSecure123!"
}
```

---

### User Management Endpoints

#### `GET /api/users`

**Purpose:** List users with filtering and pagination  
**Access:** Requires `read_user` permission  
**Query Parameters:**

- `page`: Integer (default: 1)
- `page_size`: Integer (default: 25, max: 250)
- `search`: String (searches full_name, email)
- `role`: UUID (filter by role)
- `branch_id`: UUID (filter by branch)
- `department_id`: UUID (filter by department)
- `status`: String ('Active', 'Inactive', or 'All')
- `created_from`: ISO date
- `created_to`: ISO date
- `sort_by`: String ('created', 'name', 'email')
- `sort_order`: String ('asc', 'desc')

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "Manager",
      "branch": "Harare",
      "department": "Sales",
      "status": "Active",
      "last_activity_timestamp": "2026-01-15T10:30:00Z",
      "date_created": "2025-06-01T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total_count": 142,
    "total_pages": 6
  }
}
```

#### `POST /api/users`

**Purpose:** Create new user with invitation  
**Access:** Requires `create_user` permission  
**Request:**

```json
{
  "email": "newuser@example.com",
  "full_name": "Jane Smith",
  "phone_number": "+263714123456",
  "role_id": "uuid",
  "branch_id": "uuid",
  "department_id": "uuid",
  "status": "Active"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "newuser@example.com",
    "invitation_sent": true,
    "invitation_expires_at": "2026-01-22T12:00:00Z"
  }
}
```

#### `GET /api/users/:user_id`

**Purpose:** Get detailed user profile  
**Access:** Requires `read_user` permission  
**Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+263714123456",
    "profile_picture_url": "https://...",
    "role": "Manager",
    "branch": "Harare",
    "department": "Sales",
    "status": "Active",
    "last_activity_timestamp": "2026-01-15T14:22:00Z",
    "last_login_timestamp": "2026-01-15T09:00:00Z",
    "login_count": 127,
    "date_created": "2025-06-01T08:00:00Z",
    "force_password_change": false,
    "permissions": ["read_user", "update_user"]
  }
}
```

#### `PUT /api/users/:user_id`

**Purpose:** Update user profile  
**Access:** Requires `update_user` permission  
**Request:**

```json
{
  "full_name": "John Updated",
  "phone_number": "+263714999999",
  "role_id": "uuid",
  "branch_id": "uuid",
  "department_id": "uuid",
  "status": "Inactive",
  "suspension_reason": "On Leave",
  "version_number": 5
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "version_number": 6
  }
}
```

**Error Response (409):** Conflict - version mismatch

```json
{
  "success": false,
  "error": "User record was modified by another admin. Please refresh and try again.",
  "current_version": 7,
  "your_version": 5
}
```

#### `DELETE /api/users/:user_id`

**Purpose:** Permanently delete user account  
**Access:** Requires `delete_user` permission  
**Query Parameters:**

- `confirm_email`: String (must match user's email)

**Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### `POST /api/users/:user_id/change-status`

**Purpose:** Change user status (Active/Inactive)  
**Access:** Requires `update_user` permission  
**Request:**

```json
{
  "status": "Inactive",
  "suspension_reason": "On Leave",
  "suspension_notes": "User will return on January 30"
}
```

#### `POST /api/users/:user_id/reset-password`

**Purpose:** Admin-initiated password reset  
**Access:** Requires `manage_roles` permission  
**Request:** (empty body)  
**Response:** Password reset email sent to user

#### `POST /api/users/:user_id/force-password-change`

**Purpose:** Force user to change password on next login  
**Access:** Requires `manage_roles` permission  
**Request:**

```json
{
  "force_change": true
}
```

#### `POST /api/users/bulk-actions`

**Purpose:** Perform bulk operations on multiple users  
**Access:** Requires `bulk_actions` permission  
**Request:**

```json
{
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "action": "assign_role",
  "action_params": {
    "role_id": "uuid"
  }
}
```

**Supported Actions:**

- `assign_role` - Assign role to selected users
- `assign_branch` - Assign branch to selected users
- `assign_department` - Assign department to selected users
- `change_status` - Change status (Active/Inactive)
- `reset_password` - Reset password for all selected
- `force_password_change` - Force password change
- `export_selected` - Export selected users to CSV
- `delete_selected` - Bulk delete users

#### `GET /api/users/export`

**Purpose:** Export user list  
**Access:** Requires `export_users` permission  
**Query Parameters:**

- `format`: 'csv' | 'xlsx' | 'pdf' (default: 'csv')
- `scope`: 'all' | 'filtered' | 'selected'
- `filters`: JSON (same as list endpoint)
- `user_ids`: Array of UUIDs (for 'selected' scope)

**Response (200):** File download

---

### Activity & Audit Endpoints

#### `GET /api/activity/login-history/:user_id`

**Purpose:** Get user's login history  
**Access:** Requires `view_activity_log` permission  
**Query Parameters:**

- `days`: Integer (default: 90, max: 365)
- `page`: Integer (default: 1)
- `page_size`: Integer (default: 50)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "login_history_id": "uuid",
      "login_timestamp": "2026-01-15T09:00:00Z",
      "logout_timestamp": "2026-01-15T17:30:00Z",
      "session_duration_seconds": 30600,
      "ip_address": "192.168.1.1",
      "device_type": "desktop",
      "browser_user_agent": "Mozilla/5.0..."
    }
  ],
  "pagination": { ... }
}
```

#### `GET /api/audit-log`

**Purpose:** Access audit log with filtering  
**Access:** Requires `view_audit_log` permission  
**Query Parameters:**

- `page`: Integer (default: 1)
- `page_size`: Integer (default: 50, max: 250)
- `action_type`: String or Array (filter by action type)
- `user_affected`: UUID (filter by affected user)
- `admin_performer`: UUID (filter by admin who performed action)
- `date_from`: ISO date
- `date_to`: ISO date

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "audit_log_id": "uuid",
      "action_type": "user_created",
      "user_id_affected": "uuid",
      "admin_user_id": "uuid",
      "timestamp": "2026-01-15T10:30:00Z",
      "description": "User John Doe created with role Manager",
      "before_state": null,
      "after_state": {
        "email": "john@example.com",
        "role": "Manager",
        "branch": "Harare"
      }
    }
  ],
  "pagination": { ... }
}
```

---

### Dashboard & Directory Endpoints

#### `GET /api/dashboard/metrics`

**Purpose:** Get user management dashboard metrics  
**Access:** Requires `read_user` permission  
**Response (200):**

```json
{
  "success": true,
  "data": {
    "total_users": 245,
    "active_users": 238,
    "inactive_users": 7,
    "pending_activation": 3,
    "new_users_this_month": 12,
    "pending_invitations": 2,
    "users_expiring_soon": 0,
    "recent_deactivations": [
      {
        "user_id": "uuid",
        "full_name": "Jane Doe",
        "deactivated_at": "2026-01-14T16:00:00Z",
        "reason": "On Leave"
      }
    ],
    "trends": {
      "active_vs_last_month": "up",
      "new_users_trend": "stable"
    }
  }
}
```

#### `GET /api/directory/search`

**Purpose:** Search user directory  
**Access:** Authenticated users  
**Query Parameters:**

- `q`: String (search by name or email, if permissions allow)
- `branch_id`: UUID (optional)
- `department_id`: UUID (optional)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "full_name": "John Doe",
      "role": "Manager",
      "department": "Sales",
      "branch": "Harare",
      "phone_number": "+263714123456",
      "profile_picture_url": "https://..."
    }
  ]
}
```

#### `GET /api/directory/:user_id`

**Purpose:** Get user profile for directory viewing  
**Access:** Authenticated users  
**Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "full_name": "John Doe",
    "role": "Manager",
    "department": "Sales",
    "branch": "Harare",
    "phone_number": "+263714123456",
    "profile_picture_url": "https://...",
    "start_date": "2024-06-01",
    "email_address": "john@example.com" // Only if viewer has permission
  }
}
```

---

### Role & Permission Endpoints

#### `GET /api/roles`

**Purpose:** List all roles with permissions  
**Access:** Requires `manage_roles` permission  
**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "role_id": "uuid",
      "role_name": "Admin",
      "description": "System Administrator",
      "permissions": [
        {
          "permission_id": "uuid",
          "permission_code": "create_user",
          "permission_name": "Create User"
        }
      ]
    }
  ]
}
```

#### `PUT /api/roles/:role_id/permissions`

**Purpose:** Update role permissions  
**Access:** Requires `manage_permissions` permission  
**Request:**

```json
{
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## React Component Architecture

### Directory Structure

```
components/
├── user-management/
│   ├── UserList.tsx           # Main user list with search/filters
│   ├── UserCard.tsx           # User summary card
│   ├── UserDetailModal.tsx    # Detailed user profile view
│   ├── UserForm.tsx           # Create/edit user form
│   ├── BulkActionsBar.tsx     # Bulk actions toolbar
│   ├── UserSearch.tsx         # Search bar component
│   ├── FilterPanel.tsx        # Advanced filters
│   ├── SavedSearches.tsx      # Saved search management
│   ├── ActivityDashboard.tsx  # Dashboard with metrics
│   ├── LoginHistory.tsx       # User login history view
│   ├── AuditLog.tsx           # Comprehensive audit log viewer
│   └── Directory.tsx          # Company directory/org view
├── forms/
│   ├── UserFormSchema.ts      # Zod validation schema
│   └── PasswordForm.tsx       # Password management form
├── dialogs/
│   ├── CreateUserDialog.tsx   # Dialog for user creation
│   ├── EditUserDialog.tsx     # Dialog for user editing
│   ├── ConfirmDeleteDialog.tsx # Delete confirmation
│   ├── BulkActionDialog.tsx   # Bulk action confirmation
│   ├── PasswordResetDialog.tsx# Password reset dialog
│   └── InvitationDialog.tsx   # Resend invitation dialog
└── layout/
    ├── UserManagementLayout.tsx # Main layout with sidebar
    └── DashboardLayout.tsx     # Dashboard-specific layout
```

### Component Hierarchy

```
UserManagementModule
├── ActivityDashboard (Top-level metrics)
├── UserList (Main list view)
│   ├── UserSearch (Search bar)
│   ├── FilterPanel (Advanced filters)
│   ├── SavedSearches (Quick access to saved filters)
│   ├── BulkActionsBar (Toolbar when items selected)
│   └── UserTable
│       ├── UserRow (Individual user)
│       └── Checkbox (Selection)
├── UserDetailModal (Detailed view)
│   ├── UserProfile
│   ├── ActivityTab
│   │   ├── LoginHistory
│   │   └── LastActivityTimestamp
│   └── OptionsMenu (Edit, Delete, Reset Password)
├── CreateUserDialog
│   └── UserForm
├── EditUserDialog
│   └── UserForm
├── Directory
│   ├── OrgChart
│   └── DirectorySearch
└── AuditLog
    ├── LogTable
    └── LogFilters
```

### Key Components - Detailed View

#### UserList Component

```typescript
interface UserListProps {
  onUserSelect?: (user: User) => void;
  onBulkActionSelect?: (action: string, userIds: string[]) => void;
}

// Features:
// - Search across full_name and email in real-time
// - Multi-select with "Select All" for current view
// - Filter by role, branch, department, status, date range
// - Pagination (25/50/100/250 per page)
// - Sort by created date, name, or email
// - Bulk action dropdown when users selected
// - Save current search combination
```

#### UserForm Component

```typescript
interface UserFormProps {
  initialData?: User;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  isLoading?: boolean;
}

// Features:
// - Real-time email uniqueness validation
// - Phone number format validation (Zimbabwe patterns)
// - Real-time password strength indicator
// - Branch → Department cascading selection
// - Profile picture upload (256x256px resize)
// - Edit mode tracks version_number for optimistic locking
```

#### ActivityDashboard Component

```typescript
interface ActivityDashboardProps {
  refreshInterval?: number; // Auto-refresh metrics
}

// Features:
// - Total users, active, inactive, pending activation, new this month
// - Trend indicators (↑ ↓ → compared to previous month)
// - Pending invitations widget with resend option
// - Recent deactivations list
// - Quick action buttons (Create User, Export, View Audit Log)
// - Click metrics to filter user list
```

#### LoginHistory Component

```typescript
interface LoginHistoryProps {
  userId: string;
  daysRange?: number; // Default 90, max 365
}

// Features:
// - Paginated list of login events (last 90 days default)
// - Display: timestamp, duration, IP, device type, location
// - Toggle failed attempts visibility
// - Session status (logged in / logged out)
```

---

## User Flows

### 1. New User Invitation and Onboarding

```
Admin creates user
    ↓
System generates User record + Supabase Auth user
    ↓
Invitation email sent (link + temporary password)
    ↓
User clicks link → Validates token + expiration
    ↓
User sets password (real-time validation)
    ↓
Password hashed via Supabase + flagged as "temporary"
    ↓
User redirected to login
    ↓
User logs in → Forced to set new password (first login only)
    ↓
User given full system access
```

### 2. User Update with Optimistic Locking

```
Admin opens user profile (loads version_number = 5)
    ↓
Admin B opens same user (loads version_number = 5)
    ↓
Admin A modifies role and submits (increments to version = 6)
    ↓
Admin B modifies branch and submits with version = 5
    ↓
Server detects version mismatch
    ↓
Error returned: "Record modified, current version is 6"
    ↓
Admin B refreshes → Gets latest data (version 6)
    ↓
Admin B reapplies branch change and submits (version 6)
    ↓
Update succeeds (increments to version 7)
```

### 3. Bulk Status Change

```
Admin selects 15 users
    ↓
Clicks "Change Status" → Deactivate
    ↓
Confirmation dialog shows:
  - 15 users affected
  - Current roles/branches
  - Requires typed confirmation
    ↓
Admin confirms
    ↓
Transaction starts (atomic):
  - Update each user: status = Inactive
  - Terminate active sessions for each
  - Create individual audit log entries
  - Send notification emails
    ↓
If any update fails: Rollback all changes
    ↓
Display summary: "14 users deactivated, 1 failed (duplicate email)"
```

### 4. Password Reset

```
Admin initiates password reset
    ↓
System generates reset token (24-hour expiration)
    ↓
Reset email sent with link
    ↓
User clicks link → Validates token + expiration
    ↓
User enters new password (real-time validation)
    ↓
Password submitted → Hashed via Supabase
    ↓
All user's existing sessions invalidated
    ↓
User logs in with new password
```

---

## Security & Authorization Model

### Permission-Based Access Control

```
Role (Admin, Manager, Staff, Viewer)
    ↓
role_permissions table (role → permissions mapping)
    ↓
Permissions (create_user, read_user, etc.)
    ↓
API checks permission before operation
    ↓
RLS policies enforce at database level
```

### Permission Assignment by Role

| Permission     | Admin | Manager | Staff | Viewer |
| -------------- | ----- | ------- | ----- | ------ |
| create_user    | ✓     | ✓*      | ✗     | ✗      |
| read_user      | ✓     | ✓*      | ✓**   | ✓      |
| update_user    | ✓     | ✓*      | ✓**   | ✗      |
| delete_user    | ✓     | ✗       | ✗     | ✗      |
| manage_roles   | ✓     | ✗       | ✗     | ✗      |
| view_audit_log | ✓     | ✗       | ✗     | ✓      |
| bulk_actions   | ✓     | ✗       | ✗     | ✗      |
| export_users   | ✓     | ✓*      | ✗     | ✓      |

*Branch-scoped (Manager can only act on their branch's users)
**Self only or directory with restrictions (Staff can view directory, edit own profile)

### Branch-Scoped Access

```
User assigned to Branch A
    ↓
RLS policy checks: user_branch = request_user_branch
    ↓
Only users in Branch A returned
    ↓
API layer additionally checks canAccessBranch()
    ↓
Email addresses hidden from Staff (revealed to Admin/Manager)
```

### Sensitive Operation Confirmation

Admins must provide own password confirmation for:

- Resetting another user's password
- Deleting a user account
- Revoking a user's role

---

## Performance Considerations

### Database Optimization

- **Indexes**: Created on all filtered columns (email, branch_id, status, date_created)
- **Pagination**: Always paginate large result sets (max 250 per page)
- **Lazy Loading**: Login history, audit logs loaded on demand
- **Archival**: Audit logs moved to archive after 7 years
- **Query Optimization**: Use indexed columns in WHERE clauses

### API Optimization

- **Caching**: Dashboard metrics cached for 5 minutes
- **Background Jobs**: Large exports processed asynchronously
- **Connection Pooling**: Supabase manages connection pool
- **Compression**: Response compression via Next.js middleware

### Frontend Optimization

- **Code Splitting**: Lazy load user management module
- **Memoization**: useMemo for computed properties
- **Debouncing**: Search input debounced to 300ms
- **Virtual Scrolling**: Long lists (1000+ items) use virtual scroll
- **Image Optimization**: Profile pictures optimized via Next.js Image component

### Load Testing Thresholds

- Dashboard metrics render within 2 seconds (up to 10,000 users)
- User list pagination handles 250+ records per page
- Bulk operations on 1,000+ users complete within 30 seconds
- Search results return within 500ms
- Concurrent login sessions: 100+ simultaneous

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: User Authentication Enforcement

**For all** user management operations, authentication via Supabase Auth SHALL be required before accessing any endpoint or data.

**Validation Approach:**

- Verify JWT token present and valid on every API request
- Test unauthenticated requests receive 401 Unauthorized
- Test expired tokens receive 401 Unauthorized
- Test token refresh works correctly
- Session initialization captures user permissions at login

**Scope:** All API endpoints under `/api/users/*`, `/api/roles/*`, `/api/audit-log/*`, `/api/activity/*`

---

### Property 2: User Status Change Session Invalidation

**For all** user status changes from Active to Inactive, all existing sessions for that user SHALL be invalidated within 3 seconds of the status change.

**Validation Approach:**

- Create user with active sessions
- Change status to Inactive
- Verify all sessions terminate within 3-second window
- Verify subsequent requests with old tokens receive 401 Unauthorized
- Verify user cannot establish new sessions while Inactive

**Scope:** POST `/api/users/:user_id/change-status`, role-based access changes

---

### Property 3: Audit Log Immutability

**For all** entries created in the audit_log table, no audit log entry SHALL be modifiable or deletable after creation.

**Validation Approach:**

- Create audit log entry
- Attempt UPDATE on audit_log entry (must fail with permission denied)
- Attempt DELETE on audit_log entry (must fail with permission denied)
- Verify RLS policy enforces immutability
- Verify only INSERT operations allowed

**Scope:** audit_log table, all modification attempts

---

### Property 4: Branch-Scoped Access Enforcement

**For all** users assigned to a branch, those users SHALL not be able to access, modify, or view data for users in different branches.

**Validation Approach:**

- Create Manager user in Branch A
- Create Manager user in Branch B
- Manager A attempts to read/modify users in Branch B (must fail)
- Manager A can read/modify users in Branch A (must succeed)
- Verify RLS policy blocks cross-branch access at database level

**Scope:** Manager role access control, RLS policies on users table

---

### Property 5: Password Change Session Invalidation

**For all** password changes, all existing sessions for that user SHALL be invalidated immediately after password is changed.

**Validation Approach:**

- User established with active sessions
- User changes password (or admin resets password)
- All previous sessions immediately terminated
- Subsequent requests with old tokens receive 401 Unauthorized
- User must re-authenticate with new password
- Session invalidation logged in audit trail

**Scope:** POST `/api/auth/set-password`, POST `/api/users/:user_id/reset-password`

---

### Property 6: Permission-Based Access Control

**For all** user management operations, only users with appropriate permissions SHALL be able to perform that operation.

**Validation Approach:**

- Staff user (no permissions) attempts create_user (must fail with 403)
- Manager user (with permission) attempts create_user (must succeed)
- Admin user (with all permissions) can perform any operation
- Viewer user can only read audit logs and view_activity_log
- Permission checks enforce both at API layer and database RLS level

**Scope:** All API endpoints, role_permissions mapping, RLS policies

---

### Property 7: Optimistic Locking Conflict Prevention

**For all** concurrent user updates, if two admins attempt simultaneous modifications, the second update SHALL fail with a version conflict error without corrupting data.

**Validation Approach:**

- Load user with version_number = 5
- Two concurrent requests both attempt update with version = 5
- First request succeeds (increments to version = 6)
- Second request fails with 409 Conflict error
- Second request receives current version (6)
- User data remains consistent (no partial updates)

**Scope:** PUT `/api/users/:user_id`, version_number conflict detection

---

### Property 8: Audit Trail Completeness

**For all** user management operations (create, update, delete, status change, role change), a corresponding audit log entry SHALL be created with complete before/after state.

**Validation Approach:**

- Create user → audit_log entry with action_type='user_created', after_state populated
- Update user role → audit_log entry with action_type='user_updated', before_state and after_state populated
- Delete user → audit_log entry with action_type='user_deleted'
- Bulk operations → Individual audit_log entries for each affected user
- Verify action_type, user_id_affected, admin_user_id, timestamp all correct

**Scope:** POST `/api/users`, PUT `/api/users/:user_id`, DELETE `/api/users/:user_id`, POST `/api/users/:user_id/change-status`

---

### Property 9: Bulk Operation Atomicity

**For all** bulk operations affecting multiple users, either all operations succeed and are logged, or all are rolled back without partial updates.

**Validation Approach:**

- Bulk assign role to 15 users
- Database transaction starts
- 14 updates succeed, 1 fails (e.g., invalid role_id)
- All 14 updates rolled back
- No partial state changes
- Audit log has no entries for this bulk operation (all-or-nothing)
- Response indicates which user(s) failed

**Scope:** POST `/api/users/bulk-actions`, atomic transaction handling

---

### Property 10: Login History Accuracy

**For all** login events, the system SHALL record accurate login timestamp, logout timestamp, session duration, IP address, and device type.

**Validation Approach:**

- User logs in → login_history entry created with current timestamp
- User logs out → logout_timestamp and session_duration calculated
- Session duration = logout_timestamp - login_timestamp
- IP address and device type captured accurately
- Each login event produces exactly one login_history record

**Scope:** POST `/api/auth/login`, POST `/api/auth/logout`, login_history table

---

### Property 11: Email Uniqueness Enforcement

**For all** users in the system, each email address SHALL be globally unique and no two users can have the same email.

**Validation Approach:**

- Create user with email "john@example.com" (succeeds)
- Attempt to create another user with same email (fails with 400 Bad Request)
- Attempt to update user1 email to existing user2 email (fails with 400)
- Database unique constraint prevents any bypass
- Error message: "Email already in use"

**Scope:** users table email uniqueness constraint, API validation

---

### Property 12: Forced Password Change Compliance

**For all** users flagged with force_password_change = true, the system SHALL prevent any operation except password change until password is changed.

**Validation Approach:**

- User created with force_password_change = true
- User attempts to access any feature (must fail with 403 and redirect to password change)
- User changes password successfully
- force_password_change set to false
- User can now access all features normally

**Scope:** POST `/api/auth/set-password`, authentication middleware

---

## Error Handling

### Error Handling Strategy

#### 1. Email Validation and Duplicate Detection

```typescript
// Frontend Validation (Real-time)
- Format validation: RFC 5322 email standard
- Length check: max 255 characters
- Display error immediately if invalid format
- Debounced async uniqueness check (300ms delay)
- Show spinner during uniqueness check

// Backend Validation (Before Insert/Update)
- Repeat email format validation
- Database query to check uniqueness
- If duplicate: Return 400 Bad Request
- Response: { error: "Email already in use" }

// Error Response Example
{
  "success": false,
  "error": "Email already in use",
  "field": "email",
  "validationErrors": {
    "email": ["Email 'john@example.com' is already registered"]
  }
}
```

#### 2. Phone Number Format Validation

```typescript
// Zimbabwe Phone Patterns
- Land line: +263 (0) followed by 9 digits
- Cellular: +263 71x/72x/73x followed by 6 digits
- Local format: 0717 123456
- International format: +263717123456

// Frontend Validation
- Real-time format check with visual indicator
- Display accepted formats as hint: "+263 71X XXX XXX or 0717 XXX XXX"
- Clear error if format invalid

// Backend Validation
- Parse to standard international format
- Validate against Zimbabwe phone patterns
- If invalid: Return 400 Bad Request
- Error: "Phone number must be valid Zimbabwe format"

// Error Response
{
  "success": false,
  "validationErrors": {
    "phone_number": [
      "Invalid phone number format",
      "Accepted formats: +263717123456 or 0717123456"
    ]
  }
}
```

#### 3. Password Complexity Validation

```typescript
// Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)
- Cannot contain user's email or username

// Frontend Validation
- Real-time strength indicator (Weak → Medium → Strong)
- Show progress bar with color (red → yellow → green)
- Display specific requirements not met:
  "✓ 8+ characters"
  "✗ Missing uppercase letter"
  "✓ Contains number"
  "✗ Missing special character"
- Submit button disabled until Strong

// Backend Validation
- Repeat all checks
- If weak: Return 400 Bad Request
- Error: "Password does not meet complexity requirements"

// Error Response
{
  "success": false,
  "validationErrors": {
    "password": [
      "Password must be at least 8 characters",
      "Password must contain at least one uppercase letter",
      "Password must contain at least one special character"
    ]
  }
}
```

#### 4. Optimistic Locking Version Conflict

```typescript
// Conflict Scenario
- Admin A loads user (version = 5)
- Admin B loads user (version = 5)
- Admin A modifies and saves (version incremented to 6)
- Admin B attempts save with version = 5

// Backend Detects Conflict
- Query user by ID
- Check submitted version vs database version
- If mismatch: Return 409 Conflict

// Error Response (409)
{
  "success": false,
  "error": "User record was modified by another admin. Please refresh and try again.",
  "current_version": 6,
  "your_version": 5,
  "latest_data": { /* full user object with current data */ }
}

// Frontend Handling
- Show warning dialog: "This record was updated by another user"
- Display before/after changes
- Offer options: "Refresh & Retry" or "Cancel"
- If Refresh: Reload user, show changes, re-apply edits
- If Cancel: Discard changes
```

#### 5. API Error Responses with HTTP Status Codes

```typescript
// 400 Bad Request - Validation Error
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": {
    "email": ["Invalid email format"],
    "role_id": ["Role not found"]
  },
  "status": 400
}

// 401 Unauthorized - Authentication Required
{
  "success": false,
  "error": "Authentication required",
  "status": 401
}

// 403 Forbidden - Permission Denied
{
  "success": false,
  "error": "You do not have permission to perform this action",
  "requiredPermission": "delete_user",
  "status": 403
}

// 404 Not Found - Resource Not Found
{
  "success": false,
  "error": "User not found",
  "resource": "User",
  "resourceId": "uuid",
  "status": 404
}

// 409 Conflict - Optimistic Locking Mismatch
{
  "success": false,
  "error": "Record was modified. Please refresh and try again.",
  "current_version": 6,
  "your_version": 5,
  "status": 409
}

// 429 Too Many Requests - Rate Limiting (Login Attempts)
{
  "success": false,
  "error": "Too many failed login attempts. Please try again in 15 minutes.",
  "retryAfterSeconds": 900,
  "status": 429
}

// 500 Internal Server Error
{
  "success": false,
  "error": "An error occurred while processing your request",
  "status": 500
  // Never expose technical details in production
}
```

#### 6. User-Friendly Error Messages

```typescript
// Good: Clear, actionable, without technical details
✓ "Email already in use. Try a different email or reset your password."
✓ "Invalid phone number. Use format +263717123456 or 0717123456"
✓ "Password must be at least 8 characters with mix of letters, numbers, and symbols"
✓ "This record was updated by another user. Would you like to refresh and try again?"
✓ "You don't have permission to delete users. Contact your administrator."

// Bad: Technical jargon, not actionable
✗ "UNIQUE constraint violation on column email"
✗ "Foreign key constraint failed on role_id"
✗ "Query execution error in stored procedure"
✗ "Database connection pool exhausted"
✗ "bcrypt hash function failed"
```

#### 7. Retry Logic for Transient Failures

```typescript
// Transient Failure Detection
- Network timeout (>30 seconds)
- Database temporary unavailability (connection pool exhausted)
- Rate limit exceeded (429 status)
- Service temporarily unavailable (503 status)

// Retry Strategy (Exponential Backoff)
- Attempt 1: Immediate retry
- Attempt 2: Wait 1 second + retry
- Attempt 3: Wait 2 seconds + retry
- Attempt 4: Wait 4 seconds + retry
- Max attempts: 4 total attempts
- Total max wait: 7 seconds

// Implementation
async function apiCallWithRetry(
  operation: () => Promise<any>,
  maxRetries = 4,
  baseDelay = 1000
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isTransient = error.status === 429 ||
                          error.status === 503 ||
                          error.status === 504 ||
                          error.message === 'Network timeout';

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 2);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Frontend Error Dialog
- Show retry indicator (spinner)
- Display attempt count: "Retrying... (Attempt 2 of 4)"
- If all retries fail: Show error message with manual retry button
- Auto-retry transparent to user
```

#### 8. Specific Error Scenarios

```typescript
// User Not Found
{
  "success": false,
  "error": "User not found",
  "userId": "invalid-uuid",
  "status": 404
}
// UI: "The user you're looking for doesn't exist or has been deleted."

// Insufficient Permissions
{
  "success": false,
  "error": "Insufficient permissions",
  "requiredPermission": "delete_user",
  "userPermissions": ["read_user", "update_user"],
  "status": 403
}
// UI: "You don't have permission to delete users. Contact an administrator."

// Invalid Status Transition
{
  "success": false,
  "error": "Invalid status transition",
  "currentStatus": "Inactive",
  "attemptedStatus": "Active",
  "validTransitions": ["Delete"],
  "status": 400
}
// UI: "An inactive user cannot be reactivated directly. Please contact support."

// Password Reset Token Expired
{
  "success": false,
  "error": "Password reset link expired",
  "expirationTime": "7 days",
  "status": 400
}
// UI: "Your password reset link has expired. Request a new one."

// Invitation Already Accepted
{
  "success": false,
  "error": "Invitation already accepted",
  "status": 400
}
// UI: "This invitation has already been used. If you need to reset your password, use the password reset option."

// Bulk Operation Partial Failure
{
  "success": false,
  "error": "Bulk operation completed with errors",
  "successCount": 14,
  "failureCount": 1,
  "failures": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "error": "Role not found"
    }
  ],
  "status": 207 // Multi-Status
}
// UI: "14 users updated successfully. 1 user failed: user@example.com (Role not found)"
```

#### 9. Error Logging and Monitoring

```typescript
// Log All Errors for Debugging
- Error timestamp
- Error type and message
- Stack trace (backend only, never sent to frontend)
- User context (user_id, permissions)
- API endpoint and HTTP method
- Request parameters (sanitized, no passwords)
- Response status code

// Critical Errors to Alert On
- Failed login attempts > 5 in 15 minutes
- Bulk operations affecting > 100 users
- Audit log access from unexpected sources
- Database connection failures
- Authentication failures for admin users
- API response time > 5 seconds
- Error rate > 1% on any endpoint

// Example Error Log Entry
{
  "timestamp": "2026-01-15T10:30:45Z",
  "severity": "ERROR",
  "errorType": "ValidationError",
  "message": "Email already in use",
  "userId": "admin-uuid",
  "endpoint": "POST /api/users",
  "statusCode": 400,
  "context": {
    "email": "duplicate@example.com",
    "attemptedAction": "create_user"
  }
}
```

---

## Testing Strategy

### Unit Testing Approach

**Permission Checks:**

- Test hasPermission() for each role-permission combination
- Test canAccessBranch() for cross-branch access prevention
- Test Admin role override behavior

**Form Validation:**

- Email format validation (valid/invalid cases)
- Password complexity requirements
- Phone number format (Zimbabwe patterns)
- Required field validation
- Email uniqueness check simulation

**Data Formatting:**

- Password hash function behavior
- Audit log state serialization
- Date formatting for different timezones

**Error Scenarios:**

- Database connection failures
- Duplicate email handling
- Invalid invitation tokens
- Expired password reset links

### Integration Testing Approach

**User Workflows:**

- Create user → Send invitation → Accept invitation → Set password → Login
- Update user role → Sessions invalidated → Login with new permissions
- Bulk operation → All users updated atomically or all rolled back
- Password reset → Existing sessions terminated

**Audit Trail:**

- User creation logged with all fields
- User modification logged with before/after state
- Bulk operations logged individually
- Session events logged with IP and device info

**Database Integrity:**

- Foreign key constraints enforced
- Cascade deletes work correctly
- RLS policies prevent unauthorized access
- Optimistic locking prevents concurrent edit conflicts

### Test Data Requirements

- 50-100 test users across 3 branches and 5 departments
- Multiple roles assigned: Admin (1), Manager (5), Staff (30), Viewer (3)
- Mix of Active/Inactive statuses
- 500+ login history entries
- 1000+ audit log entries spanning multiple action types

---

## Deployment & Operations

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://xxx
```

### Database Migrations

Run migrations in order:

1. Create core tables (users, roles, permissions, branches, departments)
2. Create activity tables (login_history, audit_log)
3. Create invitation and search tables (user_invitations, saved_searches)
4. Create RLS policies
5. Create triggers for audit logging
6. Create indexes

### Migration Rollback Strategy

- Each migration has corresponding rollback
- Test rollbacks in staging before production
- Keep audit logs even when rolling back user tables

### Monitoring & Alerting

- Alert on failed login attempts > 5 in 15 minutes
- Alert on deleted users (manual audit trigger)
- Alert on bulk operations > 100 users
- Alert on audit log access from non-Viewer roles
- Monitor API response times (target < 500ms)
- Monitor database query times (target < 100ms)

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **Custom Roles**: Only 4 predefined roles currently supported (Admin, Manager, Staff, Viewer)
2. **Geolocation**: Login location detection not implemented (requires GeoIP service)
3. **2FA**: Two-factor authentication not yet implemented
4. **Single Sign-On (SSO)**: No SAML/OAuth integration
5. **Email Templates**: Generic email format (could be enhanced with custom templates)
6. **Notification Preferences**: No user control over notification types

### Future Enhancements

1. **Custom Roles**: Allow admins to create custom roles with permission templates
2. **Two-Factor Authentication (2FA)**: Support TOTP and SMS-based 2FA
3. **Single Sign-On (SSO)**: SAML 2.0 and OAuth 2.0 integration
4. **Advanced Reporting**: User analytics, role distribution, activity trends
5. **User Groups**: Assign permissions to user groups instead of individuals
6. **Scheduled Reports**: Automatic report delivery via email
7. **User Activity Anonymization**: Compliance with privacy regulations
8. **Biometric Authentication**: Fingerprint/face recognition for mobile

---

## Summary

The User Management module provides a comprehensive, secure, and scalable solution for user provisioning, role-based access control, and audit tracking. By leveraging Supabase Auth, PostgreSQL RLS, and optimistic locking, it ensures both security and data consistency at scale. The responsive UI and efficient API design enable administrators to manage users effectively across multiple branches and departments while maintaining complete audit trails for compliance.

**Next Steps:**

1. Review and approve design
2. Create database migrations
3. Implement API routes with permission checks
4. Build React components with responsive design
5. Add comprehensive unit and integration tests
6. Deploy to staging and conduct UAT
