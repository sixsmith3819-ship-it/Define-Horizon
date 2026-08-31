-- Check existing roles in the database
SELECT id, name FROM roles ORDER BY name;

-- Check existing users with their roles
SELECT 
  p.email,
  p.full_name,
  r.name as role_name,
  p.is_active
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
ORDER BY p.email;
