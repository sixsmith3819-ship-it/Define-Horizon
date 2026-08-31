-- STEP 1: First, let's see what columns your roles table actually has
SELECT column_name FROM information_schema.columns WHERE table_name = 'roles';

-- STEP 2: See what data is in your roles table
SELECT * FROM roles;

-- STEP 3: Once you know the column names, update this query:
-- If roles table has "name" column (not role_name):
UPDATE profiles 
SET role_id = (SELECT role_id FROM roles WHERE name = 'super_admin')
WHERE email = 'admin@gmail.com';

-- OR if it has "role" column:
UPDATE profiles 
SET role_id = (SELECT role_id FROM roles WHERE role = 'super_admin')
WHERE email = 'admin@gmail.com';

-- OR if you just see the role_id values directly from STEP 2, use it directly:
-- UPDATE profiles 
-- SET role_id = 'PASTE-THE-ACTUAL-SUPER-ADMIN-ROLE-ID-HERE'
-- WHERE email = 'admin@gmail.com';

-- STEP 4: Verify it worked
SELECT p.email, p.full_name, p.role_id, r.*
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.role_id
WHERE p.email = 'admin@gmail.com';