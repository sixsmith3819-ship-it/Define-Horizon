# Define Horizon Business Management System (DH-BMS)

## Technical Design Document

**Last Updated:** 2024
**Version:** 1.0
**Status:** Design Phase

---

## 1. Overview

Define Horizon Business Management System (DH-BMS) is a comprehensive business management platform built on a modern web technology stack. The system consolidates multi-branch operations, customer management, financial transaction processing, inventory control, employee communications, and business analytics into a single, secure, role-based access system.

**Technology Stack:**

- **Frontend:** Next.js 14+ (App Router), TypeScript, React, Tailwind CSS, Lucide React
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Data Visualization:** Recharts
- **Form Handling:** React Hook Form + Zod
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)

**Core Design Principles:**

1. **Security First:** Row-level security, branch-level isolation, role-based access control
2. **Performance:** Database indexing, pagination, lazy loading, efficient queries
3. **Usability:** Professional SaaS-style interface, responsive design, accessibility (WCAG 2.1 AA)
4. **Maintainability:** TypeScript strict mode, modular architecture, clear separation of concerns
5. **Auditability:** Comprehensive audit logging, immutable records, compliance tracking

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Browser)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js 14 (App Router)                             │   │
│  │  ├─ React Components                                 │   │
│  │  ├─ State Management (React Context/Zustand)         │   │
│  │  ├─ Client-Side Forms (React Hook Form + Zod)       │   │
│  │  └─ Responsive UI (Tailwind CSS)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS ↓
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION LAYER (Supabase Auth)            │
│  ├─ Email/Password Authentication                          │
│  ├─ JWT Token Generation                                   │
│  ├─ Session Management                                     │
│  ├─ Password Reset via Email                               │
│  └─ User Activation/Deactivation                           │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS ↓
┌─────────────────────────────────────────────────────────────┐
│         API & SERVER ACTIONS LAYER (Next.js)                │
│  ├─ /api/[resource] - RESTful endpoints                    │
│  ├─ Server Actions - Mutations (TypeScript-safe)          │
│  ├─ Request Validation (Zod schemas)                       │
│  ├─ Authorization Middleware                               │
│  └─ Error Handling & Logging                              │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS ↓
┌─────────────────────────────────────────────────────────────┐
│        DATABASE & BUSINESS LOGIC (Supabase)                 │
│  ├─ PostgreSQL Database                                    │
│  ├─ Row-Level Security (RLS) Policies                     │
│  ├─ Business Logic (Stored Procedures/Triggers)           │
│  ├─ Real-time Subscriptions                               │
│  └─ Backup & PITR                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Read Operation:**

```
User Request
  → Next.js Server Action / API Route
  → Supabase Auth Verification
  → Query Builder / RLS Check
  → PostgreSQL Query
  → RLS Filters Applied
  → Data Returned to Client
  → React Component Updated
```

**Write Operation:**

```
User Form Submission
  → Client-Side Validation (Zod)
  → Server Action / API Route
  → Supabase Auth Verification
  → Server-Side Validation (Zod)
  → Authorization Check (Role + Branch)
  → Transaction Started
  → Database Mutation
  → Audit Log Entry Created
  → Transaction Committed
  → Response to Client
  → UI Update (Optimistic / Confirmation)
```

### 2.3 Deployment Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ├─ Run Tests
    ├─ ESLint & Type Check
    └─ Build & Deploy
        ├─ Vercel (Next.js Frontend)
        └─ Supabase (PostgreSQL + Auth)

User Browser
    → Vercel CDN (Next.js Frontend)
    → Supabase Cloud (API + Database)
```

---

## 3. Database Schema

### 3.1 Core Tables & Relationships

```sql
-- Authentication & User Management
Table: auth.users (Managed by Supabase Auth)
  - id (UUID, primary key)
  - email (string, unique)
  - encrypted_password (string)
  - created_at (timestamp)
  - updated_at (timestamp)

Table: public.profiles
  - id (UUID, primary key, FK to auth.users.id)
  - email (string, unique)
  - full_name (string)
  - phone_number (string)
  - role_id (UUID, FK to roles.id)
  - branch_id (UUID, FK to branches.id)
  - is_active (boolean, default: true)
  - created_at (timestamp)
  - updated_at (timestamp)
  - Indexes: (role_id), (branch_id), (is_active)

Table: public.roles
  - id (UUID, primary key)
  - name (string, unique) -- 'super_admin', 'branch_manager', 'employee', 'auditor'
  - description (string)
  - permissions (jsonb) -- JSON array of permission strings
  - created_at (timestamp)
  - Indexes: (name)

Table: public.branches
  - id (UUID, primary key)
  - name (string, unique)
  - location (string)
  - manager_id (UUID, FK to profiles.id, nullable)
  - staff_count (integer, default: 0)
  - notes (text, nullable)
  - is_active (boolean, default: true)
  - created_at (timestamp)
  - updated_at (timestamp)
  - Indexes: (manager_id), (is_active)

-- Customer Management
Table: public.customers
  - id (UUID, primary key)
  - branch_id (UUID, FK to branches.id)
  - first_name (string)
  - last_name (string)
  - email (string, nullable)
  - phone_number (string)
  - customer_type (string) -- 'individual', 'business'
  - physical_address (string, nullable)
  - created_by (UUID, FK to profiles.id)
  - created_at (timestamp)
  - updated_at (timestamp)
  - Indexes: (branch_id), (created_by), (email), (phone_number)
  - Constraint: Unique(branch_id, email) where email is not null

-- Financial Transactions
Table: public.service_providers
  - id (UUID, primary key)
  - name (string, unique) -- 'WorldRemit', 'Hello Paisa', 'Mukuru'
  - description (string, nullable)
  - is_active (boolean, default: true)
  - created_at (timestamp)

Table: public.transaction_rates
  - id (UUID, primary key)
  - provider_id (UUID, FK to service_providers.id)
  - transaction_type (string) -- 'international', 'local'
  - rate_percentage (numeric(5,2)) -- e.g., 10.00 for 10%
  - effective_date (date)
  - created_by (UUID, FK to profiles.id)
  - created_at (timestamp)
  - Indexes: (provider_id), (transaction_type, effective_date)

Table: public.transactions
  - id (UUID, primary key)
  - branch_id (UUID, FK to branches.id)
  - customer_id (UUID, FK to customers.id)
  - recorded_by (UUID, FK to profiles.id)
  - provider_id (UUID, FK to service_providers.id)
  - transaction_type (string) -- 'international', 'local'
  - amount (numeric(12,2))
  - service_charge (numeric(12,2))
  - total_amount (numeric(12,2))
  - status (string) -- 'completed', 'pending', 'failed'
  - notes (text, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)
  - Indexes: (branch_id), (customer_id), (recorded_by), (provider_id), (created_at), (status)

