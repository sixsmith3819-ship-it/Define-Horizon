# Define Horizon BMS - Transactions Module Documentation

## Overview

The Transactions Module is a complete financial transaction recording system with automatic service charge calculation. It features real-time charge calculation, transaction management, and comprehensive filtering/search capabilities.

## Components Implemented

### 1. Utilities

#### `lib/utils/service-charge.ts`

- **`calculateServiceCharge(amount, type, rates)`**: Calculates service charge based on amount and transaction type (8% domestic, 10% international)
- **`calculateTotalAmount(amount, type, rates)`**: Returns total amount (amount + charge)
- **`getServiceChargeRate(type, rates)`**: Returns the rate percentage for a type
- **`formatServiceChargeCalculation(amount, charge, total, type)`**: Returns formatted calculation string

### 2. Validation

#### `lib/validations/transaction.ts`

Zod schemas and types for:

- `createTransactionSchema`: Validates transaction creation input
- `updateTransactionStatusSchema`: Validates status updates
- `transactionFiltersSchema`: Validates filter parameters
- TypeScript interfaces: `Transaction`, `TransactionWithCustomer`, `Customer`, `ServiceChargeRate`

### 3. API Routes

#### `app/api/transactions/route.ts`

- **GET**: Fetch all transactions with filters (status, type, customer, date range, pagination)
- **POST**: Create new transaction with automatic service charge calculation
  - Fetches current rates from database
  - Calculates charges and totals
  - Validates input with Zod
  - Returns created transaction with customer details

#### `app/api/transactions/[id]/route.ts`

- **GET**: Retrieve single transaction by ID
- **PATCH**: Update transaction status (one-way state machine: pending → completed/failed)
  - Records status change in history
  - Validates valid state transitions
  - Optional reason for status change
- **DELETE**: Soft delete by marking as failed

### 4. UI Components

#### `components/transactions/service-charge-calculator.tsx`

Real-time calculation display showing:

- Transaction amount
- Service charge with percentage
- Total amount
- Formatted calculation breakdown

Features:

- Professional styling with blue highlight
- Clear visual hierarchy
- Percentage indicator (8% or 10%)

#### `components/transactions/transaction-form.tsx`

Complete transaction creation form with:

- Customer selection (dropdown from API)
- Amount input with real-time calculation
- Transaction type (domestic/international)
- Payment method (bank_transfer, cash, mobile_money, cheque)
- Reference number and description fields
- Real-time service charge display
- Form validation with React Hook Form + Zod
- Disabled submit until valid

#### `components/transactions/transaction-table.tsx`

Transaction list table displaying:

- Date, Customer name/email, Transaction type
- Amount, Service charge, Total amount
- Payment method, Status, Actions
- Status badges (pending/yellow, completed/green, failed/red)
- Type badges (domestic/blue, international/purple)
- View and Edit action buttons
- Empty state with link to create new transaction

### 5. Pages

#### `app/(dashboard)/transactions/page.tsx`

**Transactions List Page**

- Displays all transactions in responsive table
- Real-time filters:
  - Status filter (pending, completed, failed)
  - Transaction type filter (domestic, international)
  - Customer search by name or email
  - Clear filters button
- Summary showing total transactions
- Error handling and loading states
- "New Transaction" button
- Empty state with call-to-action

#### `app/(dashboard)/transactions/new/page.tsx`

**Create Transaction Page**

- Header with back navigation
- Customer list fetched from API
- Transaction form with real-time calculation
- Service charge rate information box
- Success message with transaction ID
- Auto-redirect to transaction detail on success
- Error handling with user-friendly messages
- Link to create customer if none exist

#### `app/(dashboard)/transactions/[id]/page.tsx`

**Transaction Detail/Edit Page**

- Full transaction information display
- Customer information section
- Transaction details (type, method, reference)
- Amount breakdown showing:
  - Transaction amount
  - Service charge with percentage
  - Total amount (highlighted)
- Notes/description section
- Status update panel (right sidebar):
  - Status dropdown (pending, completed, failed)
  - Optional reason textarea
  - One-way state machine validation
  - Update button
