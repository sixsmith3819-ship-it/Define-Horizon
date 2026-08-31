# Role-Based Access Control - Database Implementation Summary

## What Was Fixed

Previously, the app tried to read user roles from JWT metadata, but your database stores roles as foreign keys (`role_id`) in the `profiles` table. This caused role detection to fail.

## New Architecture

### 1. API Endpoint: `/api/auth/me`
- Fetches user profile from database
- Joins with `roles` table to get `role_name`
- Returns complete user profile including role

### 2. Custom Hook: `useUserRole()`
Location: `lib/hooks/useUserRole.ts`

```typescript
const { 
  userRole,        // 'super_admin' | 'employee' | 'branch_manager' | 'auditor'
  userProfile,     // Full profile object
  isSuperAdmin,    // Boolean helper
  isEmployee,      // Boolean helper
  loading,         // Loading state
  error           // Error state
} = useUserRole();
```

### 3. Updated Components
- ✅ `app/(dashboard)/announcements/page.tsx` - Uses hook
- ✅ `app/(dashboard)/page.tsx` - Uses hook
- ✅ `components/layout/sidebar.tsx` - Uses hook

## How It Works

1. User logs in → gets `access_token` stored in `localStorage`
2. Component calls `useUserRole()` hook
3. Hook calls `GET /api/auth/me` with Bearer token
4. API decodes JWT to get `user_id`
5. API queries database:
   ```sql
   SELECT 
     p.*,
     r.role_name,
     r.role_id,
     r.description
   FROM profiles p
   JOIN roles r ON p.role_id = r.role_id
   WHERE p.user_id = 'user-id-from-jwt'
   ```
6. Returns role_name to component
7. Component shows/hides features based on role

## Setting Up Users (Required)

### Step 1: Create Auth User
Go to Supabase Dashboard → Authentication → Users → Add user

### Step 2: Get Role IDs
```sql
SELECT role_id, role_name FROM roles 
WHERE role_name IN ('super_admin', 'employee');
```

### Step 3: Create Profile
```sql
INSERT INTO profiles (
  user_id,      -- From auth.users
  email,
  full_name,
  role_id,      -- From roles table
  branch_id,    -- From branches table
  is_active
) VALUES (
  'user-id-here',
  'email@example.com',
  'Full Name',
  'role-id-here',
  'branch-id-here',
  true
);
```

### Or Update Existing User
```sql
-- Make existing admin@gmail.com a super_admin
UPDATE profiles 
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'super_admin')
WHERE email = 'admin@gmail.com';
```

## Testing

1. **Update your existing user to super_admin:**
   ```sql
   UPDATE profiles 
   SET role_id = (SELECT role_id FROM roles WHERE role_name = 'super_admin')
   WHERE email = 'admin@gmail.com';
   ```

2. **Login with `admin@gmail.com`**

3. **Check browser console:**
   - Should see successful `/api/auth/me` call
   - Should see all menu items (Dashboard, Customers, Transactions, Inventory, Announcements, Reports, Audit Logs, Users, Branches)

4. **Create an employee user:**
   - Add user in Supabase Auth
   - Create profile with `employee` role_id
   - Login and verify limited menu

## Role Permissions Recap

### Super Admin
- ✅ Full access to all features
- ✅ Can create/edit/delete announcements
- ✅ Sees all menu items
- ✅ Dashboard shows metrics

### Employee
- ✅ View/create transactions
- ✅ View customers (to create transactions)
- ✅ View announcements (read-only)
- ✅ Dashboard shows announcements and transaction history
- ❌ No metrics
- ❌ No create/edit/delete announcements
- ❌ No access to inventory, reports, audit logs, users, branches

## Troubleshooting

### "Failed to fetch user profile"
- Check that user has a profile in `profiles` table
- Verify `user_id` matches between `auth.users` and `profiles`

### User has wrong role
```sql
-- Check current role
SELECT p.email, r.role_name 
FROM profiles p
JOIN roles r ON p.role_id = r.role_id
WHERE p.email = 'your-email@example.com';

-- Update role
UPDATE profiles 
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'super_admin')
WHERE email = 'your-email@example.com';
```

### Role not updating in app
- Clear browser cache and localStorage
- Logout and login again
- Check browser console for API errors

## Files Created/Modified

### New Files
- `app/api/auth/me/route.ts` - Profile API endpoint
- `lib/hooks/useUserRole.ts` - Reusable role hook
- `USER_CREATION_FIXED.md` - User creation guide

### Modified Files
- `app/(dashboard)/announcements/page.tsx` - Uses hook
- `app/(dashboard)/page.tsx` - Uses hook
- `components/layout/sidebar.tsx` - Uses hook

## Next Steps

1. ✅ Run the SQL to update your existing user to super_admin
2. ✅ Test login with your existing credentials
3. ✅ Create an employee user following USER_CREATION_FIXED.md
4. ✅ Test employee login to verify limited permissions
5. Consider adding more role-based restrictions to other pages if needed

All changes have been pushed to GitHub! 🚀