Table: public.transaction_status_history
  - id (UUID, primary key)
  - transaction_id (UUID, FK to transactions.id)
  - old_status (string)
  - new_status (string)
  - reason (string, nullable)
  - changed_by (UUID, FK to profiles.id)
  - changed_at (timestamp)
  - Indexes: (transaction_id), (changed_at)

-- Inventory Management
Table: public.product_categories
  - id (UUID, primary key)
  - name (string, unique) -- 'ZTE Phones', 'Samsung Phones', 'Speakers', etc.
  - description (string, nullable)
  - created_at (timestamp)

Table: public.products
  - id (UUID, primary key)
  - category_id (UUID, FK to product_categories.id)
  - branch_id (UUID, FK to branches.id)
  - name (string)
  - description (string, nullable)
  - unit_cost (numeric(12,2))
  - reorder_point (integer)
  - current_stock_level (integer, default: 0)
  - created_at (timestamp)
  - updated_at (timestamp)
  - Indexes: (branch_id), (category_id), (current_stock_level)
  - Constraint: Unique(branch_id, name)

Table: public.stock_movements
  - id (UUID, primary key)
  - product_id (UUID, FK to products.id)
  - source_branch_id (UUID, FK to branches.id, nullable) -- for transfers
  - destination_branch_id (UUID, FK to branches.id, nullable) -- for transfers
  - movement_type (string) -- 'addition', 'reduction', 'transfer'
  - quantity (integer)
  - reason (string, nullable) -- 'sale', 'damage', 'loss', 'purchase', etc.
  - unit_cost (numeric(12,2), nullable)
  - supplier (string, nullable)
  - reference_document (string, nullable)
  - recorded_by (UUID, FK to profiles.id)
  - created_at (timestamp)
  - Indexes: (product_id), (source_branch_id), (destination_branch_id), (created_at)

-- Communications
Table: public.announcements
  - id (UUID, primary key)
  - created_by (UUID, FK to profiles.id)
  - branch_id (UUID, FK to branches.id, nullable) -- null for system-wide
  - title (string)
  - content (text)
  - priority_level (string) -- 'normal', 'important', 'urgent'
  - status (string) -- 'draft', 'scheduled', 'published', 'archived'
  - publish_at (timestamp, nullable)
  - published_at (timestamp, nullable)
  - archived_at (timestamp, nullable)
  - view_count (integer, default: 0)
  - created_at (timestamp)
  - updated_at (timestamp)
  - Indexes: (created_by), (branch_id), (status), (priority_level), (published_at)

Table: public.announcement_targets
  - id (UUID, primary key)
  - announcement_id (UUID, FK to announcements.id, ON DELETE CASCADE)
  - target_type (string) -- 'all', 'branch', 'role', 'user'
  - target_value (string) -- branch_id, role_id, or profile_id as JSON or string
  - created_at (timestamp)
  - Indexes: (announcement_id)

Table: public.announcement_views
  - id (UUID, primary key)
  - announcement_id (UUID, FK to announcements.id, ON DELETE CASCADE)
  - user_id (UUID, FK to profiles.id)
  - viewed_at (timestamp)
  - Indexes: (announcement_id, user_id), (viewed_at)

-- Configuration
Table: public.system_settings
  - id (UUID, primary key)
  - setting_key (string, unique)
  - setting_value (jsonb)
  - data_type (string) -- 'string', 'number', 'json', 'boolean'
  - is_global (boolean, default: true)
  - branch_id (UUID, FK to branches.id, nullable) -- for branch-specific settings
  - created_at (timestamp)
  - updated_at (timestamp)
  - Indexes: (setting_key), (branch_id)

-- Audit Logging
Table: public.audit_logs
  - id (UUID, primary key)
  - user_id (UUID, FK to profiles.id)
  - action_type (string) -- 'create', 'update', 'delete', 'login', etc.
  - resource_type (string) -- 'customer', 'transaction', 'product', etc.
  - resource_id (UUID, nullable)
  - old_values (jsonb, nullable)
  - new_values (jsonb, nullable)
  - ip_address (string, nullable)
  - user_agent (string, nullable)
  - created_at (timestamp)
  - Indexes: (user_id), (action_type), (resource_type), (resource_id), (created_at)
```

### 3.2 Schema Relationships Diagram

```
auth.users (Supabase)
    ↓
profiles ←─────────────┐
    ├─ role_id → roles
    └─ branch_id ──┐
                   ↓
branches ←────────────┐
    ├─ manager_id → profiles
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ├─ customers                              ├─ products
    │   ├─ branch_id → branches               │   ├─ branch_id → branches
    │   └─ created_by → profiles              │   ├─ category_id → product_categories
    │       ↓                                 │   └─────────────┐
    │   transactions                          │                 │
    │   ├─ customer_id → customers            │   stock_movements
    │   ├─ recorded_by → profiles             │   ├─ product_id → products
    │   ├─ provider_id → service_providers    │   ├─ source_branch_id → branches
    │   └─ branch_id → branches               │   └─ destination_branch_id → branches
    │       ↓
    └─ announcements
        ├─ created_by → profiles
        └─ branch_id → branches

audit_logs
    └─ user_id → profiles

system_settings
    └─ branch_id → branches (optional)
```

### 3.3 Key Indexes

```sql
-- Performance Indexes
CREATE INDEX idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

CREATE INDEX idx_customers_branch_id ON customers(branch_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone_number);

CREATE INDEX idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);

CREATE INDEX idx_products_branch_id ON products(branch_id);
CREATE INDEX idx_products_stock_level ON products(current_stock_level);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);

CREATE INDEX idx_announcements_branch_id ON announcements(branch_id);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
```

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

**Login Process:**

```
1. User enters email and password
2. Next.js client sends request to /api/auth/login
3. Server action calls supabase.auth.signInWithPassword()
4. Supabase validates credentials against auth.users
5. JWT tokens returned (access token + refresh token)
6. Tokens stored securely (httpOnly cookies)
7. User profile loaded from public.profiles
8. User role and branch context set in session
9. Redirect to dashboard or home page
```

**Session Management:**

```
- Access Token: 1 hour expiration
- Refresh Token: 7 days expiration
- Auto-refresh on route navigation
- Logout invalidates refresh token
- 30-minute inactivity timeout
```

### 4.2 Authorization Implementation

**Role Hierarchy:**

```
Super Administrator (Highest)
  ├─ Full system access
  ├─ All data across all branches
  └─ User management, system settings

