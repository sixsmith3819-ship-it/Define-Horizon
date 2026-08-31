-- Add missing columns to announcements table
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS visibility_type TEXT DEFAULT 'company_wide',
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;