# Permission Matrix - Define Horizon BMS User Management

**Generated:** February 28, 2025  
**Module:** User Management  
**Version:** 1.0  
**Status:** Reference Documentation

---

## Overview

This document provides a comprehensive reference for the role-based access control (RBAC) permission matrix used in the Define Horizon Business Management System. It defines the four system roles and their corresponding permissions across different operational categories.

---

## System Roles

### 1. Super Administrator (`super_admin`)

**Purpose:** System Administrator with complete system access  
**Scope:** Global - All operations on all data  
**Primary Responsibility:** System configuration, user provisioning, security management

**Assigned Permissions (15 total - ALL permissions):**

- ✓ create_user
- ✓ read_user
- ✓ update_user
- ✓ delete_user
- ✓ manage_roles
- ✓ manage_permissions
- ✓ view_audit_log
- ✓ manage_branch_assignment
- ✓ bulk_actions
- ✓ export_users
- ✓ view_activity_log
- ✓ view_branch_data
- ✓ view_subordinate_activity
- ✓ export_reports
- ✓ view_reports

**Operational Capabilities:**

- Create, read, update, and delete any user account
- Assign roles and permissions to users
- Manage branch assignments globally
- View complete audit trail of all system actions
- Perform bulk operations on any number of users
- Access all activity logs and reports
- Export data in all available formats

---

### 2. Branch Manager (`branch_manager`)

**Purpose:** Branch-level administrator for multi-branch operations  
**Scope:** Branch-scoped - Operations limited to assigned branch  
**Primary Responsibility:** Staff management, branch operations, team oversight

**Assigned Permissions (8 total - Branch-Scoped Operations):**

- ✓ create_user (own branch only)
- ✓ read_user (own branch only)
- ✓ update_user (own branch only)
- ✓ manage_branch_assignment (own branch only)
- ✓ view_activity_log (own branch only)
- ✓ view_branch_data (full branch access)
- ✓ export_users (own branch only)
- ✓ view_subordinate_activity (team members)

**Operational Capabilities:**

- Create new user accounts within their assigned branch
- View profiles and manage team members in their branch
- Update user information for branch staff only
- Assign users to departments within the branch
- Monitor login history and activity for branch staff
- Access branch-level performance data and metrics
- Export branch user lists and reports
- View activity of direct reports and team members

**Restrictions:**

- Cannot create or modify Super Admin or other Branch Manager accounts
- Cannot view users in other branches
- Cannot delete user accounts (soft-delete via status change only)
- Cannot manage system-wide roles or permissions

---

### 3. Employee (`employee`)

**Purpose:** Standard operational user with limited access  
**Scope:** Self + Team - Own profile and limited team visibility  
**Primary Responsibility:** Daily operations, personal profile management

**Assigned Permissions (5 total - Self and Team Operations):**

- ✓ read_user (self + company directory)
- ✓ update_user (own profile only)
- ✓ view_activity_log (own activity only)
- ✓ view_subordinate_activity (direct reports only)
- ✓ view_reports (read-only)

**Operational Capabilities:**

- View own user profile information
- Access company employee directory (limited information)
- Update own profile (name, email, phone, password)
- View own login history and activity
- Monitor activity of direct reports (if manager)
- View and access operational reports

**Restrictions:**

- Cannot create or manage user accounts
- Cannot access other employees' full profiles
- Cannot view audit logs
- Cannot export user data
- Cannot perform bulk operations
- Cannot change own role or branch assignment

---

### 4. Auditor (`auditor`)

**Purpose:** Compliance and audit oversight (read-only access)  
**Scope:** Global Read-Only - View all data without modification  
**Primary Responsibility:** Compliance monitoring, audit trail review, data verification

**Assigned Permissions (4 total - Read-Only Audit Access):**

- ✓ read_user (all users - read-only)
- ✓ view_audit_log (complete audit trail)
- ✓ view_activity_log (all user activity)
- ✓ view_reports (read-only)

**Operational Capabilities:**

- View all user profiles and information
- Access complete audit trail including all historical changes
- Review login history and activity for any user
- Generate and view compliance reports
- Track administrative actions and changes

