# Complete Project Directory Structure

## Define Horizon Business Management System (DH-BMS)

Created: Task 1.4 - Project Setup & Infrastructure

---

## Directory Tree

```
Define Horizon/
├── .kiro/                              # Kiro configuration (specs, design, tasks)
│   └── specs/define-horizon-bms/
│
├── app/                                # Next.js App Router routes
│   ├── (auth)/                         # Authentication routes (public)
│   ├── (dashboard)/                    # Protected dashboard routes
│   ├── api/                            # API endpoints
│   └── middleware.ts                   # Next.js middleware (to be created)
│
├── components/                         # Reusable React components
│   ├── ui/                             # Base UI components (Button, Input, etc.)
│   ├── layout/                         # Layout components (Sidebar, Header, etc.)
│   ├── common/                         # Common components (Loading, Error, etc.)
│   ├── forms/                          # Domain-specific forms (Customer, Transaction, etc.)
│   └── charts/                         # Data visualization components
│
├── lib/                                # Business logic & utilities
│   ├── api/                            # API client utilities
│   │   └── index.ts                    # API exports (barrel)
│   ├── auth/                           # Authentication utilities
│   │   └── index.ts                    # Auth exports (barrel)
│   ├── schemas/                        # Zod validation schemas
│   │   └── index.ts                    # Schema exports (barrel)
│   ├── store/                          # State management (Zustand, Context)
│   │   └── index.ts                    # Store exports (barrel)
│   ├── utils/                          # General utilities
│   │   └── index.ts                    # Utility exports (barrel)
│   ├── hooks/                          # Custom React hooks
│   │   └── index.ts                    # Hook exports (barrel)
│   ├── db/                             # Database access layer
│   │   └── index.ts                    # DB exports (barrel)
│   ├── constants/                      # Application constants
│   │   └── index.ts                    # Constant exports (barrel)
│   ├── crypto/                         # Cryptography & security utilities
│   │   └── index.ts                    # Crypto exports (barrel)
│   └── services/                       # Business logic services
│       └── index.ts                    # Service exports (barrel)
│
├── public/                             # Static assets (images, documents)
│   └── .gitkeep                        # Preserve directory in git
│
├── styles/                             # Global stylesheets
│   └── .gitkeep                        # Preserve directory in git
│       (contains: globals.css, variables.css, animations.css)
│
├── tests/                              # Test files
│   └── .gitkeep                        # Preserve directory in git
│
├── supabase/                           # Database & backend
│   ├── migrations/                     # Database migration files
│   │   └── .gitkeep                    # Preserve directory in git
│   └── seed/                           # Database seeding scripts
│       └── .gitkeep                    # Preserve directory in git
│
├── tsconfig.json                       # TypeScript configuration with path aliases
├── README.md                           # Project documentation
├── DIRECTORY_STRUCTURE.md              # This file
└── package.json                        # Project dependencies (created by task 1.1)
```

---

## Directory Details

### `/app` - Application Routes

#### Structure

```
app/
├── (auth)/
│   ├── login/
│   ├── reset-password/
│   ├── register/
│   └── layout.tsx
│
├── (dashboard)/
│   ├── customers/
│   ├── transactions/
│   ├── inventory/
│   ├── announcements/
│   ├── admin/
│   ├── analytics/
│   └── layout.tsx
│
├── api/
│   ├── customers/
│   ├── transactions/
│   ├── products/
│   ├── announcements/
│   └── auth/
│
└── middleware.ts
```

**Purpose:** Next.js App Router convention. All files here represent routes or API endpoints.

---

### `/components` - Reusable Components

#### `/components/ui`

Base, unstyled or minimally styled components:

- Button.tsx
- Input.tsx
- Select.tsx
- Modal.tsx
- Card.tsx
- Table.tsx
- Toast.tsx
- Alert.tsx

#### `/components/layout`

Layout wrapper components:

