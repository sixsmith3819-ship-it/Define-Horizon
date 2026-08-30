-- ============================================================================
-- SEED SYSTEM ROLES AND PERMISSIONS FOR USER MANAGEMENT MODULE
-- ============================================================================
-- This migration seeds the database with:
-- 1. Four system roles (Super Administrator, Branch Manager, Employee, Auditor)
-- 2. 15+ permissions organized by category
-- 3. Role-permission mappings according to the permission matrix

-- ============================================================================
-- SECTION 1: CREATE PERMISSIONS TABLE (if not exists)
-- ============================================================================

-- The permissions table should already exist from 20250228_create_user_management_tables.sql
-- but we define it here for reference and to ensure idempotency

CREATE TABLE IF NOT EXISTS public.permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code VARCHAR(50) UNIQUE NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  date_created TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- ============================================================================
-- SECTION 2: SEED PERMISSIONS (15+ permissions across categories)
-- ============================================================================

-- User Management Permissions
INSERT INTO public.permissions (permission_code, permission_name, description, category) VALUES
  ('create_user', 'Create User', 'Create new user accounts', 'user_management'),
  ('read_user', 'Read User', 'View user profile and details', 'user_management'),
  ('update_user', 'Update User', 'Modify user information', 'user_management'),
  ('delete_user', 'Delete User', 'Delete user accounts', 'user_management'),
  ('manage_roles', 'Manage Roles', 'Assign and modify user roles', 'user_management'),
  ('manage_permissions', 'Manage Permissions', 'Manage role permissions and access control', 'user_management'),
  ('view_audit_log', 'View Audit Log', 'Access audit trail and compliance logs', 'user_management'),
  ('manage_branch_assignment', 'Manage Branch Assignment', 'Assign users to branches', 'user_management'),
  ('bulk_actions', 'Perform Bulk Actions', 'Execute bulk operations on multiple users', 'user_management'),
  ('export_users', 'Export Users', 'Export user data to file formats', 'user_management')
ON CONFLICT (permission_code) DO NOTHING;

-- Activity and Data Management Permissions
INSERT INTO public.permissions (permission_code, permission_name, description, category) VALUES
  ('view_activity_log', 'View Activity Log', 'View user login and activity history', 'user_management'),
  ('view_branch_data', 'View Branch Data', 'Access branch-level data and reports', 'data_management'),
  ('view_subordinate_activity', 'View Subordinate Activity', 'Monitor activity of team members and subordinates', 'data_management')
ON CONFLICT (permission_code) DO NOTHING;

-- Reporting Permissions
INSERT INTO public.permissions (permission_code, permission_name, description, category) VALUES
  ('export_reports', 'Export Reports', 'Export reports to various formats', 'reports'),
  ('view_reports', 'View Reports', 'Access and view system reports', 'reports')
ON CONFLICT (permission_code) DO NOTHING;

-- ============================================================================
-- SECTION 3: VERIFY ROLES EXIST (from previous migration)
-- ============================================================================

-- Verify the 4 system roles exist
-- These should have been created in 20250228_create_user_management_tables.sql
-- Super Admin role
INSERT INTO public.roles (role_id, role_name, description, is_system_role, date_created, date_modified)
  SELECT 
    (SELECT role_id FROM public.roles WHERE role_name = 'super_admin' LIMIT 1)::UUID,
    'super_admin',
    'System Administrator with full access to all operations and data',
    true,
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'super_admin');

-- Branch Manager role
INSERT INTO public.roles (role_name, description, is_system_role, date_created, date_modified)
  SELECT 
    'branch_manager',
    'Branch Manager with branch-scoped access and limited administrative capabilities',
    true,
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'branch_manager');

-- Employee role
INSERT INTO public.roles (role_name, description, is_system_role, date_created, date_modified)
  SELECT 
    'employee',
    'Employee with operational access and limited permissions',
    true,
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'employee');

-- Auditor role
INSERT INTO public.roles (role_name, description, is_system_role, date_created, date_modified)
  SELECT 
    'auditor',
    'Auditor with read-only access to audit logs and user information',
    true,
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'auditor');

-- ============================================================================
-- SECTION 4: CREATE ROLE_PERMISSIONS JUNCTION TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(permission_id) ON DELETE CASCADE,
  date_assigned TIMESTAMP DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- ============================================================================
-- SECTION 5: ASSIGN PERMISSIONS TO SUPER ADMINISTRATOR ROLE
-- ============================================================================
-- Super Administrator has ALL permissions

INSERT INTO public.role_permissions (role_id, permission_id, date_assigned)
SELECT 
  r.role_id,
  p.permission_id,
  now()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.role_name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- SECTION 6: ASSIGN PERMISSIONS TO BRANCH MANAGER ROLE
-- ============================================================================
-- Branch Manager has: create_user, read_user, update_user (own branch),
-- manage_branch_assignment (own branch), view_activity_log (own branch),
-- view_branch_data, export_users (own branch), view_subordinate_activity

