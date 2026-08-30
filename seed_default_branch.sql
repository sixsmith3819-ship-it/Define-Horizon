-- Seed default branch for Define Horizon BMS
-- Run this in Supabase SQL editor to create the headquarters branch

INSERT INTO public.branches (branch_name, branch_code, address, phone_number, is_active)
VALUES (
  'Headquarters',
  'HQ',
  'Harare, Zimbabwe',
  '+263712345678',
  true
)
ON CONFLICT (branch_code) DO NOTHING;