-- ============================================================================
-- AUDIT LOGGING TRIGGERS FOR USER MANAGEMENT MODULE
-- ============================================================================

-- Function to capture user info from JWT claims
CREATE OR REPLACE FUNCTION public.get_current_admin_user_id()
RETURNS UUID AS $$
  SELECT auth.uid()::UUID;
$$ LANGUAGE sql STABLE;

-- Function to get IP address (stored in request headers by Supabase)
CREATE OR REPLACE FUNCTION public.get_ip_address()
RETURNS INET AS $$
BEGIN
  RETURN inet(current_setting('request.headers', true)::json->>'x-forwarded-for');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL::INET;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PROFILES TABLE TRIGGERS
-- ============================================================================

-- Trigger function for profile creation logging
CREATE OR REPLACE FUNCTION public.audit_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    action_type,
    resource_type,
    resource_id,
    user_id_affected,
    admin_user_id,
    before_state,
    after_state,
    description,
    ip_address,
    timestamp
  ) VALUES (
    'user_created',
    'profile',
    NEW.user_id,
    NEW.user_id,
    public.get_current_admin_user_id(),
    NULL,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'email', NEW.email,
      'full_name', NEW.full_name,
      'phone_number', NEW.phone_number,
      'role_id', NEW.role_id,
      'branch_id', NEW.branch_id,
      'status', NEW.status,
      'is_active', NEW.is_active,
      'date_created', NEW.date_created
    ),
    format('User %s created with email %s', NEW.full_name, NEW.email),
    public.get_ip_address(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation
CREATE TRIGGER trg_audit_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profile_insert();

-- Trigger function for profile update logging
CREATE OR REPLACE FUNCTION public.audit_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if something actually changed
  IF NEW IS DISTINCT FROM OLD THEN
    INSERT INTO public.audit_log (
      action_type,
      resource_type,
      resource_id,
      user_id_affected,
      admin_user_id,
      before_state,
      after_state,
      description,
      ip_address,
      timestamp
    ) VALUES (
      'user_updated',
      'profile',
      NEW.user_id,
      NEW.user_id,
      public.get_current_admin_user_id(),
      jsonb_build_object(
        'email', OLD.email,
        'full_name', OLD.full_name,
        'phone_number', OLD.phone_number,
        'role_id', OLD.role_id,
        'branch_id', OLD.branch_id,
        'status', OLD.status,
        'is_active', OLD.is_active,
        'suspension_reason', OLD.suspension_reason
      ),
      jsonb_build_object(
        'email', NEW.email,
        'full_name', NEW.full_name,
        'phone_number', NEW.phone_number,
        'role_id', NEW.role_id,
        'branch_id', NEW.branch_id,
        'status', NEW.status,
        'is_active', NEW.is_active,
        'suspension_reason', NEW.suspension_reason
      ),
      format('User %s updated', NEW.email),
      public.get_ip_address(),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile updates
CREATE TRIGGER trg_audit_profile_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profile_update();

-- Trigger function for profile deletion logging
CREATE OR REPLACE FUNCTION public.audit_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    action_type,
    resource_type,
    resource_id,
    user_id_affected,
    admin_user_id,
    before_state,
    after_state,
    description,
    ip_address,
    timestamp
  ) VALUES (
    'user_deleted',
    'profile',
    OLD.user_id,
    OLD.user_id,
    public.get_current_admin_user_id(),
    jsonb_build_object(
      'user_id', OLD.user_id,
      'email', OLD.email,
      'full_name', OLD.full_name,
      'role_id', OLD.role_id,
      'branch_id', OLD.branch_id,
      'status', OLD.status,
      'is_active', OLD.is_active
    ),
    NULL,
    format('User %s deleted', OLD.email),
    public.get_ip_address(),
    now()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile deletions
CREATE TRIGGER trg_audit_profile_delete
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profile_delete();

-- ============================================================================
-- BRANCHES TABLE TRIGGERS
-- ============================================================================

-- Trigger function for branch creation logging
CREATE OR REPLACE FUNCTION public.audit_branch_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    action_type,
    resource_type,
    resource_id,
    admin_user_id,
    before_state,
    after_state,
    description,
    ip_address,
    timestamp
  ) VALUES (
    'branch_created',
    'branch',
    NEW.branch_id,
    public.get_current_admin_user_id(),
    NULL,
    jsonb_build_object(
      'branch_id', NEW.branch_id,
      'branch_name', NEW.branch_name,
      'branch_code', NEW.branch_code,
      'address', NEW.address,
      'is_active', NEW.is_active
    ),
    format('Branch %s created with code %s', NEW.branch_name, NEW.branch_code),
    public.get_ip_address(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for branch creation
CREATE TRIGGER trg_audit_branch_insert
AFTER INSERT ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.audit_branch_insert();

-- Trigger function for branch update logging
CREATE OR REPLACE FUNCTION public.audit_branch_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD THEN
    INSERT INTO public.audit_log (
      action_type,
      resource_type,
      resource_id,
      admin_user_id,
      before_state,
      after_state,
      description,
      ip_address,
      timestamp
    ) VALUES (
      'branch_updated',
      'branch',
      NEW.branch_id,
      public.get_current_admin_user_id(),
      jsonb_build_object(
        'branch_name', OLD.branch_name,
        'branch_code', OLD.branch_code,
        'address', OLD.address,
        'manager_id', OLD.manager_id,
        'is_active', OLD.is_active
      ),
      jsonb_build_object(
        'branch_name', NEW.branch_name,
        'branch_code', NEW.branch_code,
        'address', NEW.address,
        'manager_id', NEW.manager_id,
        'is_active', NEW.is_active
      ),
      format('Branch %s updated', NEW.branch_name),
      public.get_ip_address(),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for branch updates
CREATE TRIGGER trg_audit_branch_update
AFTER UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.audit_branch_update();

-- ============================================================================
-- AUDIT_LOG IMMUTABILITY TRIGGERS (prevent accidental updates to audit log)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log records are immutable and cannot be updated';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_log_update
BEFORE UPDATE ON public.audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_update();

CREATE OR REPLACE FUNCTION public.prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log records are immutable and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_log_delete
BEFORE DELETE ON public.audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_delete();

-- ============================================================================
-- HELPER FUNCTION FOR ADMIN OPERATIONS
-- ============================================================================

-- Function to log admin actions (called from application)
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_user_id_affected UUID,
  p_before_state JSONB,
  p_after_state JSONB,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    action_type,
    resource_type,
    resource_id,
    user_id_affected,
    admin_user_id,
    before_state,
    after_state,
    description,
    ip_address,
    timestamp
  ) VALUES (
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_user_id_affected,
    public.get_current_admin_user_id(),
    p_before_state,
    p_after_state,
    p_description,
    public.get_ip_address(),
    now()
  )
  RETURNING audit_log_id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING TRIGGERS COMPLETE
-- ============================================================================
