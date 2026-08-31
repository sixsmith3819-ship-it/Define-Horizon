-- Migration: Add all missing columns to transactions table
-- Date: 2025-02-28

-- Add payment_method column
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add service_charge column
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS service_charge DECIMAL(10, 2) DEFAULT 0.00;

-- Add total_amount column
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Add status column
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Add transaction_type column
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) CHECK (transaction_type IN ('domestic', 'international'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON public.transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON public.transactions(transaction_type);