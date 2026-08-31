# CORRECTED: User Creation SQL for Your Database Structure

## Your Current Database Structure

Based on your data, your `profiles` table has:
- `id` - auto-generated UUID (primary key from existing data)
- `user_id` - should link to auth.users (but might be using `id` instead)
- `email`
- `full_name`
- `phone_number`
- `role_id` - UUID foreign key to roles table
- `branch_id` - UUID foreign key to branches table
- `is_active`
- `created_at`
- `updated_at`

---

## Step 1: Get the Role IDs First

Run this query to see available roles:

```sql
SELECT role_id, role_name, description 
FROM roles 
WHERE role_name IN ('super_admin', 'employee');
```

You should see something like:
```
role_id                               | role_name    | description
--------------------------------------|--------------|------------------
c4d86bab-8c51-417e-aed3-5eee51403dfa | super_admin  | System Administrator...
[another-uuid]                        | employee     | Employee with operational...
```

**Copy these role_id values!**

---

## Step 2: Get Branch IDs

Run this to see available branches:

```sql
SELECT branch_id, branch_name 
FROM branches 
LIMIT 5;
```

**Copy a branch_id** (or use the one from your existing profile: `818d4406-dab0-44cd-8f30-6f3a7d24ed37`)

---

## Step 3: Create Users in Supabase Auth

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **"Add user"**

### Create Super Admin:
- Email: `superadmin@definehorizon.com`
- Password: Your secure password
- ✅ Check "Auto confirm user"
- Click "Create user"
- **COPY THE USER ID** (this is critical!)

### Create Employee:
- Email: `employee@definehorizon.com`
- Password: Your secure password
- ✅ Check "Auto confirm user"
- **COPY THE USER ID**

---

## Step 4: Insert Profiles with Correct Column Names

### For Super Admin:

```sql
-- Replace the UUIDs with your actual values:
-- SUPER_ADMIN_USER_ID: from Step 3
-- SUPER_ADMIN_ROLE_ID: from Step 1 (the role_id where role_name = 'super_admin')
-- BRANCH_ID: from Step 2

INSERT INTO profiles (
  user_id,
  email,
  full_name,
  phone_number,
  role_id,
  branch_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'SUPER_ADMIN_USER_ID',  -- Replace with actual auth.users ID
  'superadmin@definehorizon.com',
  'Super Administrator',
  '+263777000000',
  'SUPER_ADMIN_ROLE_ID',  -- Replace with actual super_admin role_id
  'BRANCH_ID',            -- Replace with actual branch_id
  true,
  now(),
  now()
);
```

### For Employee:

```sql
-- Replace the UUIDs with your actual values:
-- EMPLOYEE_USER_ID: from Step 3
-- EMPLOYEE_ROLE_ID: from Step 1 (the role_id where role_name = 'employee')
-- BRANCH_ID: from Step 2

INSERT INTO profiles (
  user_id,
  email,
  full_name,
  phone_number,
  role_id,
  branch_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'EMPLOYEE_USER_ID',     -- Replace with actual auth.users ID
  'employee@definehorizon.com',
  'John Employee',
  '+263777000001',
  'EMPLOYEE_ROLE_ID',     -- Replace with actual employee role_id
  'BRANCH_ID',            -- Replace with actual branch_id
  true,
  now(),
  now()
);
```

---

## Step 5: Update Existing Admin User

I see you already have an admin user with email `admin@gmail.com`. To give them super_admin role:

```sql
-- First, get the super_admin role_id
SELECT role_id FROM roles WHERE role_name = 'super_admin';

-- Then update the existing profile (replace SUPER_ADMIN_ROLE_ID)
UPDATE profiles 
SET role_id = 'SUPER_ADMIN_ROLE_ID'  -- Use the role_id from above query
WHERE email = 'admin@gmail.com';
```

---

## Quick All-in-One Script (After Getting IDs)

Once you have the role IDs and branch ID, use this:

```sql
-- Step 1: Get the role IDs (copy the results)
SELECT role_id, role_name FROM roles WHERE role_name IN ('super_admin', 'employee');

-- Step 2: Update your existing admin@gmail.com to super_admin role
UPDATE profiles 
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'super_admin')
WHERE email = 'admin@gmail.com';

-- Step 3: Verify it worked
SELECT 
  p.email,
  p.full_name,
  r.role_name,
  p.is_active
FROM profiles p
JOIN roles r ON p.role_id = r.role_id
WHERE p.email = 'admin@gmail.com';
```

---

## Verification Query

After creating/updating users, verify they have the correct roles:

```sql
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  r.role_name,
  b.branch_name,
  p.is_active
FROM profiles p
JOIN roles r ON p.role_id = r.role_id
JOIN branches b ON p.branch_id = b.branch_id
ORDER BY r.role_name;
```

---

## Important Note About JWT Tokens

Your app currently reads the role from JWT token using:
```javascript
const role = payload.user_metadata?.role || payload.role || 'employee';
```

But your database stores `role_id` (UUID), not the role name. You need to:

**Option 1: Update the JWT to include role name** (recommended)
This requires a database function/trigger to add role_name to user metadata.

**Option 2: Update your app to fetch role from profiles table** (easier for now)
Modify the API to join with roles table and include role_name.

For now, try logging in with `admin@gmail.com` and see what happens. If the role detection doesn't work, we'll need to fix the JWT token issue.

---

## Summary of What You Need

1. ✅ Super admin role_id (UUID from roles table)
2. ✅ Employee role_id (UUID from roles table)  
3. ✅ Branch_id (UUID from branches table)
4. ✅ User IDs from auth.users (created via Supabase dashboard)
5. ✅ Run INSERT statements with those UUIDs

Let me know which step you're stuck on and I'll help!