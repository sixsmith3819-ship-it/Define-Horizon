-- First, verify your admin profile exists
SELECT 
  p.id,
  p.email,
  p.full_name,
  r.name as role,
  b.name as branch
FROM public.profiles p
LEFT JOIN public.roles r ON p.role_id = r.id
LEFT JOIN public.branches b ON p.branch_id = b.id;