- Sidebar.tsx
- Header.tsx
- Footer.tsx
- DashboardLayout.tsx
- AuthLayout.tsx

#### `/components/common`

Common utility components:

- LoadingSpinner.tsx
- EmptyState.tsx
- ErrorBoundary.tsx
- NotFound.tsx

#### `/components/forms`

Domain-specific form components:

- CustomerForm.tsx
- TransactionForm.tsx
- ProductForm.tsx
- AnnouncementForm.tsx
- UserForm.tsx

#### `/components/charts`

Data visualization components:

- TransactionTrendChart.tsx
- CustomerAnalyticsChart.tsx
- StockAnalyticsChart.tsx
- ProviderPerformanceChart.tsx

---

### `/lib` - Business Logic & Utilities

Each subdirectory has an `index.ts` barrel export file for clean imports.

#### `/lib/api`

API client utilities and integration functions.

**Example exports:**

```typescript
export { fetchCustomers, createCustomer } from './customers';
export { supabaseClient } from './client';
```

#### `/lib/auth`

Authentication and authorization utilities.

**Example exports:**

```typescript
export { useAuth, useUser } from './hooks';
export { supabaseClient } from './supabase';
export { checkPermission } from './permissions';
```

#### `/lib/schemas`

Zod validation schemas for type safety.

**Example exports:**

```typescript
export { CustomerCreateSchema, CustomerUpdateSchema } from './customer';
export { TransactionSchema } from './transaction';
```

#### `/lib/store`

State management (Zustand stores or React Context).

**Example exports:**

```typescript
export { useBranchStore } from './branch';
export { useAuthStore } from './auth';
```

#### `/lib/utils`

General-purpose utility functions.

**Example exports:**

```typescript
export { cn, formatCurrency, formatPhoneNumber } from './formatting';
export { sleep, retry } from './async';
```

#### `/lib/hooks`

Custom React hooks for common patterns.

**Example exports:**

```typescript
export { useAuth } from './useAuth';
export { useBranch } from './useBranch';
export { useAsync } from './useAsync';
```

#### `/lib/db`

Database access layer and query functions.

**Example exports:**

```typescript
export { getCustomer, listCustomers } from './customers';
export { getTransaction, createTransaction } from './transactions';
```

#### `/lib/constants`

Application constants and configuration.

**Example exports:**

```typescript
export { ROLES, PERMISSIONS } from './auth';
export { TRANSACTION_STATUS, STOCK_STATUS } from './status';
```

#### `/lib/crypto`

Cryptography and security utilities.

**Example exports:**

```typescript
export { encrypt, decrypt } from './encryption';
export { generateSecureToken } from './tokens';
```

#### `/lib/services`

Business logic services and domain operations.

**Example exports:**

```typescript
export { calculateServiceCharge } from './transactions';
export { getStockStatus, checkLowStock } from './inventory';
```

---

### `/public` - Static Assets

Static files served directly without processing.

**Contents:**

- `logo.png` - Brand logo
- `icons/` - Icon files
- `documents/` - PDF documents
- `images/` - Screenshots, graphics

---

### `/styles` - Global Styles

**Files to create:**

- `globals.css` - Global styles and Tailwind directives
- `variables.css` - CSS custom properties (colors, spacing)
- `animations.css` - Custom animations

---

### `/tests` - Test Files

**Structure:**

```
tests/
├── unit/
│   ├── utils/
│   ├── schemas/
│   └── services/
├── integration/
├── components/
└── fixtures/
```

**Testing frameworks:** Vitest or Jest with React Testing Library

---

### `/supabase` - Database & Backend

#### `/supabase/migrations`

Sequentially numbered database migration files.

**Example files:**

- `001_create_profiles_table.sql`
- `002_create_customers_table.sql`
- `003_create_transactions_table.sql`

#### `/supabase/seed`

Database seeding scripts for development.

**Files:**

- `seed.sql` - SQL seed data
- `seed.ts` - TypeScript seeding script

---