Branch Manager
  ├─ Data for assigned branch only
  ├─ Customer management (own branch)
  ├─ Transaction recording
  ├─ Stock management (own branch)
  ├─ Announcement creation (own branch)
  └─ Employee deactivation (own branch)

Employee/Agent
  ├─ Customer search/view (own branch)
  ├─ Transaction recording
  ├─ Stock viewing (no modification)
  ├─ Announcement viewing
  └─ Personal activity dashboard

Auditor (Lowest)
  ├─ Read-only access to all data
  ├─ Audit log access
  ├─ Report generation
  └─ No write access
```

### 4.3 Row-Level Security (RLS) Policies

```sql
-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Super admin can see all profiles
CREATE POLICY "super_admin_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Branch managers see their branch users
CREATE POLICY "branch_manager_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role_id IN (SELECT id FROM roles WHERE name = 'branch_manager')
      AND current_user.branch_id = profiles.branch_id
    )
  );

-- Users see only themselves
CREATE POLICY "self_profiles" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Customers RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Users see customers from their branch
CREATE POLICY "branch_customers" ON customers
  FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role_id IN (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "create_customer" ON customers
  FOR INSERT
  WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Similar policies for transactions, products, stock_movements, etc.
```

### 4.4 Permission Checking Middleware

```typescript
// lib/auth/middleware.ts

export async function checkPermission(
  userId: string,
  requiredRole: RoleType,
  resourceBranch?: string
): Promise<boolean> {
  const user = await getUserWithRole(userId);

  if (!user.is_active) {
    return false;
  }

  // Check role hierarchy
  if (!hasRequiredRole(user.role, requiredRole)) {
    return false;
  }

  // Check branch access (unless super admin)
  if (resourceBranch && user.role !== 'super_admin') {
    if (user.branch_id !== resourceBranch) {
      return false;
    }
  }

  return true;
}

// Usage in API routes
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!(await checkPermission(user.id, 'branch_manager', branchId))) {
    return unauthorized();
  }

  // Proceed with request
}
```

---

## 5. API Design

### 5.1 Route Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts          POST
│   │   ├── logout/route.ts         POST
│   │   ├── register/route.ts       POST
│   │   └── reset-password/route.ts POST
│   │
│   ├── customers/
│   │   ├── route.ts                GET (list), POST (create)
│   │   ├── [id]/route.ts           GET (detail), PATCH (update)
│   │   ├── [id]/transactions/route.ts GET (history)
│   │   └── search/route.ts         GET (search)
│   │
│   ├── transactions/
│   │   ├── route.ts                GET (list), POST (create)
│   │   ├── [id]/route.ts           GET (detail), PATCH (update status)
│   │   └── rates/route.ts          GET (current rates)
│   │
│   ├── products/
│   │   ├── route.ts                GET (list), POST (create)
│   │   ├── [id]/route.ts           GET (detail), PATCH (update)
│   │   ├── categories/route.ts     GET (list)
│   │   └── [id]/movements/route.ts GET (history)
│   │
│   ├── stock/
│   │   ├── movements/route.ts      POST (create movement)
│   │   ├── transfers/route.ts      POST (create transfer)
│   │   └── history/[productId]/route.ts GET (movement history)
│   │
│   ├── announcements/
│   │   ├── route.ts                GET (list), POST (create)
│   │   ├── [id]/route.ts           PATCH (update), DELETE
│   │   └── [id]/views/route.ts     POST (mark viewed)
│   │
│   ├── reports/
│   │   ├── customers/route.ts      POST (generate)
│   │   ├── transactions/route.ts   POST (generate)
│   │   ├── stock/route.ts          POST (generate)
│   │   ├── performance/route.ts    POST (generate)
│   │   └── activity/route.ts       POST (generate)
│   │
│   ├── admin/
│   │   ├── users/
│   │   │   ├── route.ts            GET (list), POST (create)
│   │   │   ├── [id]/route.ts       PATCH (update), DELETE
│   │   │   └── [id]/deactivate/route.ts POST
│   │   │
│   │   ├── branches/
│   │   │   ├── route.ts            GET (list), POST (create)
│   │   │   └── [id]/route.ts       PATCH (update)
│   │   │
│   │   ├── settings/route.ts       GET, PATCH (system settings)
│   │   ├── roles/route.ts          GET (list roles)
│   │   └── audit-logs/route.ts     GET (list audit logs)
│   │
│   └── dashboard/
│       ├── metrics/route.ts        GET (core metrics)
│       ├── analytics/route.ts      GET (analytics data)
│       └── stock/route.ts          GET (stock status)
```

### 5.2 API Response Format

```typescript
// Successful response
{
  "success": true,
  "data": {
    // Resource data
  },
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 100,
    "totalPages": 4
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 5.3 Server Actions for Mutations

```typescript
// app/actions/customers.ts

'use server';

import { revalidatePath } from 'next/cache';
import { customerSchema } from '@/lib/schemas';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function createCustomer(data: unknown) {
  // 1. Validate input
  const validated = customerSchema.parse(data);

  // 2. Get current user
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // 3. Check permissions
  const canCreate = await checkPermission(
    user.id,
    ['branch_manager', 'super_admin'],
    validated.branch_id
  );
  if (!canCreate) throw new Error('Insufficient permissions');

  // 4. Create customer
  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      ...validated,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // 5. Audit log
  await createAuditLog({
    userId: user.id,
    actionType: 'create',
    resourceType: 'customer',
    resourceId: customer.id,
    newValues: customer,
  });

  // 6. Revalidate cache
  revalidatePath('/customers');

  return customer;
}
```

### 5.4 Error Handling

```typescript
// lib/api/errors.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(details: any[]) {
    super(400, 'VALIDATION_ERROR', 'Invalid request data', details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, 'UNAUTHORIZED', 'Authentication required');
  }
}

export class ForbiddenError extends ApiError {
  constructor() {
    super(403, 'FORBIDDEN', 'Insufficient permissions');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

// Usage in API routes
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();

    if (!await checkPermission(user.id, 'viewer')) {
      throw new ForbiddenError();
    }

    const data = await fetchData();
    return JsonResponse.success(data);
  } catch (error) {
    return JsonResponse.error(error);
  }
}

// Global error response handler
export function JsonResponse {
  static success(data: any, pagination?: any) {
    return Response.json({ success: true, data, pagination });
  }

  static error(error: any) {
    if (error instanceof ApiError) {
      return Response.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        },
        { status: error.statusCode }
      );
    }

    // Unexpected error
    return Response.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}
```

### 5.5 Input Validation with Zod

```typescript
// lib/schemas/index.ts

import { z } from 'zod';

export const customerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().regex(/^[\d\+\-\s]+$/, 'Invalid phone number'),
  customerType: z.enum(['individual', 'business']),
  physicalAddress: z.string().optional(),
  branchId: z.string().uuid('Invalid branch ID'),
});

