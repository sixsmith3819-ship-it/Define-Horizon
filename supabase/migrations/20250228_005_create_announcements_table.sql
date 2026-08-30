-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  visibility_type text NOT NULL DEFAULT 'everyone' CHECK (visibility_type IN ('everyone', 'branches', 'roles')),
  visibility_branches uuid[] DEFAULT ARRAY[]::uuid[],
  visibility_roles text[] DEFAULT ARRAY[]::text[],
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  expiry_date timestamptz,
  view_count integer DEFAULT 0,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for authenticated users" ON public.announcements
  FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable insert for admins" ON public.announcements
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for admins" ON public.announcements
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Enable delete for admins" ON public.announcements
  FOR DELETE USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX idx_announcements_status ON public.announcements(status);
CREATE INDEX idx_announcements_priority ON public.announcements(priority);
CREATE INDEX idx_announcements_created_at ON public.announcements(created_at DESC);