INSERT INTO public.role_permissions (role_id, permission_id, date_assigned)
SELECT 
  r.role_id,
  p.permission_id,
  now()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.role_name = 'branch_manager'
  AND p.permission_code IN (
    'create_user',
    'read_user',
    'update_user',
    'manage_branch_assignment',
    'view_activity_log',
    'view_branch_data',
    'export_users',
    'view_subordinate_activity'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- SECTION 7: ASSIGN PERMISSIONS TO EMPLOYEE ROLE
-- ============================================================================
-- Employee has: read_user (self + directory), update_user (self),
-- view_activity_log (self), view_subordinate_activity (direct reports), view_reports

INSERT INTO public.role_permissions (role_id, permission_id, date_assigned)
SELECT 
  r.role_id,
  p.permission_id,
  now()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.role_name = 'employee'
  AND p.permission_code IN (
    'read_user',
    'update_user',
    'view_activity_log',
    'view_subordinate_activity',
    'view_reports'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- SECTION 8: ASSIGN PERMISSIONS TO AUDITOR ROLE
-- ============================================================================
-- Auditor has: read_user, view_audit_log, view_activity_log (all),
-- view_reports (read-only access)

INSERT INTO public.role_permissions (role_id, permission_id, date_assigned)
SELECT 
  r.role_id,
  p.permission_id,
  now()
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.role_name = 'auditor'
  AND p.permission_code IN (
    'read_user',
    'view_audit_log',
    'view_activity_log',
    'view_reports'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- SECTION 9: VERIFICATION QUERIES (for documentation/testing)
-- ============================================================================
-- Run these queries to verify the seeding was successful

-- Query 1: Count total permissions created
-- SELECT COUNT(*) as total_permissions FROM public.permissions;
-- Expected: 15 permissions

-- Query 2: Count roles created
-- SELECT COUNT(*) as total_roles, COUNT(DISTINCT role_name) as unique_roles FROM public.roles;
-- Expected: 4 roles

-- Query 3: View permission matrix (roles vs permissions)
-- SELECT 
--   r.role_name,
--   COUNT(rp.permission_id) as permission_count,
--   STRING_AGG(p.permission_code, ', ' ORDER BY p.permission_code) as permissions
-- FROM public.roles r
-- LEFT JOIN public.role_permissions rp ON r.role_id = rp.role_id
-- LEFT JOIN public.permissions p ON rp.permission_id = p.permission_id
-- WHERE r.is_system_role = true
-- GROUP BY r.role_id, r.role_name
-- ORDER BY r.role_name;

-- Query 4: View all role-permission mappings
-- SELECT 
--   r.role_name,
--   p.permission_code,
--   p.permission_name,
--   p.category
-- FROM public.role_permissions rp
-- JOIN public.roles r ON rp.role_id = r.role_id
-- JOIN public.permissions p ON rp.permission_id = p.permission_id
-- ORDER BY r.role_name, p.category, p.permission_code;

-- ============================================================================
-- SECTION 10: PERMISSION MATRIX DOCUMENTATION
-- ============================================================================

/*
PERMISSION MATRIX - FINAL STATE

┌──────────────────────┬─────────────────────────────────────────────────────────────────┐
│ Role                 │ Permissions Assigned                                            │
├──────────────────────┼─────────────────────────────────────────────────────────────────┤
│ SUPER_ADMIN          │ • create_user                                                   │
│ (System Admin)       │ • read_user                                                     │
│ Full Access          │ • update_user                                                   │
│ All Operations       │ • delete_user                                                   │
│                      │ • manage_roles                                                  │
│                      │ • manage_permissions                                            │
│                      │ • view_audit_log                                                │
│                      │ • manage_branch_assignment                                      │
│                      │ • bulk_actions                                                  │
│                      │ • export_users                                                  │
│                      │ • view_activity_log                                             │
│                      │ • view_branch_data                                              │
│                      │ • view_subordinate_activity                                     │
│                      │ • export_reports                                                │
│                      │ • view_reports                                                  │
├──────────────────────┼─────────────────────────────────────────────────────────────────┤
│ BRANCH_MANAGER       │ • create_user (own branch only)                                │
│ (Branch Admin)       │ • read_user (own branch only)                                  │
│ Branch-Scoped        │ • update_user (own branch only)                                │
│ Limited Admin        │ • manage_branch_assignment (own branch only)                   │
│                      │ • view_activity_log (own branch only)                          │
│                      │ • view_branch_data (full branch access)                        │
│                      │ • export_users (own branch only)                               │
│                      │ • view_subordinate_activity (team members)                     │
├──────────────────────┼─────────────────────────────────────────────────────────────────┤
│ EMPLOYEE             │ • read_user (self + company directory)                         │
│ (Agent/Staff)        │ • update_user (self profile only)                              │
│ Limited Operational  │ • view_activity_log (own activity)                             │
│                      │ • view_subordinate_activity (direct reports)                   │
│                      │ • view_reports (read-only)                                     │
├──────────────────────┼─────────────────────────────────────────────────────────────────┤
│ AUDITOR              │ • read_user (all users - read only)                            │
│ (Compliance)         │ • view_audit_log (complete audit trail)                        │
│ Read-Only            │ • view_activity_log (all activity)                             │
│ Audit Access         │ • view_reports (read-only)                                     │
└──────────────────────┴─────────────────────────────────────────────────────────────────┘

CATEGORIES:
- user_management: Operations related to user provisioning and access control
- data_management: Permissions related to viewing branch data and activity
- reports: Permission to view and export reports

SCOPING NOTES:
- "Own branch" = Branch assigned to the current user
- "Own activity" = Login history and actions performed by the user
- "Direct reports" = Users who report to the current user (manager)
- "Company directory" = Non-sensitive user information accessible to all employees

ADDITIONAL CONSTRAINTS (enforced in API layer):
- Branch Manager: Cannot create/modify Super Admin or Branch Manager roles
- Employee: Can only update own profile (email, phone, preferences)
- Auditor: Read-only access to all data, no create/update/delete operations
- All: Subject to Row-Level Security (RLS) policies at database level

*/

-- ============================================================================
-- SEEDS COMPLETE
-- ============================================================================
