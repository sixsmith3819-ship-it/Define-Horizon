# Creating Users with Roles in Define Horizon BMS

## Quick Start: Create Super Admin and Employee Users

You have 2 options to create users:

---

## Option 1: Via Supabase Dashboard (Easiest - Recommended)

### Step 1: Access Supabase Dashboard

1. Go to: https://app.supabase.com/projects
2. Select your project: **cwsqjlfnbgaznclcztrx**
3. Click **Authentication** → **Users** in the left sidebar

### Step 2: Create Super Admin User

1. Click **"Add user"** button (top right)
2. Fill in the form:
   ```
   Email: admin@definehorizon.com
   Password: YourSecurePassword123!
   ```
3. ✅ Check **"Auto confirm user"** (important!)
4. Click **"Create user"**
5. **Copy the User ID** that appears (looks like: `550e8400-e29b-41d4-a716-446655440000`)

### Step 3: Assign Super Admin Role to the User

1. Go to **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Paste this SQL (replace `USER_ID` with the actual ID you copied):

```sql
-- Insert profile for super admin
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  role,
  status
) VALUES (
  'USER_ID',  -- Replace with actual user ID
  'admin@definehorizon.com',
  'System Administrator',
  'super_admin',
  'active'
);
```

4. Click **"Run"** (or press Ctrl+Enter)
5. You should see: **Success. No rows returned**

### Step 4: Create Employee User

1. Go back to **Authentication** → **Users**
2. Click **"Add user"** again
3. Fill in the form:
   ```
   Email: employee@definehorizon.com
   Password: YourSecurePassword123!
   ```
4. ✅ Check **"Auto confirm user"**
5. Click **"Create user"**
6. **Copy the Employee User ID**

### Step 5: Assign Employee Role

1. Go back to **SQL Editor**
2. Click **"New query"**
3. Paste this SQL (replace `EMPLOYEE_USER_ID`):

```sql
-- Insert profile for employee
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  role,
  status
) VALUES (
  'EMPLOYEE_USER_ID',  -- Replace with actual employee user ID
  'employee@definehorizon.com',
  'John Employee',
  'employee',
  'active'
);
```

4. Click **"Run"**

---

## Option 2: Via SQL Editor Only (Faster for multiple users)

Go to **SQL Editor** and run this complete script:

```sql
-- Step 1: Create Super Admin in auth.users
-- Note: You'll need to set a password hash or use Supabase dashboard for this part
-- This is just the profile creation. Use Dashboard to create auth user first.

-- Step 2: After creating users via dashboard, get their IDs and insert profiles

-- For Super Admin (replace USER_ID with actual ID from auth.users)
INSERT INTO public.profiles (user_id, email, full_name, role, status, date_created)
VALUES (
  'YOUR_SUPER_ADMIN_USER_ID',
  'admin@definehorizon.com',
  'System Administrator',
  'super_admin',
  'active',
  now()
) ON CONFLICT (user_id) DO UPDATE 
SET role = 'super_admin', status = 'active';

-- For Employee (replace USER_ID with actual ID from auth.users)
INSERT INTO public.profiles (user_id, email, full_name, role, status, date_created)
VALUES (
  'YOUR_EMPLOYEE_USER_ID',
  'employee@definehorizon.com',
  'John Employee',
  'employee',
  'active',
  now()
) ON CONFLICT (user_id) DO UPDATE 
SET role = 'employee', status = 'active';

-- Verify the users were created correctly
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  r.role_name
FROM profiles p
LEFT JOIN roles r ON r.role_name = p.role
ORDER BY p.role;
```

---

## Step 6: Test Your Users

### Test Super Admin Login:
1. Go to: http://localhost:3000
2. You'll be redirected to login page
3. Login with:
   - **Email**: admin@definehorizon.com
   - **Password**: (the password you set)
4. ✅ You should see:
   - Full sidebar menu (Dashboard, Customers, Transactions, Inventory, Announcements, Reports, Audit Logs, Users, Branches)
   - Dashboard with metrics
   - "New Announcement" button on announcements page

### Test Employee Login:
1. Sign out (top right button)
2. Login with:
   - **Email**: employee@definehorizon.com
   - **Password**: (the password you set)
3. ✅ You should see:
   - Limited sidebar menu (Dashboard, Customers, Transactions, Announcements)
   - Dashboard with announcements and transactions (NO metrics)
   - NO "New Announcement" button on announcements page
   - NO archive/delete buttons on announcements

---

## Troubleshooting

### Issue: "User not found" error when logging in
**Solution**: Make sure you created the profile record in the `profiles` table with the correct `user_id`

### Issue: User can login but has wrong role
**Solution**: Check the profile role:
```sql
SELECT user_id, email, role FROM profiles WHERE email = 'your-email@example.com';
```

Update the role if needed:
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@definehorizon.com';
UPDATE profiles SET role = 'employee' WHERE email = 'employee@definehorizon.com';
```

### Issue: JWT token doesn't have role information
**Solution**: The role is stored in the `profiles` table and fetched by decoding the JWT `user_id`. Make sure:
1. The user exists in `auth.users`
2. A matching profile exists in `profiles` table with the same `user_id`
3. The profile has a valid `role` value: `'super_admin'`, `'employee'`, `'branch_manager'`, or `'auditor'`

---

## Available Roles

| Role | Access Level |
|------|-------------|
| **super_admin** | Full system access - all features |
| **employee** | Limited access - transactions, customers (view), announcements (view) |
| **branch_manager** | Branch-level access (not fully implemented yet) |
| **auditor** | Read-only access to audit logs (not fully implemented yet) |

---

## Quick Reference: User Creation Checklist

- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Click "Add user"
- [ ] Enter email and password
- [ ] ✅ Check "Auto confirm user"
- [ ] Copy the generated User ID
- [ ] Go to SQL Editor
- [ ] Run INSERT INTO profiles with the User ID and role
- [ ] Test login with the credentials
- [ ] Verify correct role permissions in the app

---

## Security Notes

⚠️ **Important**:
- Use strong passwords for all users
- Super admin accounts should use unique, complex passwords
- Store passwords securely (use a password manager)
- Never commit passwords to git
- Change default passwords immediately after first login
- Consider enabling 2FA for super admin accounts (future feature)

---

Ready to create your users! 🚀