export const transactionSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  providerId: z.string().uuid('Invalid provider ID'),
  transactionType: z.enum(['international', 'local']),
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2).max(255),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  unitCost: z.number().positive(),
  reorderPoint: z.number().int().positive(),
  branchId: z.string().uuid(),
});

// Reusable validator
export async function validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): Promise<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }
    throw error;
  }
}
```

---

## 6. Frontend Architecture

### 6.1 Component Structure

```
app/
├── (dashboard)/                    # Protected routes
│   ├── layout.tsx                  # Main layout with sidebar
│   ├── page.tsx                    # Dashboard home
│   │
│   ├── customers/
│   │   ├── page.tsx                # Customer list
│   │   ├── [id]/
│   │   │   └── page.tsx            # Customer detail
│   │   ├── new/
│   │   │   └── page.tsx            # Customer form
│   │   └── components/
│   │       ├── CustomerTable.tsx
│   │       ├── CustomerForm.tsx
│   │       └── CustomerDetail.tsx
│   │
│   ├── transactions/
│   │   ├── page.tsx                # Transaction list
│   │   ├── new/
│   │   │   └── page.tsx            # Transaction form
│   │   ├── [id]/
│   │   │   └── page.tsx            # Transaction detail
│   │   └── components/
│   │       ├── TransactionTable.tsx
│   │       ├── TransactionForm.tsx
│   │       └── ServiceChargeCalculator.tsx
│   │
│   ├── inventory/
│   │   ├── page.tsx                # Stock dashboard
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── movements/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── transfers/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   └── components/
│   │       ├── StockStatusCard.tsx
│   │       ├── MovementForm.tsx
│   │       └── TransferForm.tsx
│   │
│   ├── announcements/
│   │   ├── page.tsx                # Announcements list
│   │   ├── new/
│   │   │   └── page.tsx            # Create announcement
│   │   ├── [id]/
│   │   │   ├── page.tsx            # Detail
│   │   │   └── edit/page.tsx       # Edit form
│   │   └── components/
│   │       ├── AnnouncementCard.tsx
│   │       ├── AnnouncementForm.tsx
│   │       └── AnnouncementManager.tsx
│   │
│   ├── analytics/
│   │   ├── page.tsx                # Analytics dashboard
│   │   └── components/
│   │       ├── MetricsCard.tsx
│   │       ├── TransactionChart.tsx
│   │       ├── CustomerTrend.tsx
│   │       ├── StockAnalysis.tsx
│   │       └── BranchComparison.tsx
│   │
│   ├── reports/
│   │   ├── page.tsx                # Reports dashboard
│   │   ├── components/
│   │   │   ├── ReportGenerator.tsx
│   │   │   ├── ReportTemplate.tsx
│   │   │   └── ReportExport.tsx
│   │   └── [reportType]/page.tsx
│   │
│   └── admin/
│       ├── users/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   ├── [id]/page.tsx
│       │   └── components/
│       │       ├── UserTable.tsx
│       │       ├── UserForm.tsx
│       │       └── UserDeactivation.tsx
│       │
│       ├── branches/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   ├── [id]/page.tsx
│       │   └── components/
│       │       ├── BranchTable.tsx
│       │       └── BranchForm.tsx
│       │
│       ├── settings/
│       │   └── page.tsx
│       │
│       └── audit-logs/
│           └── page.tsx
│
├── auth/
│   ├── login/
│   │   └── page.tsx                # Login page
│   └── register/
│       └── page.tsx                # Registration page
│
├── components/
│   ├── ui/                         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Pagination.tsx
│   │   ├── Form.tsx
│   │   ├── Tabs.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── Skeleton.tsx
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── BreadcrumbNav.tsx
│   │   ├── UserMenu.tsx
│   │   └── NotificationCenter.tsx
│   │
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
│
└── lib/
    ├── api/                        # API client utilities
    │   ├── client.ts               # Fetch wrapper
    │   ├── endpoints.ts            # API endpoint constants
    │   ├── errors.ts               # Error handling
    │   └── hooks.ts                # Custom hooks (useFetch, etc)
    │
    ├── auth/                       # Auth utilities
    │   ├── middleware.ts
    │   ├── permissions.ts
    │   └── hooks.ts                # useAuth, useUser
    │
    ├── schemas/                    # Zod schemas
    │   ├── customer.ts
    │   ├── transaction.ts
    │   ├── product.ts
    │   └── index.ts
    │
    ├── utils/
    │   ├── format.ts               # Formatting utilities
    │   ├── validation.ts
    │   ├── date.ts
    │   ├── currency.ts
    │   └── helpers.ts
    │
    └── hooks/
        ├── useDebounce.ts
        ├── useLocalStorage.ts
        ├── usePagination.ts
        ├── useTable.ts
        ├── useForm.ts
        └── useAsync.ts
```

### 6.2 State Management

```typescript
// lib/store/useAuthStore.ts (Zustand example)
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

// lib/store/useBranchStore.ts
export const useBranchStore = create<BranchStore>((set) => ({
  selectedBranchId: null,
  branches: [],
  setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),
  setBranches: (branches) => set({ branches }),
}));

// lib/store/useUIStore.ts
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

### 6.3 Custom Hooks

```typescript
// lib/hooks/useAsync.ts
import { useEffect, useState } from 'react';

export function useAsync<T, E = Error>(asyncFunction: () => Promise<T>, immediate = true) {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = async () => {
    setStatus('pending');
    setValue(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return { execute, status, value, error };
}

// lib/hooks/useTable.ts
export function useTable<T>(data: T[], pageSize = 25) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sorting
  const sorted = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginatedData = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    data: paginatedData,
    page,
    setPage,
    totalPages,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    total: data.length,
  };
}

// lib/hooks/useFetch.ts
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [url]);

  return { data, loading, error };
}
```

### 6.4 Form Handling

```typescript
// Example component: CustomerForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/schemas';
import { createCustomer } from '@/app/actions/customers';

export function CustomerForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(customerSchema)
  });

  const onSubmit = async (data: z.infer<typeof customerSchema>) => {
    try {
      await createCustomer(data);
      toast.success('Customer created successfully');
      // Navigate or reset form
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">First Name</label>
        <input
          {...register('firstName')}
          className="mt-1 block w-full border rounded"
        />
        {errors.firstName && (
          <p className="text-red-500 text-sm">{errors.firstName.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Customer'}
      </Button>
    </form>
  );
}
```

---

## 7. Feature-Specific Designs

### 7.1 Customer Management Workflow

**Data Flow:**

