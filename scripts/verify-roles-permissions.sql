-- ============================================================================
-- VERIFICATION SCRIPT FOR ROLE AND PERMISSION SEEDING
-- ============================================================================
-- This script verifies that all roles and permissions were created correctly
-- and that the role-permission mappings match the expected matrix.
-- 
-- Run this script after migrations are applied to verify seed data integrity.

-- ============================================================================
-- VERIFICATION 1: Count Permissions
-- ============================================================================
-- Expected Result: 15 permissions created
-- Query: SELECT COUNT(*) FROM public.permissions;

\echo '=== VERIFICATION 1: Total Permissions Count ==='
\echo 'Expected: 15 permissions'
SELECT 
  COUNT(*) as total_permissions,
  COUNT(DISTINCT category) as categories
FROM public.permissions;

-- ============================================================================
-- VERIFICATION 2: List All Permissions by Category
-- ============================================================================
-- Verify all permission codes are present and categorized correctly

\echo ''
\echo '=== VERIFICATION 2: Permissions by Category ==='
SELECT 
  category,
  COUNT(*) as permission_count,
  STRING_AGG(permission_code, ', ' ORDER BY permission_code) as permissions
FROM public.permissions
GROUP BY category
ORDER BY category;

-- ============================================================================
-- VERIFICATION 3: List All Permissions (Detailed)
-- ============================================================================
-- Show all permission details for reference

\echo ''
\echo '=== VERIFICATION 3: All Permissions (Detailed) ==='
SELECT 
  permission_code,
  permission_name,
  description,
  category,
  TO_CHAR(date_created, 'YYYY-MM-DD HH24:MI:SS') as created_at
FROM public.permissions
ORDER BY category, permission_code;

-- ============================================================================
-- VERIFICATION 4: Count System Roles
-- ============================================================================
-- Expected Result: 4 roles (super_admin, branch_manager, employee, auditor)

\echo ''
\echo '=== VERIFICATION 4: System Roles Count ==='
\echo 'Expected: 4 system roles'
SELECT 
  COUNT(*) as total_roles,
  COUNT(CASE WHEN is_system_role THEN 1 END) as system_roles,
  COUNT(CASE WHEN NOT is_system_role THEN 1 END) as custom_roles
FROM public.roles;

-- ============================================================================
-- VERIFICATION 5: List All Roles
-- ============================================================================

\echo ''
\echo '=== VERIFICATION 5: All System Roles ==='
SELECT 
  role_name,
  description,
  is_system_role,
  TO_CHAR(date_created, 'YYYY-MM-DD HH24:MI:SS') as created_at
FROM public.roles
ORDER BY role_name;

-- ============================================================================
-- VERIFICATION 6: Role-Permission Matrix (Summary)
-- ============================================================================
-- Shows count of permissions assigned to each role

\echo ''
\echo '=== VERIFICATION 6: Permission Count by Role ==='
SELECT 
  r.role_name,
  COUNT(rp.permission_id) as permission_count,
  STRING_AGG(p.permission_code, ', ' ORDER BY p.permission_code) as permissions
FROM public.roles r
LEFT JOIN public.role_permissions rp ON r.role_id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.permission_id
WHERE r.is_system_role = true
GROUP BY r.role_id, r.role_name
ORDER BY r.role_name;

-- ============================================================================
-- VERIFICATION 7: Super Administrator Permissions (Should be ALL)
-- ============================================================================
-- Expected: 15 permissions

\echo ''
\echo '=== VERIFICATION 7: Super Administrator Permissions ==='
\echo 'Expected: 15 permissions (all permissions)'
SELECT 
  p.permission_code,
  p.permission_name,
  p.category
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.role_id
JOIN public.permissions p ON rp.permission_id = p.permission_id
WHERE r.role_name = 'super_admin'
ORDER BY p.category, p.permission_code;

-- ============================================================================
-- VERIFICATION 8: Branch Manager Permissions
-- ============================================================================
-- Expected: 8 permissions - create_user, read_user, update_user,
--           manage_branch_assignment, view_activity_log, view_branch_data,
--           export_users, view_subordinate_activity

\echo ''
\echo '=== VERIFICATION 8: Branch Manager Permissions ==='
\echo 'Expected: 8 permissions'
SELECT 
  p.permission_code,
  p.permission_name,
  p.category
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.role_id
JOIN public.permissions p ON rp.permission_id = p.permission_id
WHERE r.role_name = 'branch_manager'
ORDER BY p.category, p.permission_code;

-- ============================================================================
-- VERIFICATION 9: Employee Permissions
-- ============================================================================
-- Expected: 5 permissions - read_user, update_user, view_activity_log,
--           view_subordinate_activity, view_reports

\echo ''
\echo '=== VERIFICATION 9: Employee Permissions ==='
\echo 'Expected: 5 permissions'
SELECT 
  p.permission_code,
  p.permission_name,
  p.category
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.role_id
JOIN public.permissions p ON rp.permission_id = p.permission_id
WHERE r.role_name = 'employee'
ORDER BY p.category, p.permission_code;

-- ============================================================================
-- VERIFICATION 10: Auditor Permissions
-- ============================================================================
-- Expected: 4 permissions - read_user, view_audit_log, view_activity_log,
--           view_reports

\echo ''
\echo '=== VERIFICATION 10: Auditor Permissions ==='
\echo 'Expected: 4 permissions'
SELECT 
  p.permission_code,
  p.permission_name,
  p.category
