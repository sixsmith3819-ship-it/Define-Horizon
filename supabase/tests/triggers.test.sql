-- ============================================================================
-- TRIGGER TESTING SUITE FOR AUDIT LOGGING
-- ============================================================================
-- This SQL script tests all triggers to ensure they capture changes correctly
-- Run this manually against the database to verify trigger functionality

-- Test 1: Profile INSERT trigger
-- Expected: Should create audit_log entry with action_type='user_created'
BEGIN;
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  phone_number,
  role_id,
  branch_id
) VALUES (
  gen_random_uuid(),
  'testuser1@example.com',
  'Test User 1',
  '+263712345678',
  (SELECT role_id FROM public.roles WHERE role_name = 'employee' LIMIT 1),
  (SELECT branch_id FROM public.branches WHERE is_active = true LIMIT 1)
);
ROLLBACK;
-- Query to verify: SELECT * FROM public.audit_log WHERE action_type = 'user_created' ORDER BY timestamp DESC LIMIT 1;

-- Test 2: Profile UPDATE trigger
-- Expected: Should create audit_log entry with action_type='user_updated' and both before_state and after_state
BEGIN;
WITH test_user AS (
  SELECT user_id, full_name, email FROM public.profiles LIMIT 1
)
UPDATE public.profiles 
SET full_name = 'Updated Name'
WHERE user_id = (SELECT user_id FROM test_user);
ROLLBACK;
-- Query to verify: SELECT * FROM public.audit_log WHERE action_type = 'user_updated' ORDER BY timestamp DESC LIMIT 1;

-- Test 3: Profile DELETE trigger
-- Expected: Should create audit_log entry with action_type='user_deleted' and before_state populated
BEGIN;
DELETE FROM public.profiles 
WHERE email = 'testdelete@example.com';
ROLLBACK;
-- Query to verify: SELECT * FROM public.audit_log WHERE action_type = 'user_deleted' ORDER BY timestamp DESC LIMIT 1;

-- Test 4: Branch INSERT trigger
-- Expected: Should create audit_log entry with action_type='branch_created'
BEGIN;
INSERT INTO public.branches (
  branch_name,
  branch_code,
  address
) VALUES (
  'Test Branch',
  'TST001',
  '123 Test Street'
);
ROLLBACK;
-- Query to verify: SELECT * FROM public.audit_log WHERE action_type = 'branch_created' ORDER BY timestamp DESC LIMIT 1;

-- Test 5: Branch UPDATE trigger
-- Expected: Should create audit_log entry with action_type='branch_updated'
BEGIN;
WITH test_branch AS (
  SELECT branch_id FROM public.branches WHERE is_active = true LIMIT 1
)
UPDATE public.branches
SET address = 'Updated Address'
WHERE branch_id = (SELECT branch_id FROM test_branch);
ROLLBACK;
-- Query to verify: SELECT * FROM public.audit_log WHERE action_type = 'branch_updated' ORDER BY timestamp DESC LIMIT 1;

-- Test 6: Audit Log immutability - UPDATE prevention
-- Expected: Should fail with error "Audit log records are immutable and cannot be updated"
BEGIN;
UPDATE public.audit_log
SET description = 'HACKED!'
WHERE audit_log_id = (SELECT audit_log_id FROM public.audit_log LIMIT 1);
ROLLBACK;
-- This should have raised an exception

-- Test 7: Audit Log immutability - DELETE prevention
-- Expected: Should fail with error "Audit log records are immutable and cannot be deleted"
BEGIN;
DELETE FROM public.audit_log
WHERE audit_log_id = (SELECT audit_log_id FROM public.audit_log LIMIT 1);
ROLLBACK;
-- This should have raised an exception

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View all triggers in the public schema
-- SELECT trigger_name, event_object_table, event_manipulation, action_timing
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' 
-- ORDER BY event_object_table, trigger_name;

-- Expected triggers:
-- trg_audit_profile_insert - AFTER INSERT on profiles
-- trg_audit_profile_update - AFTER UPDATE on profiles
-- trg_audit_profile_delete - AFTER DELETE on profiles
-- trg_audit_branch_insert - AFTER INSERT on branches
-- trg_audit_branch_update - AFTER UPDATE on branches
-- trg_prevent_audit_log_update - BEFORE UPDATE on audit_log
-- trg_prevent_audit_log_delete - BEFORE DELETE on audit_log

-- View audit log entries
-- SELECT audit_log_id, action_type, resource_type, description, timestamp 
-- FROM public.audit_log 
-- ORDER BY timestamp DESC 
-- LIMIT 20;

-- ============================================================================
-- END OF TRIGGER TESTS
-- ============================================================================