```
User clicks "New Customer"
  ↓
CustomerForm component opens
  ↓
User fills form (name, contact, type)
  ↓
Client-side validation (Zod)
  ↓
Form submits via Server Action
  ↓
Server-side validation
  ↓
Check permissions (branch context)
  ↓
Create customer in DB
  ↓
Create audit log entry
  ↓
Revalidate cache
  ↓
Show success toast
  ↓
Redirect to customer detail or list
```

**Key Components:**

- CustomerForm: Form for creating/editing
- CustomerTable: List view with pagination, filtering, sorting
- CustomerDetail: Full profile with transaction history
- CustomerSearch: Quick search functionality

### 7.2 Transaction Processing

**Automatic Service Charge Calculation:**

```
1. User enters transaction amount (e.g., 100 ZWL)
2. User selects provider (WorldRemit, Hello Paisa, Mukuru)
3. User selects transaction type (International, Local)
4. System fetches current service charge rate
   - International: 10% (configurable)
   - Local: 8% (configurable)
5. System calculates: Service Charge = Amount × (Rate / 100)
6. System displays:
   - Transaction Amount: 100 ZWL
   - Service Charge: 10 ZWL (for international)
   - Total Amount: 110 ZWL
7. User reviews and confirms
8. System creates transaction record with status "Pending"
9. Status can be updated to "Completed" or "Failed"
```

**Transaction Status Flow:**

```
Created (Pending) → Completed
              ↘ Failed → Retry / Cancel
```

### 7.3 Stock Management & Transfers

**Stock Addition:**

```
1. User initiates stock addition
2. Select product, enter quantity, unit cost, supplier info
3. System increases product's current_stock_level
4. Creates stock_movement record (type: 'addition')
5. Checks if stock level exceeds reorder point
6. If not at low stock, clears "Low Stock" flag
```

**Stock Transfer (Atomic):**

```
BEGIN TRANSACTION
  1. Validate source branch has sufficient quantity
  2. Decrease source branch product stock
  3. Increase destination branch product stock
  4. Create stock_movement records for both branches
  5. Check destination branch low stock status
  6. Update audit log
COMMIT or ROLLBACK (all-or-nothing)
```

**Low Stock Alerts:**

```
System checks (on stock movement update):
  IF current_stock_level <= reorder_point THEN
    SET status = 'Low Stock'
    NOTIFY Branch Manager
    NOTIFY Warehouse Manager
  END IF
```

### 7.4 Announcement System with Targeting

**Announcement Targeting Logic:**

```
Target Type: "All"
  → Visible to all active users

Target Type: "Branch"
  → Visible only to users assigned to selected branch(es)

Target Type: "Role"
  → Visible only to users with selected role(s)

Target Type: "User"
  → Visible only to specifically selected users

Filter Combination:
  IF user.role IN target.roles
  AND user.branch_id IN target.branches
  AND user.id IN target.users (if any)
  THEN announcement is visible
```

**Publishing Schedule:**

```
Publish Immediately:
  status = 'published'
  published_at = NOW()
  visible_immediately

Schedule for Later:
  status = 'scheduled'
  publish_at = user_specified_datetime
  Background job checks every minute
  When publish_at <= NOW():
    status = 'published'
    published_at = NOW()
    Make visible to target audience
```

### 7.5 Multi-Branch Reporting & Analytics

**Branch Context Isolation:**

```
IF user.role == 'super_admin' THEN
  Optional branch filter dropdown
  Can view all branches OR selected branch
ELSE
  Always filtered to user.branch_id
  No branch filter available
END IF
```

**Dashboard Metrics (Branch-specific):**

```
Total Customers
  = COUNT(customers WHERE branch_id = user.branch_id)

New Customers (this period)
  = COUNT(customers WHERE branch_id = user.branch_id AND created_at > period_start)

Total Transactions
  = COUNT(transactions WHERE branch_id = user.branch_id)

Transaction Revenue
  = SUM(total_amount) FROM transactions WHERE branch_id = user.branch_id

Service Charges Collected
  = SUM(service_charge) FROM transactions WHERE branch_id = user.branch_id

Top Providers
  = GROUP BY provider_id, COUNT(*) as transaction_count
    ORDER BY transaction_count DESC LIMIT 5
```

**Branch Comparison (Super Admin Only):**

```
Displayed as side-by-side metrics:
  Branch A  |  Branch B  |  Branch C
  ----------|-----------|----------
  Customers | Customers | Customers
  Revenue   | Revenue   | Revenue
  etc.
```

### 7.6 Audit Logging System

**What Gets Logged:**

```
Authentication Events:
  - User login (with IP address)
  - User logout
  - Password reset

Data Modifications:
  - Customer created/updated/deleted
  - Transaction created/updated
  - Stock movement created
  - Product created/updated
  - Announcement published/archived

Administrative Actions:
  - User created/updated/deactivated
  - Role assignment changed
  - Service charge rate changed
  - System settings changed

Audit Log Entry Structure:
  {
    user_id: "uuid of who performed action",
    action_type: "create|update|delete|login|etc",
    resource_type: "customer|transaction|etc",
    resource_id: "uuid of affected resource",
    old_values: { previous_field_values },
    new_values: { new_field_values },
    ip_address: "user's IP",
    user_agent: "browser info",
    created_at: "timestamp"
  }
```

**Audit Log Access Control:**

```
Super Admin: Full access to all audit logs

Branch Manager: Own actions only + branch staff actions

Employee: Own actions only

Auditor: Full access, read-only
```

---

## 8. Security Implementation

### 8.1 Data Encryption

**In Transit:**

- HTTPS/TLS 1.2+ for all communications
- Certificate pinning (optional for mobile apps)
- Secure headers (HSTS, X-Frame-Options, etc.)

**At Rest:**

- Supabase handles database encryption
- Sensitive fields encrypted at application level (if needed)

**In Code:**

```typescript
// lib/crypto/encryption.ts
import crypto from 'crypto';

export function encryptField(plaintext: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptField(encrypted: string, encryptionKey: string): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 8.2 Sensitive Data Masking

**Phone Numbers:**

```
Display: +263 XXXX XX12
Actual:  +263 123 456 7812

Masked Regex: /(\+\d{3})\d{3,4}(\d{2})/ → $1 XXXX X$2
```

**Email Addresses (in lists):**

```
Display: j****@example.com
Actual:  john.doe@example.com

Masked: first_letter + (n-2 x '*') + @ + domain
```

**Transaction IDs (internal):**

```
Display: TXN-XXXX-XXXX-2A1F
Actual:  TXN-5a1b-2c3d-2A1F