## TypeScript Path Aliases

All configured in `tsconfig.json` for clean imports.

### Usage Examples

**Instead of:**

```typescript
import { useAuth } from '../../../lib/auth/hooks';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../lib/utils/formatting';
```

**Use:**

```typescript
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
```

### All Available Aliases

| Alias                   | Maps To            |
| ----------------------- | ------------------ |
| `@/*`                   | Root (`./*`)       |
| `@/app/*`               | Application routes |
| `@/components/*`        | All components     |
| `@/components/ui/*`     | UI components      |
| `@/components/layout/*` | Layout components  |
| `@/components/common/*` | Common components  |
| `@/components/forms/*`  | Form components    |
| `@/components/charts/*` | Chart components   |
| `@/lib/*`               | All lib utilities  |
| `@/lib/api/*`           | API utilities      |
| `@/lib/auth/*`          | Auth utilities     |
| `@/lib/schemas/*`       | Zod schemas        |
| `@/lib/store/*`         | State management   |
| `@/lib/utils/*`         | Utility functions  |
| `@/lib/hooks/*`         | React hooks        |
| `@/lib/db/*`            | Database layer     |
| `@/lib/constants/*`     | Constants          |
| `@/lib/crypto/*`        | Crypto utilities   |
| `@/lib/services/*`      | Business services  |
| `@/styles/*`            | Styles             |
| `@/public/*`            | Public assets      |

---

## File Organization Guidelines

### Component Files

- **Location:** `components/[category]/ComponentName.tsx`
- **Exports:** Re-export from `components/[category]/index.ts`
- **Import:** `import { ComponentName } from '@/components/[category]'`

### Utility Functions

- **Location:** `lib/utils/utilityName.ts`
- **Exports:** Re-export from `lib/utils/index.ts`
- **Import:** `import { utilityName } from '@/lib/utils'`

### Validation Schemas

- **Location:** `lib/schemas/entityName.ts`
- **Exports:** Re-export from `lib/schemas/index.ts`
- **Import:** `import { EntitySchema } from '@/lib/schemas'`

### Database Queries

- **Location:** `lib/db/entityName.ts`
- **Exports:** Re-export from `lib/db/index.ts`
- **Import:** `import { getEntity } from '@/lib/db'`

### React Hooks

- **Location:** `lib/hooks/useHookName.ts`
- **Exports:** Re-export from `lib/hooks/index.ts`
- **Import:** `import { useHookName } from '@/lib/hooks'`

### Tests

- **Location:** `tests/[category]/componentName.test.ts`
- **Pattern:** One test file per source file with `.test.ts` suffix

---

## Next Steps

After this setup (Task 1.4), the following tasks should be executed:

1. **Task 1.5** - Install and configure core dependencies
   - React Hook Form, Zod, Recharts, Lucide React
   - Testing libraries (Vitest or Jest)
   - Utility libraries (date-fns, clsx)

2. **Task 1.6** - Set up ESLint, Prettier, and code quality tools
   - ESLint configuration
   - Prettier setup
   - Pre-commit hooks

3. **Task 1.7** - Create global styles and design system
   - Tailwind CSS configuration
   - CSS variables
   - Theme setup

4. **Task 1.8** - Set up application layout and routing
   - Root layout.tsx
   - Auth layout
   - Dashboard layout
   - Middleware

---

## Verification Checklist

- [x] All required directories created
- [x] TypeScript path aliases configured in tsconfig.json
- [x] Directory structure matches design specification
- [x] README.md documents folder structure
- [x] Index.ts files created in all lib subdirectories
- [x] .gitkeep files added to empty directories
- [x] Import paths configured for clean imports (e.g., `@/components/ui/Button`)
- [x] All directories organized logically
- [x] File organization ready for feature modules

---

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [TypeScript Path Mapping](https://www.typescriptlang.org/tsconfig#paths)
- [Project Structure Best Practices](https://nextjs.org/docs/getting-started/project-structure)
