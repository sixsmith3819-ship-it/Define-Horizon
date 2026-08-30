# 🧪 Define Horizon BMS - Testing Guide

**Last Updated:** August 28, 2026  
**System Status:** Phase 3 (Authentication) in progress  
**Ready for Testing:** Database, UI Components, Basic Navigation

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Testing](#database-testing)
4. [Application Testing](#application-testing)
5. [Authentication Testing](#authentication-testing)
6. [UI Component Testing](#ui-component-testing)
7. [Known Limitations](#known-limitations)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

- ✅ Node.js (v18 or higher)
- ✅ npm (v9 or higher)
- ✅ Supabase account (for database)
- ✅ Git (for version control)

### Verify Installation

```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if dependencies are installed
npm list --depth=0
```

---

## ⚙️ Environment Setup

### 1. Configure Environment Variables

You need to update `.env.local` with your actual Supabase credentials:

```powershell
# Open .env.local in your editor
code .env.local
```

**Required Variables:**

```env
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 2. Install Dependencies (Already Done ✅)

```powershell
npm install --legacy-peer-deps
```

---

## 🗄️ Database Testing

### 1. Apply Database Migrations

**Option A: Using Supabase CLI (Recommended)**

```powershell
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations to Supabase
supabase db push
```

**Option B: Manual SQL Execution**

Go to your Supabase Dashboard → SQL Editor and run migrations in this order:

1. `20260828214700_create_auth_tables.sql` - User profiles and roles
2. `20260828214900_create_branch_tables.sql` - Branch management
3. `20260828214905_create_customer_tables.sql` - Customer records
4. `20260828214918_create_transaction_tables.sql` - Money transfer transactions
5. `20260828214920_create_inventory_tables.sql` - Product inventory
6. `20260828214925_create_announcement_tables.sql` - Announcement system
7. `20260828214930_create_settings_tables.sql` - System settings
8. `20260828214930_create_audit_logs_table.sql` - Audit logging
9. `20260829_create_rls_policies_comprehensive.sql` - Security policies (31+ RLS policies)
10. `20260828215000_create_performance_indexes.sql` - Database indexes (60+)

### 2. Verify Database Schema

**Check Tables Created:**

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables (13 total):**

- ✅ profiles
- ✅ branches
- ✅ customers
- ✅ transactions
- ✅ transaction_service_providers
- ✅ transaction_rates
- ✅ transaction_status_history
- ✅ product_categories
- ✅ products
- ✅ stock_movements
- ✅ announcements
- ✅ announcement_targets
- ✅ announcement_views
- ✅ system_settings
- ✅ audit_logs

### 3. Seed Initial Data (Optional)

```sql
-- Create a test user profile (run after creating your first auth user)
INSERT INTO public.profiles (id, email, full_name, role, branch_id)
VALUES (
  'YOUR_AUTH_USER_ID', -- Get this from auth.users table
  'admin@definehorizon.com',
  'System Administrator',
  'super_admin',
  (SELECT id FROM branches WHERE name = 'Headquarters')
);

-- Verify default branch exists
SELECT * FROM branches WHERE name = 'Headquarters';

-- Verify service providers exist
SELECT * FROM transaction_service_providers;

-- Verify transaction rates exist
SELECT * FROM transaction_rates;

-- Verify product categories exist
SELECT * FROM product_categories;
```

---

## 🚀 Application Testing

### 1. Start Development Server

```powershell
npm run dev
```

**Expected Output:**

```
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 2. Access the Application

Open your browser and navigate to: **http://localhost:3000**

### 3. Test Pages

#### ✅ Currently Available Pages

| Route        | Description             | Status         |
| ------------ | ----------------------- | -------------- |
| `/`          | Landing/Dashboard       | ✅ Working     |
| `/login`     | Login page (if created) | 🚧 In Progress |
| `/dashboard` | Main dashboard          | ✅ Working     |

#### 🎯 What to Test on Dashboard

1. **Page Load**
   - Dashboard renders without errors
   - All metric cards display (Customers, Transactions, Revenue, Service Charges)
   - Quick action buttons are visible

2. **Navigation**
   - Sidebar navigation (if visible)
   - Quick action links (may lead to 404 - expected)

3. **UI Components**
   - Metric cards display correctly
   - Colors and borders render properly (Tailwind CSS)
   - Responsive layout works on different screen sizes

---

## 🔐 Authentication Testing

### Current Auth Status: 🚧 **Partial Implementation**

**✅ Implemented:**

- Supabase Auth integration (@supabase/ssr)
- Auth client setup (browser, server, admin)
- Session management utilities
- Role-based constants (4 roles, 33 permissions)
- Branch context management

**🚧 In Progress:**

- Login/Logout flows
- Password reset
- Session timeout (30min)
- Route protection
- Permission middleware

### Basic Auth Testing (Manual)

Since login UI isn't complete yet, you can test auth via Supabase Dashboard:

1. **Create Test User**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user"
   - Email: `test@definehorizon.com`
   - Password: `Test123!@#`
   - Auto Confirm User: Yes

2. **Add User Profile**

   ```sql
   -- Run in SQL Editor (replace USER_ID with actual ID from auth.users)
   INSERT INTO public.profiles (id, email, full_name, role, branch_id)
   VALUES (
     'USER_ID_FROM_AUTH_TABLE',
     'test@definehorizon.com',
     'Test User',
     'employee',
     (SELECT id FROM branches WHERE name = 'Headquarters')
   );
   ```

3. **Test Session** (Once login page is ready)
   - Login with test credentials
   - Verify session persists
   - Check role-based permissions

---

## 🎨 UI Component Testing

### Design System Verification

The system uses a comprehensive design system. Test these elements:

#### 1. Colors

```tsx
// Verify these colors render correctly in the UI
- Primary: Blue (#2563eb)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Danger: Red (#ef4444)
- Info: Purple (#8b5cf6)
```

#### 2. Typography

- Headers (h1, h2, h3) should use correct font sizes
- Body text should be readable
- Font family: System font stack

#### 3. Spacing

- Consistent padding and margins
- Grid layouts responsive
- Cards have proper spacing

#### 4. Components

- ✅ Metric Cards (Dashboard)
- ✅ Quick Action Buttons
- ✅ Layout structure (App, Auth, Dashboard)
- 🚧 Forms (In Progress)
- 🚧 Tables (In Progress)
- 🚧 Modals (Pending)

---

## ⚠️ Known Limitations

### Current Phase: 3/10 (Authentication & Authorization)

**✅ Fully Functional:**

- Database schema (13 tables, 31+ RLS policies, 60+ indexes)
- Multi-tenant isolation (branch-based)
- Role definitions (4 roles: super_admin, branch_manager, employee, auditor)
- Permission constants (33 permissions)
- Basic UI structure
- Design system
- Middleware setup

**🚧 Partially Working:**

- Authentication flows (integration done, UI pending)
- Session management (backend ready, UI pending)
- Role-based access control (constants ready, enforcement pending)

**❌ Not Yet Implemented:**

- Customer Management UI (Phase 4)
- Transaction Management UI (Phase 5)
- Inventory Management UI (Phase 6)
- Announcement System UI (Phase 7)
- Analytics & Reporting (Phase 8)
- System Administration UI (Phase 9)
- Comprehensive Testing (Phase 10)

### Expected Behaviors

1. **404 Errors on Quick Actions** - Normal! Customer, Transaction, Inventory, and Reports pages aren't built yet.

2. **No Data on Dashboard** - Expected! No data entry forms exist yet.

3. **Placeholders** - Chart placeholders are intentional. Analytics will come in Phase 8.

4. **Login Redirects** - May not work correctly until auth flows are complete.

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Module not found" Errors

```powershell
# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

#### 2. Port 3000 Already in Use

```powershell
# Kill the process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use a different port
npm run dev -- -p 3001
```

#### 3. Supabase Connection Errors

- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Verify network/firewall settings
- Test connection in Supabase dashboard

#### 4. Database Migration Errors

- Ensure migrations run in order
- Check for syntax errors in SQL
- Verify you have sufficient permissions
- Try running migrations one at a time

#### 5. TypeScript Errors

```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Rebuild
npm run dev
```

#### 6. Styling Issues (Tailwind)

```powershell
# Verify Tailwind is configured
Get-Content tailwind.config.ts

# Check PostCSS config
Get-Content postcss.config.mjs

# Restart dev server
```

### Getting Help

If you encounter issues:

1. Check the console for error messages (F12 in browser)
2. Review the terminal output where `npm run dev` is running
3. Check Supabase dashboard logs
4. Verify environment variables are set correctly

---

## 📊 Testing Checklist

Use this checklist to systematically test the system:

### ✅ Pre-Testing Setup

- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured with Supabase credentials
- [ ] Database migrations applied
- [ ] Default data seeded (branches, rates, etc.)

### ✅ Database Tests

- [ ] All 13 tables created
- [ ] RLS policies active (31+)
- [ ] Indexes created (60+)
- [ ] Default branch "Headquarters" exists
- [ ] Service providers seeded
- [ ] Transaction rates configured
- [ ] Product categories available

### ✅ Application Tests

- [ ] Dev server starts without errors
- [ ] Application loads at localhost:3000
- [ ] Dashboard page renders
- [ ] Metric cards display
- [ ] Quick action buttons visible
- [ ] No console errors (check F12)
- [ ] Responsive design works

### ✅ Auth Tests (When Available)

- [ ] Test user created in Supabase
- [ ] User profile exists in profiles table
- [ ] Login page accessible
- [ ] Login with test credentials works
- [ ] Session persists after refresh
- [ ] Logout works correctly

---

## 🎯 Next Testing Phases

As development progresses, you'll be able to test:

### Phase 4: Customer Management (Upcoming)

- Add new customers
- Search customers
- Edit customer information
- Branch-isolated customer lists

### Phase 5: Transaction Management (Upcoming)

- Record transactions
- Calculate service charges
- Track transaction status
- Generate receipts

### Phase 6: Inventory Management (Upcoming)

- Add products
- Track stock levels
- Record stock movements
- Generate inventory reports

### Phase 7: Announcements (Upcoming)

- Create announcements
- Target specific audiences
- Track engagement
- Schedule announcements

### Phase 8: Analytics & Reporting (Upcoming)

- Dashboard metrics with real data
- Transaction trends
- Revenue reports
- Export functionality

---

## 📞 Support

**Project:** Define Horizon Business Management System  
**Version:** 0.1.0 (Phase 3)  
**Status:** Active Development

**Documentation Files:**

- `README.md` - Project overview
- `DESIGN_SYSTEM.md` - UI design tokens
- `RLS_POLICIES_DOCUMENTATION.md` - Security policies
- `DATABASE_BACKUP_AND_RECOVERY.md` - Backup procedures
- `ENVIRONMENT_SETUP.md` - Environment configuration

---

**Happy Testing! 🚀**

Remember: This is an active development project. Not all features are complete, and that's expected! Focus on testing what's been implemented so far.