- Back navigation
- Error handling for not found transactions

## Service Charge Calculation

### Business Logic

```
Domestic Transaction (8% charge):
  Amount = 1000
  Service Charge = 1000 * 0.08 = 80
  Total = 1080

International Transaction (10% charge):
  Amount = 1000
  Service Charge = 1000 * 0.10 = 100
  Total = 1100
```

### Real-Time Calculation

- Updates immediately as user changes amount or transaction type
- Rounds to 2 decimal places
- Shows calculation breakdown to user before submission
- Configurable rates from database (falls back to defaults)

## Data Flow

### Creating a Transaction

1. User fills transaction form (customer, amount, type, method)
2. Component calculates service charge in real-time
3. User sees calculation breakdown and reviews total
4. User clicks "Create Transaction"
5. API validates input with Zod schema
6. API fetches current service charge rate from database
7. API calculates charges with rates
8. API creates transaction record in Supabase
9. Success message shows transaction ID
10. User redirected to transaction detail page

### Updating Transaction Status

1. User selects new status from dropdown
2. User optionally adds reason
3. User clicks "Update Status"
4. API validates status transition is valid
5. API records status change in history table
6. API updates transaction status
7. User sees success confirmation

## Features

✅ **Automatic Service Charge Calculation**

- Real-time calculation as user types
- Configurable rates from database
- Proper decimal rounding

✅ **Comprehensive Filtering**

- By status (pending, completed, failed)
- By transaction type (domestic, international)
- By customer (name or email search)
- Clear filters option

✅ **Transaction Management**

- Create, read, update, delete (soft delete)
- Status state machine (one-way transitions)
- Status change history tracking
- Full audit trail

✅ **Professional UI**

- Responsive design (desktop, tablet, mobile)
- Color-coded status and type badges
- Clear visual hierarchy
- Loading and error states
- Empty state handling

✅ **Type Safety**

- Full TypeScript support
- Zod validation schemas
- Type-safe API responses
- Compile-time type checking

✅ **Form Validation**

- Client-side with React Hook Form + Zod
- Server-side with Zod
- Real-time validation feedback
- Disabled submit until valid

## API Endpoints

| Method | Endpoint                 | Description                                   |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/api/transactions`      | List transactions (with filters & pagination) |
| POST   | `/api/transactions`      | Create new transaction                        |
| GET    | `/api/transactions/[id]` | Get single transaction                        |
| PATCH  | `/api/transactions/[id]` | Update transaction status                     |
| DELETE | `/api/transactions/[id]` | Soft delete transaction                       |

## Database Tables Used

- `transactions`: Main transaction records
- `transaction_status_history`: Status change audit trail
- `transaction_rates`: Service charge rates by type
- `customers`: Customer information (lookup)

## Dependencies

- `react-hook-form`: Form state management
- `@hookform/resolvers`: Zod integration for forms
- `zod`: Schema validation
- `date-fns`: Date formatting
- `lucide-react`: Icons
- `@supabase/supabase-js`: Database client

## Testing Checklist

✅ Build passes with `npm run build`

**Manual Testing:**

- [ ] Create domestic transaction (8% charge)
- [ ] Create international transaction (10% charge)
- [ ] Verify service charge calculation is correct
- [ ] View transaction detail page
- [ ] Update transaction status (pending → completed)
- [ ] Search transactions by customer name
- [ ] Filter by status
- [ ] Filter by type
- [ ] Verify empty state when no transactions
- [ ] Error handling for missing customer
- [ ] Error handling for invalid amounts

**API Testing:**

- [ ] POST /api/transactions with valid data
- [ ] GET /api/transactions with filters
- [ ] GET /api/transactions/[id]
- [ ] PATCH /api/transactions/[id] with valid status
- [ ] Invalid status transition returns 400

## Future Enhancements

- Export transactions to CSV/PDF
- Bulk status updates
- Advanced analytics dashboard
- Service provider integration
- Multi-currency support
- Payment gateway integration
- Automatic rate updates from providers