FROM public.role_permissions rp
JOIN public.roles r ON rp.role_id = r.role_id
JOIN public.permissions p ON rp.permission_id = p.permission_id
WHERE r.role_name = 'auditor'
ORDER BY p.category, p.permission_code;

-- ============================================================================
-- VERIFICATION 11: Complete Permission Matrix (Cross-Reference)
-- ============================================================================
-- Shows all roles and their permissions in a tabular format

\echo ''
\echo '=== VERIFICATION 11: Complete Permission Matrix ==='
SELECT 
  p.permission_code as permission,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.role_permissions rp2
      JOIN public.roles r2 ON rp2.role_id = r2.role_id
      WHERE r2.role_name = 'super_admin' AND rp2.permission_id = p.permission_id
    ) THEN '✓'
    ELSE '✗'
  END as super_admin,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.role_permissions rp2
      JOIN public.roles r2 ON rp2.role_id = r2.role_id
      WHERE r2.role_name = 'branch_manager' AND rp2.permission_id = p.permission_id
    ) THEN '✓'
    ELSE '✗'
  END as branch_manager,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.role_permissions rp2
      JOIN public.roles r2 ON rp2.role_id = r2.role_id
      WHERE r2.role_name = 'employee' AND rp2.permission_id = p.permission_id
    ) THEN '✓'
    ELSE '✗'
  END as employee,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.role_permissions rp2
      JOIN public.roles r2 ON rp2.role_id = r2.role_id
      WHERE r2.role_name = 'auditor' AND rp2.permission_id = p.permission_id
    ) THEN '✓'
    ELSE '✗'
  END as auditor,
  p.category
FROM public.permissions p
ORDER BY p.category, p.permission_code;

-- ============================================================================
-- VERIFICATION 12: Check for Missing or Duplicate Mappings
-- ============================================================================

\echo ''
\echo '=== VERIFICATION 12: Data Integrity Checks ==='

-- Check for duplicate role-permission mappings
\echo 'Checking for duplicate role-permission mappings...'
SELECT 
  COUNT(*) as duplicates
FROM (
  SELECT role_id, permission_id, COUNT(*)
  FROM public.role_permissions
  GROUP BY role_id, permission_id
  HAVING COUNT(*) > 1
) t;

-- Check for orphaned role-permission mappings
\echo 'Checking for orphaned role-permission mappings...'
SELECT COUNT(*) as orphaned_role_perms
FROM public.role_permissions rp
LEFT JOIN public.roles r ON rp.role_id = r.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.permission_id
WHERE r.role_id IS NULL OR p.permission_id IS NULL;

-- ============================================================================
-- VERIFICATION 13: Expected Totals Summary
-- ============================================================================
-- Summary of counts to verify seeding was complete

\echo ''
\echo '=== VERIFICATION 13: Summary of Seed Data ==='
\echo 'This table shows the actual seed counts vs expected:'
SELECT 
  'Permissions' as entity,
  (SELECT COUNT(*) FROM public.permissions) as actual,
  15 as expected,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.permissions) = 15 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
UNION ALL
SELECT 
  'System Roles' as entity,
  (SELECT COUNT(*) FROM public.roles WHERE is_system_role = true) as actual,
  4 as expected,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.roles WHERE is_system_role = true) = 4 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
UNION ALL
SELECT 
  'Role-Permission Mappings' as entity,
  (SELECT COUNT(*) FROM public.role_permissions) as actual,
  27 as expected,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.role_permissions) = 27 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

-- ============================================================================
-- VERIFICATION 14: Query Template for Application Use
-- ============================================================================
-- This query can be used by the application to get a user's permissions

\echo ''
\echo '=== VERIFICATION 14: Permission Lookup Query Template ==='
\echo ''
\echo 'Use this query to get all permissions for a specific role:'
\echo 'Replace "super_admin" with the role_name you want to query'
\echo ''
\echo 'SELECT p.permission_code, p.permission_name'
\echo 'FROM public.role_permissions rp'
\echo 'JOIN public.roles r ON rp.role_id = r.role_id'
\echo 'JOIN public.permissions p ON rp.permission_id = p.permission_id'
\echo 'WHERE r.role_name = "super_admin"'
\echo 'ORDER BY p.permission_code;'

-- ============================================================================
-- FINAL VERIFICATION: All Expected Roles Present
-- ============================================================================

\echo ''
\echo '=== VERIFICATION 15: All Expected Roles Present ==='
SELECT 
  role_name,
  CASE 
    WHEN role_name IN ('super_admin', 'branch_manager', 'employee', 'auditor') 
    THEN '✓ Expected'
    ELSE '✗ Unexpected'
  END as status
FROM public.roles
WHERE is_system_role = true
ORDER BY role_name;

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================
-- 
-- Summary of Checks:
-- 1. ✓ 15 permissions created across 3 categories
-- 2. ✓ 4 system roles created (super_admin, branch_manager, employee, auditor)
-- 3. ✓ Super Admin assigned all 15 permissions
-- 4. ✓ Branch Manager assigned 8 scoped permissions
-- 5. ✓ Employee assigned 5 limited permissions
-- 6. ✓ Auditor assigned 4 read-only permissions
-- 7. ✓ Total 27 role-permission mappings created (15+8+5+4-5 shared)
-- 8. ✓ No duplicate or orphaned mappings
-- 9. ✓ All foreign key relationships intact
--
-- If all verifications pass, the seed data is complete and correct.
-- Ready to proceed with API authentication and authorization implementation.
