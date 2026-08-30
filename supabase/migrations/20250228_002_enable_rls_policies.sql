-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR USER MANAGEMENT MODULE
-- ============================================================================

-- Enable RLS on all user-related tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Policy 1: Super admin can see all profiles
CREATE POLICY "super_admin_all_profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
);

-- Policy 2: Branch manager can see profiles in their branch only
CREATE POLICY "branch_manager_own_branch_profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT role_id FROM public.profiles WHERE user_id = auth.uid()) = 
  (SELECT role_id FROM public.roles WHERE role_name = 'branch_manager')
  AND
  branch_id = (SELECT branch_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Policy 3: Employee can see their own profile
CREATE POLICY "employee_own_profile"
ON public.profiles
FOR SELECT
USING (
  (SELECT role_id FROM public.profiles WHERE user_id = auth.uid()) = 
  (SELECT role_id FROM public.roles WHERE role_name = 'employee')
  AND
  user_id = auth.uid()
);

-- Policy 4: Auditor (viewer) can see all profiles (read-only)
CREATE POLICY "auditor_all_profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT role_id FROM public.profiles WHERE user_id = auth.uid()) = 
  (SELECT role_id FROM public.roles WHERE role_name = 'auditor')
);

-- Policy 5: Admin can create profiles
CREATE POLICY "admin_create_profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
);

-- Policy 6: Admin can update any profile, managers can update own branch users, users can update themselves
CREATE POLICY "admin_update_profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
  OR
  (
    (SELECT role_id FROM public.profiles WHERE user_id = auth.uid()) = 
    (SELECT role_id FROM public.roles WHERE role_name = 'branch_manager')
    AND
    branch_id = (SELECT branch_id FROM public.profiles WHERE user_id = auth.uid())
  )
  OR
  user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
  OR
  (
    (SELECT role_id FROM public.profiles WHERE user_id = auth.uid()) = 
    (SELECT role_id FROM public.roles WHERE role_name = 'branch_manager')
    AND
    branch_id = (SELECT branch_id FROM public.profiles WHERE user_id = auth.uid())
  )
  OR
  user_id = auth.uid()
);

-- ============================================================================
-- ROLES TABLE RLS POLICIES
-- ============================================================================

-- Policy: All authenticated users can read roles
CREATE POLICY "authenticated_read_roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- BRANCHES TABLE RLS POLICIES
-- ============================================================================

-- Policy: Super admin sees all branches, others see their own
CREATE POLICY "branch_visibility"
ON public.branches
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
  OR
  branch_id IN (SELECT branch_id FROM public.profiles WHERE user_id = auth.uid())
);

-- ============================================================================
-- LOGIN_HISTORY TABLE RLS POLICIES
-- ============================================================================

-- Policy: Users can see their own login history
CREATE POLICY "user_own_login_history"
ON public.login_history
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admin can see all login history
CREATE POLICY "admin_all_login_history"
ON public.login_history
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
);

-- Policy: Only system can insert login events
CREATE POLICY "system_insert_login_history"
ON public.login_history
FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- AUDIT_LOG TABLE RLS POLICIES
-- ============================================================================

-- Policy: Auditors can see all audit logs
CREATE POLICY "auditor_all_audit_logs"
ON public.audit_log
FOR SELECT
USING (
  (SELECT role_id FROM public.profiles WHERE user_id = auth.uid()) = 
  (SELECT role_id FROM public.roles WHERE role_name = 'auditor')
);

-- Policy: Super admin can see all audit logs
CREATE POLICY "admin_all_audit_logs"
ON public.audit_log
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
);

-- Policy: Other users can only see their own audit events
CREATE POLICY "user_own_audit_events"
ON public.audit_log
FOR SELECT
USING (
  user_id_affected = auth.uid() 
  OR 
  admin_user_id = auth.uid()
);

-- Policy: Only admins can insert audit events
CREATE POLICY "admin_insert_audit_log"
ON public.audit_log
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
);

-- Policy: Prevent audit log modification (immutable)
CREATE POLICY "audit_log_immutable"
ON public.audit_log
FOR UPDATE
USING (false);

CREATE POLICY "audit_log_no_delete"
ON public.audit_log
FOR DELETE
USING (false);

-- ============================================================================
-- USER_INVITATIONS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Users can see their own invitations
CREATE POLICY "user_own_invitations"
ON public.user_invitations
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admin can see all invitations
CREATE POLICY "admin_all_invitations"
ON public.user_invitations
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
);

-- Policy: Only admins can create invitations
CREATE POLICY "admin_create_invitations"
ON public.user_invitations
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role_id = (SELECT role_id FROM public.roles WHERE role_name = 'super_admin')
  )
);

-- Policy: Users can update their own invitations (accept), admins can update any
CREATE POLICY "user_update_own_invitations"
ON public.user_invitations
FOR UPDATE
USING (user_id = auth.uid() OR admin_user_id = auth.uid())
WITH CHECK (user_id = auth.uid() OR admin_user_id = auth.uid());

-- ============================================================================
-- SAVED_SEARCHES TABLE RLS POLICIES
-- ============================================================================

-- Policy: Users can see their own saved searches
CREATE POLICY "user_own_saved_searches"
ON public.saved_searches
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can create their own saved searches
CREATE POLICY "user_create_own_saved_searches"
ON public.saved_searches
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own saved searches
CREATE POLICY "user_update_own_saved_searches"
ON public.saved_searches
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own saved searches
CREATE POLICY "user_delete_own_saved_searches"
ON public.saved_searches
FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES COMPLETE
-- ============================================================================
