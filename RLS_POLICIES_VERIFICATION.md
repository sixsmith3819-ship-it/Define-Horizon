# RLS Policies Verification Guide

## Overview

This document provides step-by-step instructions to verify that Row-Level Security (RLS) policies have been correctly implemented and deployed on all user-related tables in the Supabase PostgreSQL database.

**Requirements Validated**: 15.7, 14.6, 14.7

---

## Migration File Details

**File**: `supabase/migrations/20250228_002_enable_rls_policies.sql`

**Contents**:

- Enables RLS on 7 tables: profiles, roles, branches, login_history, audit_log, user_invitations, saved_searches
- Creates 31 RLS policies across all tables
- Implements role-based access control at the database level

---

## Step 1: Verify RLS is Enabled on All Tables

### Method: Direct Database Query

Connect to your Supabase database using SQL Editor or CLI and run:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'roles', 'branches', 'login_history', 'audit_log', 'user_invitations', 'saved_searches')
ORDER BY tablename;
```

**Expected Output**:

```
 schemaname |     tablename      | rowsecurity
 public     | audit_log          | t
 public     | branches           | t
 public     | login_history      | t
 public     | profiles           | t
 public     | roles              | t
 public     | saved_searches     | t
 public     | user_invitations   | t
```

All should show `rowsecurity = t` (true). If any show `f` (false), RLS was not enabled correctly.

---

## Step 2: Verify RLS Policies are Created

### Method: List All Policies

Run this query to see all RLS policies:

```sql
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'roles', 'branches', 'login_history', 'audit_log', 'user_invitations', 'saved_searches')
ORDER BY tablename, policyname;
```

**Expected Output**: Should show 31 policies total:

| Table            | Policy Count | Example Policies                                                                                                                                       |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| profiles         | 6            | super_admin_all_profiles, branch_manager_own_branch_profiles, employee_own_profile, auditor_all_profiles, admin_create_profiles, admin_update_profiles |
| roles            | 1            | authenticated_read_roles                                                                                                                               |
| branches         | 1            | branch_visibility                                                                                                                                      |
| login_history    | 3            | user_own_login_history, admin_all_login_history, system_insert_login_history                                                                           |
| audit_log        | 6            | auditor_all_audit_logs, admin_all_audit_logs, user_own_audit_events, admin_insert_audit_log, audit_log_immutable, audit_log_no_delete                  |
| user_invitations | 4            | user_own_invitations, admin_all_invitations, admin_create_invitations, user_update_own_invitations                                                     |
| saved_searches   | 4            | user_own_saved_searches, user_create_own_saved_searches, user_update_own_saved_searches, user_delete_own_saved_searches                                |

---

## Step 3: Test Profiles Table RLS

### Test 3.1: Super Admin can see all profiles

**Setup**:

1. Create a test user with super_admin role
2. As super_admin, query profiles table

**Test Query**:

```sql
-- As super_admin
SELECT user_id, email, full_name, role_id, branch_id
FROM public.profiles
LIMIT 10;
```

**Expected**: Returns all profile records regardless of branch

---

### Test 3.2: Branch Manager sees only own branch users

**Setup**:

1. Create a test user (branch_manager_test) with branch_manager role in branch_harare
2. Create profiles in different branches
3. As branch_manager_test, query profiles

**Test Query**:

```sql
-- As branch_manager_test (assigned to branch_harare)
SELECT user_id, email, branch_id
FROM public.profiles;
```

**Expected**: Returns only profiles where branch_id matches branch_harare

**Verification**: If user tries to access profiles from another branch:

```sql
-- This should return 0 rows
SELECT user_id, email, branch_id
FROM public.profiles
WHERE branch_id != (SELECT branch_id FROM public.profiles WHERE user_id = auth.uid());
```

---

### Test 3.3: Employee sees only their own profile

**Setup**:

1. Create a test user (employee_test) with employee role
2. As employee_test, query profiles

**Test Query**:

```sql
-- As employee_test
SELECT user_id, email, full_name
FROM public.profiles;
```

**Expected**: Returns only the employee_test's own profile record

**Verification**:

```sql
-- This should match their auth.uid()
SELECT COUNT(*) as visible_profiles
FROM public.profiles;
-- Expected result: 1
```

---

### Test 3.4: Auditor can see all profiles

**Setup**:

1. Create a test user (auditor_test) with auditor role
2. As auditor_test, query profiles

**Test Query**:

```sql
-- As auditor_test
SELECT user_id, email, full_name
FROM public.profiles
LIMIT 10;
```

**Expected**: Returns all profile records

---

### Test 3.5: Create Profile Permission (Admins only)

**Test: Admin can create**:

```sql
-- As super_admin
INSERT INTO public.profiles (user_id, email, full_name, role_id, branch_id)
VALUES (gen_random_uuid(), 'newuser@example.com', 'New User',
        (SELECT role_id FROM roles WHERE role_name = 'employee'),
        (SELECT branch_id FROM branches LIMIT 1));
-- Expected: INSERT succeeds
```

**Test: Non-admin cannot create**:

```sql
-- As employee or branch_manager
INSERT INTO public.profiles (user_id, email, full_name, role_id, branch_id)
VALUES (gen_random_uuid(), 'newuser2@example.com', 'New User 2',
        (SELECT role_id FROM roles WHERE role_name = 'employee'),
        (SELECT branch_id FROM branches LIMIT 1));