Show first and last 4 characters only
```

```typescript
// lib/utils/masking.ts
export function maskPhoneNumber(phone: string): string {
  return phone.replace(/(\+\d{3})\d{3,4}(\d{2})/, '$1 XXXX X$2');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local[0]}${'*'.repeat(local.length - 2)}@${domain}`;
}

export function maskTransactionId(id: string): string {
  return `${id.slice(0, 8)}XXXX${id.slice(-4)}`;
}
```

### 8.3 Input Validation & Sanitization

```typescript
// lib/validation/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Sanitize HTML content
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input);
}

// Sanitize general strings (remove special chars)
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

// Validation schemas with sanitization
export const announcementSchema = z.object({
  title: z.string().min(2).max(255).transform(sanitizeString),
  content: z.string().min(10).transform(sanitizeHtml),
  priorityLevel: z.enum(['normal', 'important', 'urgent']),
});
```

### 8.4 HTTPS Enforcement

```typescript
// middleware.ts (Next.js 13+)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Redirect HTTP to HTTPS
  if (request.headers.get('x-forwarded-proto') === 'http') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      { status: 301 }
    );
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/:path*'],
};
```

---

## 9. Performance Optimization

### 9.1 Database Indexing Strategy

```sql
-- Heavily Queried Columns
CREATE INDEX idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_customers_branch_id ON customers(branch_id);
CREATE INDEX idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Frequently Filtered Columns
CREATE INDEX idx_products_stock_level ON products(current_stock_level);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite Indexes for Common Queries
CREATE INDEX idx_transactions_branch_date
  ON transactions(branch_id, created_at DESC);

CREATE INDEX idx_stock_movements_product_date
  ON stock_movements(product_id, created_at DESC);

-- Foreign Key Indexes (created automatically)
-- PostgreSQL creates indexes on foreign key columns
```

### 9.2 Pagination

```typescript
// API endpoint example
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '25'));

  const offset = (page - 1) * pageSize;

  // Get total count
  const { count: total } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', user.branch_id);

  // Get paginated data
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('branch_id', user.branch_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  return JsonResponse.success(data, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
```

### 9.3 Lazy Loading Images & Charts

```typescript
// LazyImage component
import Image from 'next/image';

export function LazyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/png;base64,..."
    />
  );
}

// Lazy Chart Loading
export function LazyChart({ data }: { data: any[] }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <LineChart width={700} height={400} data={data}>
      <CartesianGrid />
      <XAxis />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  );
}
```

### 9.4 Query Optimization

```typescript
// lib/db/queries.ts

// Efficient customer with transaction count
export async function getCustomerWithStats(customerId: string) {
  const [customer, transactions] = await Promise.all([
    supabase.from('customers').select('*').eq('id', customerId).single(),

    supabase.from('transactions').select('id, created_at').eq('customer_id', customerId),
  ]);

  return {
    ...customer.data,
    transactionCount: transactions.data?.length || 0,
  };
}

// Batch query for dashboard metrics
export async function getDashboardMetrics(branchId: string) {
  return await Promise.all([
    supabase
      .from('customers')
      .select('id')
      .eq('branch_id', branchId)
      .then((r) => r.data?.length || 0),

    supabase
      .from('transactions')
      .select('total_amount, service_charge')
      .eq('branch_id', branchId)
      .then((r) => ({
        totalAmount: r.data?.reduce((sum, t) => sum + t.total_amount, 0) || 0,
        serviceCharges: r.data?.reduce((sum, t) => sum + t.service_charge, 0) || 0,
      })),
  ]).then(([customerCount, transactionMetrics]) => ({
    customerCount,
    ...transactionMetrics,
  }));
}
```

### 9.5 Caching Strategy

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.example.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  compress: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react']
  }
};

// app/dashboard/page.tsx
import { cache } from 'react';

export const revalidate = 3600; // ISR: revalidate every hour

const getDashboardData = cache(async (branchId: string) => {
  // Cache results for the duration of the request
  return await fetchDashboardData(branchId);
});

export default async function Dashboard() {
  const data = await getDashboardData(branchId);
  return (/* ... */);
}
```

---

## 10. Project Structure

```
define-horizon-bms/
├── .env.local                      # Local environment variables
├── .env.example                    # Template for env variables
├── .gitignore
├── next.config.js                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── package.json
├── package-lock.json
│
├── app/                            # Next.js app directory
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   ├── error.tsx                   # Error boundary
│   ├── not-found.tsx               # 404 page
│   │
│   ├── (auth)/                     # Auth routes (outside layout)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (dashboard)/                # Protected routes
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx                # Dashboard home
│   │   ├── customers/
│   │   ├── transactions/
│   │   ├── inventory/
│   │   ├── announcements/
│   │   ├── analytics/
│   │   ├── reports/
│   │   └── admin/
│   │
│   ├── api/                        # API routes
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── transactions/
│   │   ├── products/
│   │   ├── stock/
│   │   ├── announcements/
│   │   ├── reports/
│   │   ├── admin/
│   │   └── dashboard/
│   │
│   ├── actions/                    # Server actions
│   │   ├── auth.ts
│   │   ├── customers.ts
│   │   ├── transactions.ts
│   │   ├── products.ts
│   │   └── announcements.ts
│   │
│   └── middleware.ts               # Middleware for auth, headers
│
├── components/
│   ├── ui/                         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Form.tsx
│   │   ├── Pagination.tsx
│   │   └── ...
│   │
│   ├── layout/                     # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── BreadcrumbNav.tsx
│   │   └── UserMenu.tsx
│   │
│   ├── common/                     # Common components
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── EmptyState.tsx
│   │   └── ConfirmDialog.tsx
│   │
│   ├── forms/                      # Feature-specific forms
│   │   ├── CustomerForm.tsx
│   │   ├── TransactionForm.tsx
│   │   ├── ProductForm.tsx
│   │   ├── AnnouncementForm.tsx
│   │   └── ...
│   │
│   └── charts/                     # Chart components
│       ├── TransactionChart.tsx
│       ├── CustomerTrendChart.tsx
│       ├── StockAnalysisChart.tsx
│       └── ...
│
├── lib/
│   ├── api/                        # API utilities
│   │   ├── client.ts               # Fetch wrapper
│   │   ├── endpoints.ts            # API constants
│   │   ├── errors.ts               # Error types
│   │   └── hooks.ts                # useFetch, useApi
│   │
│   ├── auth/                       # Authentication
│   │   ├── middleware.ts           # Auth middleware
│   │   ├── permissions.ts          # Permission checking
│   │   ├── hooks.ts                # useAuth, useUser
│   │   └── supabase.ts             # Supabase client
│   │
│   ├── schemas/                    # Zod validation schemas
│   │   ├── customer.ts
│   │   ├── transaction.ts
│   │   ├── product.ts
│   │   ├── announcement.ts
│   │   └── index.ts
│   │
│   ├── store/                      # Zustand stores
│   │   ├── useAuthStore.ts
│   │   ├── useBranchStore.ts
│   │   └── useUIStore.ts
│   │
│   ├── utils/
│   │   ├── format.ts               # Formatting helpers
│   │   ├── validation.ts           # Validation helpers
│   │   ├── date.ts                 # Date utilities
│   │   ├── currency.ts             # Currency formatting
│   │   ├── constants.ts            # App constants
│   │   ├── masking.ts              # Data masking
│   │   └── helpers.ts              # General helpers
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── usePagination.ts
│   │   ├── useTable.ts
│   │   ├── useAsync.ts
│   │   └── useForm.ts
│   │
│   ├── db/                         # Database queries
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   └── subscriptions.ts
│   │
│   ├── constants/
│   │   ├── permissions.ts          # Role permissions
│   │   ├── roles.ts                # Role definitions
│   │   └── app.ts                  # App-wide constants
│   │
│   ├── types/
│   │   ├── auth.ts                 # Auth types
│   │   ├── customer.ts
│   │   ├── transaction.ts
│   │   ├── product.ts
│   │   ├── announcement.ts
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   ├── crypto/                     # Encryption utilities
│   │   └── encryption.ts
│   │
│   └── services/                   # Business logic
│       ├── customerService.ts
│       ├── transactionService.ts
│       ├── stockService.ts
│       ├── announcementService.ts
│       ├── reportService.ts
│       └── auditService.ts
│
├── public/                         # Static assets
│   ├── logo.png
│   ├── favicon.ico
│   └── ...
│
├── styles/
│   └── globals.css                 # Global styles
│
└── tests/                          # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 11. Design System & UI Patterns

