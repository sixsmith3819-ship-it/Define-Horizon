-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES FOR USER MANAGEMENT MODULE
-- ============================================================================

-- Create roles table
CREATE TABLE public.roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT true,
  date_created TIMESTAMP DEFAULT now(),
  date_modified TIMESTAMP DEFAULT now()
);

-- Create index on role_name for quick lookups
CREATE INDEX idx_roles_name ON public.roles(role_name);

-- Insert system roles
INSERT INTO public.roles (role_name, description, is_system_role) VALUES
  ('super_admin', 'System Administrator with full access', true),
  ('branch_manager', 'Branch Manager with branch-scoped access', true),
  ('employee', 'Employee with operational access', true),
  ('auditor', 'Read-only access for auditing', true)
ON CONFLICT (role_name) DO NOTHING;

-- Create branches table
CREATE TABLE public.branches (
  branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_name VARCHAR(255) NOT NULL,
  branch_code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone_number VARCHAR(20),
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  date_created TIMESTAMP DEFAULT now(),
  date_modified TIMESTAMP DEFAULT now()
);

-- Create indexes on branches table
CREATE INDEX idx_branches_is_active ON public.branches(is_active);
CREATE INDEX idx_branches_code ON public.branches(branch_code);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  profile_picture_url TEXT,
  role_id UUID NOT NULL REFERENCES public.roles ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  suspension_reason VARCHAR(255),
  suspension_date TIMESTAMP,
  suspension_notes TEXT,
  force_password_change BOOLEAN DEFAULT false,
  password_last_changed TIMESTAMP,
  version_number INTEGER DEFAULT 1,
  last_activity_timestamp TIMESTAMP,
  last_login_timestamp TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  date_created TIMESTAMP DEFAULT now(),
  date_modified TIMESTAMP DEFAULT now(),
  created_by_admin_id UUID REFERENCES public.profiles(user_id),
  modified_by_admin_id UUID REFERENCES public.profiles(user_id)
);

-- Create indexes on profiles table for common query patterns
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_date_created ON public.profiles(date_created DESC);
CREATE INDEX idx_profiles_branch_status ON public.profiles(branch_id, status);
CREATE INDEX idx_profiles_role_status ON public.profiles(role_id, status);

-- Add foreign key for branches.manager_id
ALTER TABLE public.branches 
ADD CONSTRAINT fk_branches_manager 
FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================
