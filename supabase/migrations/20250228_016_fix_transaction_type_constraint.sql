-- Migration: Fix transaction_type check constraint
-- Date: 2025-02-31

-- Drop existing constraint if it exists
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

-- Add new constraint with correct values
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type IN ('domestic', 'international'));