### 11.1 Color Palette

```css
/* Primary Colors */
--color-primary: #0066cc; /* Professional blue */
--color-primary-light: #e6f0ff;
--color-primary-dark: #003d99;

/* Success / Status */
--color-success: #22c55e; /* Green */
--color-success-light: #dcfce7;
--color-success-dark: #15803d;

/* Warning / Alert */
--color-warning: #f59e0b; /* Amber */
--color-warning-light: #fef3c7;
--color-warning-dark: #b45309;

/* Danger / Error */
--color-danger: #ef4444; /* Red */
--color-danger-light: #fee2e2;
--color-danger-dark: #991b1b;

/* Neutral / Grayscale */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;

/* Semantic Colors */
--color-info: #3b82f6;
--color-low-stock: #f59e0b;
--color-out-of-stock: #ef4444;
--color-in-stock: #22c55e;
```

### 11.2 Typography

```css
/* Font Families */
--font-sans:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--line-tight: 1.25;
--line-normal: 1.5;
--line-relaxed: 1.625;
--line-loose: 2;
```

### 11.3 Spacing & Layout

```css
/* Spacing Scale */
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */

/* Border Radius */
--radius-sm: 0.125rem; /* 2px */
--radius-base: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 1rem; /* 16px */
--radius-2xl: 1.5rem; /* 24px */

/* Box Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### 11.4 Responsive Breakpoints

```css
/* Tailwind breakpoints */
--breakpoint-sm: 640px; /* Mobile */
--breakpoint-md: 768px; /* Tablet */
--breakpoint-lg: 1024px; /* Desktop */
--breakpoint-xl: 1280px; /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### 11.5 Component Patterns

**Button Variants:**

```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Cancel</Button>
<Button disabled>Disabled</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Card Layout:**

```tsx
<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

**Status Indicators:**

```
✓ Completed - Green badge
⏱ Pending - Amber badge
✗ Failed - Red badge
! Alert - Red icon + text
```

### 11.6 Accessibility Implementation

```typescript
// WCAG 2.1 AA Compliance

// 1. Semantic HTML
<button type="button" aria-label="Close dialog">
  <X />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

<main role="main">
  {/* Main content */}
</main>

// 2. Color Contrast
// All text meets 4.5:1 contrast ratio for normal text
// 3:1 for large text (18px+ or 14px+ bold)

// 3. Keyboard Navigation
// All interactive elements are keyboard accessible
// Tab order follows logical flow
// Focus indicators are visible

// 4. Screen Reader Support
<img alt="Customer profile photo" src="/profile.jpg" />
<label htmlFor="customer-name">Customer Name</label>
<input id="customer-name" />

// 5. Form Error Messages
<div role="alert" className="text-red-600">
  {error}
</div>

// 6. Loading States
<div aria-live="polite" aria-busy="true">
  Loading data...
</div>
```

---

## 12. Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Assessment: Is PBT Applicable?

The DH-BMS system involves a mix of application patterns. While UI rendering (Not PBT), simple CRUD operations (limited PBT), and infrastructure concerns (Not PBT) make up portions of the system, there are significant business logic components with universal properties that should hold across varied inputs:

- **Transaction charge calculation**: Universal property across all transaction amounts, types, and providers
- **Stock movement atomicity**: Invariant that stock is conserved in transfers
- **Audit log creation**: Property that all mutations are logged
- **Permission checks**: Universal role-based access properties
- **Data isolation**: Branch-level filtering properties

However, the majority of these are better tested through integration and example-based tests given their dependence on external systems (database, Supabase Auth, real-time subscriptions) and UI interactions. A focused property-based approach is recommended for core business logic only.

### Property 1: Service Charge Calculation Correctness

_For any_ valid transaction with an amount and type, the calculated service charge SHALL equal the amount multiplied by the configured rate percentage for that type, divided by 100.

**Validates: Requirements 2.2, 2.3**

**Implementation Note:**
This property should be tested with property-based tests generating:

- Various transaction amounts (0.01 to 999,999.99 ZWL)
- Both transaction types (international, local)
- Configured rates (0% to 100%)

The property: `serviceCharge = transactionAmount * ratePercentage / 100`

### Property 2: Total Amount Consistency

_For any_ valid transaction with amount and service charge, the total amount displayed to the user SHALL equal the sum of the transaction amount and the service charge.

**Validates: Requirements 2.3**

**Implementation Note:**
Property: `totalAmount = transactionAmount + serviceCharge`

### Property 3: Stock Transfer Atomicity

_For any_ valid stock transfer between branches, if the transfer is committed, then the source branch stock SHALL be decreased and the destination branch stock SHALL be increased by the same quantity, maintaining total stock conservation.

**Validates: Requirements 5.6**

**Implementation Note:**
Property: `source.stock_before - quantity = source.stock_after AND destination.stock_before + quantity = destination.stock_after`

This requires testing that failed transfers don't partially complete.

### Property 4: Low Stock Status Accuracy