**Restrictions:**

- Cannot create, modify, or delete any data
- Cannot perform any write operations
- Cannot manage users or roles
- Cannot export audit data (data must be queried for compliance purposes)
- Cannot access sensitive system configurations

---

## Permission Catalog

### User Management Category

| Permission Code            | Permission Name          | Description                 | Super Admin | Branch Manager | Employee | Auditor |
| -------------------------- | ------------------------ | --------------------------- | :---------: | :------------: | :------: | :-----: |
| `create_user`              | Create User              | Create new user accounts    |      ✓      |       ✓*       |    ✗     |    ✗    |
| `read_user`                | Read User                | View user profiles          |      ✓      |       ✓*       |    ✓*    |    ✓    |
| `update_user`              | Update User              | Modify user information     |      ✓      |       ✓*       |    ✓*    |    ✗    |
| `delete_user`              | Delete User              | Permanently delete accounts |      ✓      |       ✗        |    ✗     |    ✗    |
| `manage_roles`             | Manage Roles             | Assign/modify roles         |      ✓      |       ✗        |    ✗     |    ✗    |
| `manage_permissions`       | Manage Permissions       | Configure role permissions  |      ✓      |       ✗        |    ✗     |    ✗    |
| `view_audit_log`           | View Audit Log           | Access audit trails         |      ✓      |       ✗        |    ✗     |    ✓    |
| `manage_branch_assignment` | Manage Branch Assignment | Assign users to branches    |      ✓      |       ✓*       |    ✗     |    ✗    |
| `bulk_actions`             | Perform Bulk Actions     | Execute bulk operations     |      ✓      |       ✗        |    ✗     |    ✗    |
| `export_users`             | Export Users             | Export user data            |      ✓      |       ✓*       |    ✗     |    ✗    |

**Legend:** ✓ = Permission granted | ✗ = Permission denied | ✓* = Permission scoped/restricted

### Data Management Category

| Permission Code             | Permission Name           | Description                   | Super Admin | Branch Manager | Employee | Auditor |
| --------------------------- | ------------------------- | ----------------------------- | :---------: | :------------: | :------: | :-----: |
| `view_activity_log`         | View Activity Log         | Access login/activity history |      ✓      |       ✓*       |    ✓*    |    ✓    |
| `view_branch_data`          | View Branch Data          | Access branch data            |      ✓      |       ✓        |    ✗     |    ✗    |
| `view_subordinate_activity` | View Subordinate Activity | Monitor team member activity  |      ✓      |       ✓        |    ✓*    |    ✗    |

### Reporting Category

| Permission Code  | Permission Name | Description    | Super Admin | Branch Manager | Employee | Auditor |
| ---------------- | --------------- | -------------- | :---------: | :------------: | :------: | :-----: |
| `export_reports` | Export Reports  | Export reports |      ✓      |       ✗        |    ✗     |    ✗    |
| `view_reports`   | View Reports    | View reports   |      ✓      |       ✗        |    ✓     |    ✓    |

---

## Scoping Rules

Certain permissions are scoped to specific organizational contexts:

### Own Branch (`*` notation)

- **Applies to:** Branch Manager
- **Meaning:** Operations limited to users and data within the manager's assigned branch
- **Examples:**
  - `create_user (own branch)`: Can only create users assigned to their branch
  - `read_user (own branch)`: Can only view profiles of users in their branch
  - `export_users (own branch)`: Can only export user lists from their branch

### Own Activity

- **Applies to:** Employee
- **Meaning:** Access limited to the logged-in user's own actions and history
- **Examples:**
  - `view_activity_log (self)`: Can only view their own login history
  - `update_user (self)`: Can only modify their own profile

### Direct Reports

- **Applies to:** Employee, Branch Manager
- **Meaning:** Access to users who directly report to the current user
- **Examples:**
  - `view_subordinate_activity`: Can monitor activity of direct reports

### Company Directory

- **Applies to:** Employee
- **Meaning:** Non-sensitive user information accessible to all employees
- **Includes:** Name, email, role, branch, department (if applicable)
- **Excludes:** Phone numbers, suspension history, audit records

