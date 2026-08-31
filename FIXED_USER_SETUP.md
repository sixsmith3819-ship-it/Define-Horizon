# FIXED: User Role Update for Your Actual Database

## Your Actual Profile Table Structure

Based on your data, your `profiles` table has:
- **id** - UUID primary key (NOT user_id)
- email
- full_name
- phone_number
- role_id - UUID foreign key to roles table
- branch_id - UUID foreign key to branches table
- is_active - boolean
- created_at - timestamp
- updated_at - timestamp

## Quick Fix: Update Existing User to Super Admin

Since you already have `admin@gmail.com` in the database, just run this:

```sql
-- Update your existing admin user to super_admin role
UPDATE profiles 
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'super_admin')
WHERE email = 'admin@gmail.com';

-- Verify it worked
SELECT 
  p.email,
  p.full_name,
  r.role_name,
  p.is_active
FROM profiles p
JOIN roles r ON p.role_id = r.role_id
WHERE p.email = 'admin@gmail.com';
```

That's it! ✅

## If You Need to Create a New User

### Step 1: Create user in Supabase Auth Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Email: `employee@definehorizon.com`
4. Password: Your secure password
5. ✅ Check "Auto confirm user"
6. **Note down the user ID** (but we won't use it for the profile)

### Step 2: Get the role_id for employee
```sql
SELECT role_id, role_name FROM roles WHERE role_name = 'employee';
```
Copy the `role_id` value.

### Step 3: Get a branch_id
```sql
SELECT branch_id, branch_name FROM branches LIMIT 1;
```
Copy the `branch_id` value (or use `818d4406-dab0-44cd-8f30-6f3a7d24ed37` from your existing profile).

### Step 4: Create the profile record
```sql
-- Replace EMPLOYEE_ROLE_ID with the role_id from Step 2
-- Replace BRANCH_ID with the branch_id from Step 3
INSERT INTO profiles (
  email,
  full_name,
  phone_number,
  role_id,
  branch_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'employee@definehorizon.com',
  'John Employee',
  '+263777000001',
  'EMPLOYEE_ROLE_ID',  -- Replace this
  'BRANCH_ID',         -- Replace this
  true,
  now(),
  now()
);
```

## Important: The App Code Needs Fixing Too!

The API endpoint `/api/auth/me` is trying to query by `user_id` but your table uses `id`. Let me fix that now...