_For any_ product, if its current stock level is at or below the reorder point, the system SHALL mark it as "Low Stock"; if above, it SHALL NOT be marked as "Low Stock".

**Validates: Requirements 6.1**

**Implementation Note:**
Property: `(stock_level <= reorder_point) ↔ (status = 'Low Stock')`

### Property 5: Audit Log Completeness

_For any_ data modification (create, update, delete) operation, an audit log entry SHALL be created containing the user ID, action type, resource type, resource ID, and timestamp.

**Validates: Requirements 18.1**

**Implementation Note:**
Property: For all mutations, `EXISTS(audit_log WHERE action_type = 'create|update|delete' AND user_id = current_user AND resource_id = affected_resource)`

### Property 6: Role-Based Access Control Enforcement

_For any_ user with a specific role attempting to access data outside their authorized scope, the system SHALL deny the request and return a 403 Forbidden error.

**Validates: Requirements 14.6, 14.7**

**Implementation Note:**
Property: Access check SHALL pass only if `user_role ∈ required_roles AND (user_branch = resource_branch OR user_role = 'super_admin')`

### Property 7: Branch-Level Data Isolation

_For any_ non-super-admin user, the system SHALL only return records associated with their assigned branch, regardless of filters or parameters provided.

**Validates: Requirements 15.2, 15.3, 15.7**

**Implementation Note:**
Property: RLS policies and server-side filtering ensure `returned_records ⊆ {records WHERE branch_id = user_branch_id}`

### Property 8: Customer-Transaction Linkage

_For any_ transaction, the customer ID in the transaction record SHALL correspond to a valid customer in the system, and that customer SHALL be retrievable from the transaction detail view.

**Validates: Requirements 3.1, 3.6**

**Implementation Note:**
Property: `EXISTS(customer WHERE id = transaction.customer_id)` for all transaction records

### Property 9: Announcement Target Resolution

_For any_ announcement, the set of users to whom it is visible SHALL be exactly those matching the announcement's target criteria (branch, role, or specific users).

**Validates: Requirements 7.2, 7.5, 7.6**

**Implementation Note:**
Property: User receives announcement ↔ (user matches target branch AND user matches target role AND (no user whitelist OR user in whitelist))

### Property 10: Status Transition Validity

_For any_ transaction status change, the new status SHALL be a valid transition from the current status according to the defined state machine (only allowed: pending→completed, pending→failed, any→pending for corrections).

**Validates: Requirement 2.9**

**Implementation Note:**
Property: Valid transitions are `(pending → completed | failed) | (* → pending)` only

---

## 13. Testing Strategy

Given the mixed nature of the DH-BMS system, a dual-layer testing approach is recommended:

### 13.1 Property-Based Testing (Where Applicable)

Use property-based testing libraries like `fast-check` (TypeScript/JavaScript) for core business logic:

```typescript
// Example: Transaction charge calculation property test
import fc from 'fast-check';

describe('Transaction Service Charge Calculation', () => {
  // Feature: Define Horizon BMS, Property 1: Service Charge Calculation Correctness
  test('should calculate correct service charge', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999 }), // amount
        fc.integer({ min: 0, max: 100 }), // rate percentage
        (amount, rate) => {
          const serviceCharge = calculateServiceCharge(amount, rate);
          const expected = (amount * rate) / 100;
          expect(Math.abs(serviceCharge - expected)).toBeLessThan(0.01); // rounding
        }
      )
    );
  });
});
```

### 13.2 Unit Tests

Example-based unit tests for specific functionality:

```typescript
describe('CustomerService', () => {
  test('should create customer with all required fields', async () => {
    const customer = await createCustomer({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+2639123456',
      customerType: 'individual',
      branchId: branch.id,
    });

    expect(customer.id).toBeDefined();
    expect(customer.firstName).toBe('John');
  });

  test('should mask phone number in list view', () => {
    const masked = maskPhoneNumber('+2639123456');
    expect(masked).toBe('+263 XXXX X56');
  });
});
```

### 13.3 Integration Tests

Test database operations, API endpoints, and authorization:

```typescript
describe('Transaction API', () => {
  test('should create transaction with service charge calculation', async () => {
    const response = await POST(
      '/api/transactions',
      {
        customerId: customer.id,
        providerId: provider.id,
        transactionType: 'international',
        amount: 1000,
      },
      { headers: { Authorization: authToken } }
    );

    expect(response.status).toBe(201);
    expect(response.data.serviceCharge).toBe(100); // 10% of 1000
    expect(response.data.totalAmount).toBe(1100);
  });

  test('should respect branch-level access control', async () => {
    const branchBUser = createUser({ branchId: branchB.id });
    const response = await GET(
      '/api/transactions',
      { branchId: branchA.id },
      { headers: { Authorization: branchBUser.token } }
    );

    expect(response.status).toBe(403);
  });
});
```

### 13.4 End-to-End Tests

Test complete user workflows using Playwright or Cypress:

```typescript
test('should complete customer registration workflow', async ({ page }) => {
  await page.goto('/customers/new');

  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="phoneNumber"]', '+2639123456');
  await page.selectOption('[name="customerType"]', 'individual');

  await page.click('button:has-text("Create Customer")');

  await expect(page).toHaveURL('/customers/*');
  await expect(page.locator('text=John Doe')).toBeVisible();
});
```

### 13.5 Coverage Targets

- Unit Tests: 80% code coverage target
- Integration Tests: All API endpoints
- E2E Tests: Critical user workflows
- Property Tests: Core business logic only

---

## 14. Error Handling

### 14.1 Frontend Error Handling

```typescript
// Toast notification system for user feedback
export function showError(message: string, duration = 5000) {
  toast.error(message, { duration });
}

// Form validation errors
{errors.email && (
  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
)}

// API error handling
async function createTransaction(data) {
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return await response.json();
  } catch (error) {
    showError(error.message);
    throw error;
  }
}
```

### 14.2 Backend Error Handling

All errors follow a consistent structure with appropriate HTTP status codes and descriptive messages without exposing system internals.

---

## Summary

The Define Horizon Business Management System is designed as a modern, secure, scalable business management platform. The architecture emphasizes:

1. **Security**: Row-level security, role-based access control, branch-level isolation, encrypted communications
2. **Performance**: Indexed queries, pagination, lazy loading, efficient caching strategies
3. **Maintainability**: TypeScript strict mode, modular component structure, clear separation of concerns
4. **Usability**: Professional SaaS-style interface, responsive design, WCAG accessibility compliance
5. **Auditability**: Comprehensive audit logging, immutable records, compliance tracking

The system serves multiple user roles across multiple branches while maintaining data integrity and security through technical controls and architectural patterns.