---

## Access Control Enforcement

### Database Level (Row-Level Security)

- RLS policies enforce scoping at the PostgreSQL level
- Branch Manager cannot query other branch users (enforced by RLS)
- Employee cannot view other employee profiles (enforced by RLS)
- Auditor has read-only access with RLS preventing modifications

### API Level

- Permission checks before data access
- Scope validation based on user's role context
- Request IP address and user agent logged for audit

### Application Level

- UI components conditionally rendered based on permissions
- Forms and actions disabled for non-permitted users
- Clear error messages for permission violations

---

## Permission Assignment Matrix

```
Role                 → Permissions
────────────────────────────────────────────────────────────
super_admin          → [ALL 15 permissions]
branch_manager       → [create_user, read_user, update_user,
                        manage_branch_assignment, view_activity_log,
                        view_branch_data, export_users,
                        view_subordinate_activity]
employee             → [read_user, update_user, view_activity_log,
                        view_subordinate_activity, view_reports]
auditor              → [read_user, view_audit_log,
                        view_activity_log, view_reports]
```

---

## Common Workflows by Role

### Super Administrator

1. **User Provisioning:** Create user → Assign role → Assign branch → Send invitation
2. **Access Control:** Manage roles → Modify permissions → Audit trail review
3. **System Maintenance:** Bulk user operations → Data exports → System configuration

### Branch Manager

1. **Team Management:** Create branch users → Update team member info → View team activity
2. **Reporting:** Export branch user lists → Monitor team logins → View branch metrics
3. **Compliance:** Track changes to team members → Maintain team roster

### Employee

1. **Self Service:** Update own profile → View own activity → Check login history
2. **Team Visibility:** View team members → Check direct reports → Monitor direct report activity
3. **Access Reports:** View operational reports → Track personal metrics

### Auditor

1. **Compliance Review:** Review audit logs → Track user management actions → Monitor access
2. **Data Verification:** View all user information → Verify data integrity → Generate compliance reports
3. **Investigation:** Trace user creation → Review modification history → Audit activity patterns

---

## Permission Categories and Intent

### User Management

Permissions related to user provisioning, modification, and access control:

- User lifecycle (create, read, update, delete)
- Role and permission assignment
- Branch assignment and organization
- Bulk user operations

### Data Management

Permissions related to accessing and viewing organizational data:

- Branch-level data access
- Activity monitoring and visibility
- Subordinate supervision capabilities

### Reporting

Permissions related to data analysis and reporting:

- Access to reports
- Export capabilities
- Data analysis

---

## Implementation Notes

### Idempotency

The migration file uses `ON CONFLICT ... DO NOTHING` to ensure idempotent execution. Running the migration multiple times is safe and will not duplicate data.

### Verification Queries

To verify the permission matrix was created correctly:

```sql
-- Count total permissions
SELECT COUNT(*) as total_permissions FROM public.permissions;

-- View role-permission mappings
SELECT
  r.role_name,
  p.permission_code,
  p.permission_name
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.role_id
JOIN public.permissions p ON rp.permission_id = p.permission_id
ORDER BY r.role_name, p.permission_code;

-- Count permissions per role
SELECT
  r.role_name,
  COUNT(rp.permission_id) as permission_count
FROM public.roles r
LEFT JOIN public.role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_id, r.role_name
ORDER BY r.role_name;
```

---

## Related Documentation

- **Requirements:** See `.kiro/specs/user-management/requirements.md` for business requirements (14.1-14.5)
- **Design:** See `.kiro/specs/user-management/design.md` for complete system design
- **Tasks:** See `.kiro/specs/user-management/tasks.md` for implementation tasks
- **API:** See respective API route documentation for permission checks on each endpoint

---

## Change History

| Version | Date       | Changes                                                   |
| ------- | ---------- | --------------------------------------------------------- |
| 1.0     | 2025-02-28 | Initial permission matrix with 4 roles and 15 permissions |

---

## Questions & Support

For questions about the permission matrix or role definitions, refer to the Task 1.5 specification in `tasks.md` or contact the system administrator.
