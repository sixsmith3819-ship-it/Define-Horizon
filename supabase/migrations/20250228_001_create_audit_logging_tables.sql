-- ============================================================================
-- AUDIT LOGGING TABLES FOR USER MANAGEMENT MODULE
-- ============================================================================

-- Create audit_log table for comprehensive action tracking
CREATE TABLE public.audit_log (
  audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  user_id_affected UUID REFERENCES public.profiles(user_id),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  before_state JSONB,
  after_state JSONB,
  description TEXT,
  ip_address INET,
  session_id VARCHAR(255),
  timestamp TIMESTAMP NOT NULL DEFAULT now(),
  
  -- Add constraint to only allow specific action types
  CHECK (action_type IN (
    'user_created', 'user_updated', 'user_deleted', 'user_status_changed',
    'role_assigned', 'role_revoked', 'permission_granted', 'permission_revoked',
    'password_reset', 'password_changed',
    'login_successful', 'login_failed', 'logout', 'session_terminated',
    'suspension_reason_updated'
  ))
);

-- Create indexes on audit_log for common query patterns
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_user_id_affected ON public.audit_log(user_id_affected);
CREATE INDEX idx_audit_log_admin_user_id ON public.audit_log(admin_user_id);
CREATE INDEX idx_audit_log_action_type ON public.audit_log(action_type);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);

-- Create login_history table for session and activity tracking
CREATE TABLE public.login_history (
  login_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  login_timestamp TIMESTAMP NOT NULL DEFAULT now(),
  logout_timestamp TIMESTAMP,
  ip_address INET,
  browser_user_agent TEXT,
  device_type VARCHAR(50),
  session_id VARCHAR(255) UNIQUE,
  login_status VARCHAR(20) DEFAULT 'success' CHECK (login_status IN ('success', 'failed')),
  failure_reason VARCHAR(255),
  session_duration_seconds INTEGER,
  location VARCHAR(255)
);

-- Create indexes on login_history
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_timestamp ON public.login_history(login_timestamp DESC);
CREATE INDEX idx_login_history_session_id ON public.login_history(session_id);
CREATE INDEX idx_login_history_user_timestamp ON public.login_history(user_id, login_timestamp DESC);

-- Create user_invitations table for onboarding workflow
CREATE TABLE public.user_invitations (
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_by_admin_id UUID NOT NULL REFERENCES public.profiles(user_id)
);

-- Create indexes on user_invitations
CREATE INDEX idx_user_invitations_user_id ON public.user_invitations(user_id);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);

-- Create saved_searches table for user filter persistence
CREATE TABLE public.saved_searches (
  saved_search_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  search_name VARCHAR(255) NOT NULL,
  search_criteria JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  last_used_at TIMESTAMP,
  UNIQUE(user_id, search_name)
);

-- Create indexes on saved_searches
CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_last_used ON public.saved_searches(user_id, last_used_at DESC);

-- ============================================================================
-- AUDIT LOGGING TABLES CREATION COMPLETE
-- ============================================================================