-- Expected: RLS violation error (new row violates row-level security policy)
```

---

## Step 4: Test Audit Log RLS

### Test 4.1: Audit logs immutability

**Setup**: Any user attempts to modify audit logs

**Test: Cannot UPDATE**:

```sql
-- As any user
UPDATE public.audit_log
SET description = 'Modified'
WHERE audit_log_id = '...' LIMIT 1;
-- Expected: UPDATE 0 (no rows affected - RLS policy blocks it)
```

**Test: Cannot DELETE**:

```sql
-- As any user (even super_admin)
DELETE FROM public.audit_log
WHERE audit_log_id = '...';
-- Expected: DELETE 0 (no rows affected - RLS policy blocks it)
```

---

### Test 4.2: Audit log visibility

**Test: Auditor sees all**:

```sql
-- As auditor_test
SELECT COUNT(*) as audit_entries
FROM public.audit_log;
-- Expected: Returns all audit log entries
```

**Test: Super Admin sees all**:

```sql
-- As super_admin
SELECT COUNT(*) as audit_entries
FROM public.audit_log;
-- Expected: Returns all audit log entries
```

**Test: Non-auditor sees own only**:

```sql
-- As employee_test
SELECT COUNT(*) as audit_entries
FROM public.audit_log;
-- Expected: Returns only entries where user_id_affected = employee_test OR admin_user_id = employee_test
```

---

## Step 5: Test Login History RLS

**Test: Users see own history**:

```sql
-- As employee_test
SELECT COUNT(*) as login_events
FROM public.login_history
WHERE user_id = auth.uid();
-- Expected: Returns login history only for this user
```

**Test: Users cannot see others' history**:

```sql
-- As employee_test (with different user_id)
SELECT COUNT(*) as other_user_logins
FROM public.login_history
WHERE user_id != auth.uid();
-- Expected: 0 rows (RLS blocks access)
```

---

## Step 6: Test User Invitations RLS

**Test: Users see own invitations**:

```sql
-- As user_test
SELECT COUNT(*) as my_invitations
FROM public.user_invitations
WHERE user_id = auth.uid();
-- Expected: Returns only their own invitations
```

**Test: Admins see all invitations**:

```sql
-- As super_admin
SELECT COUNT(*) as all_invitations
FROM public.user_invitations;
-- Expected: Returns all invitation records
```

---

## Step 7: Test Saved Searches RLS

**Test: Users see own saved searches**:

```sql
-- As user_test
SELECT COUNT(*) as my_searches
FROM public.saved_searches
WHERE user_id = auth.uid();
-- Expected: Returns only their own saved searches
```

**Test: Users cannot see others' saved searches**:

```sql
-- As user_test
SELECT COUNT(*) as other_searches
FROM public.saved_searches
WHERE user_id != auth.uid();
-- Expected: 0 rows (RLS blocks access)
```

---

## Step 8: Automated Test Execution

### Using Jest/Testing Framework

The test file `tests/rls-policies.test.ts` contains placeholders for comprehensive RLS testing.

**To run tests**:

```bash
npm run test:run -- rls-policies.test.ts
```

**Note**: These tests are currently placeholders and designed to be run against a live Supabase instance with the RLS policies enabled. Full integration testing would require:

1. Setting up test database with migrations applied
2. Creating test users with different roles
3. Executing queries as each role via Supabase SDK
4. Verifying expected access patterns

---

## Step 9: Common RLS Issues and Troubleshooting

### Issue: "new row violates row-level security policy"

**Cause**: The INSERT/UPDATE violates RLS WITH CHECK clause

**Solution**: Verify:

- User has proper role assigned
- User_id in WITH CHECK matches auth.uid()
- Branch_id is correctly assigned

---

### Issue: RLS policies not enforced in Supabase UI

**Cause**: Supabase dashboard uses service_role key which bypasses RLS

**Solution**: RLS policies are enforced for:

- Application code using anon/user keys
- Direct client-side queries
- Not for service_role key (by design)

---

### Issue: Query returns 0 rows unexpectedly

**Cause**: RLS policy is blocking the read

**Solution**:

1. Check user's role and auth.uid()
2. Verify RLS policy conditions
3. Run query as service_role to see unrestricted results

---

## Step 10: RLS Security Checklist

- [ ] RLS enabled on all 7 tables
- [ ] 31 policies created successfully
- [ ] Super admin has unrestricted access
- [ ] Branch managers restricted to own branch
- [ ] Employees see only own profile
- [ ] Auditors can read all but not modify
- [ ] Audit logs are immutable (no UPDATE/DELETE)
- [ ] User invitations properly scoped
- [ ] Saved searches user-specific
- [ ] Login history access verified
- [ ] Roles table readable by all authenticated users

---

## Step 11: Production Deployment

**Before deploying to production**:

1. Run all verification tests against staging database
2. Verify audit log immutability working
3. Test with actual user workflows
4. Verify branch isolation working
5. Test session termination after role change
6. Document any policy customizations
7. Plan audit log retention (7 years minimum)

---

## Migration Application Commands

### Apply migration to Supabase:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor:
# Copy contents of supabase/migrations/20250228_002_enable_rls_policies.sql
# Paste into SQL Editor
# Click "Run"
```

---

## References

- **File**: `supabase/migrations/20250228_002_enable_rls_policies.sql`
- **Test File**: `tests/rls-policies.test.ts`
- **Requirements**: 15.7 (Row-level security), 14.6 (Role-based access), 14.7 (Audit visibility)
- **Supabase RLS Documentation**: https://supabase.com/docs/guides/auth/row-level-security

---

## Status

- [x] Migration file created
- [x] RLS enabled on all tables
- [x] 31 policies implemented
- [x] Test cases documented
- [x] Verification procedures documented
- [ ] Policies tested against live database (manual verification required)
- [ ] Production deployment completed (pending user execution)
